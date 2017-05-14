import {
  BaseModule , _Math , Helpers
} from 'urndr.js'

export const StrokeWiggle = () => {
  const module = new BaseModule("Wiggle",BaseModule.STROKE_MODULE)
  module.interval = 32;
  module.setConfiguration({
    amp : 5,
    all : true
  })
  module.setFunction( (strokes) => {
    const settings = module.settings;
    //
    let target_strokes;
    if (settings.all) {
      target_strokes = strokes.list
    } else {
      target_strokes = [ strokes.activeStroke ]
    }
    //
    for (var st = 0, max = target_strokes.length; st < max; st ++ ) {
      const stroke_k = target_strokes[st]
      stroke_k.setTrack( "X" , Helpers.randomizeArray( stroke_k.getTrack("X") , settings.amp ) )
      stroke_k.setTrack( "Y" , Helpers.randomizeArray( stroke_k.getTrack("Y") , settings.amp ) )
      const bamp = settings.amp * 0.001;
      stroke_k.setTrack( "BU" , Helpers.randomizeArray( stroke_k.getTrack("BU") , bamp ) )
      stroke_k.setTrack( "BV" , Helpers.randomizeArray( stroke_k.getTrack("BV") , bamp ) )
      stroke_k.setTrack( "BW" , Helpers.randomizeArray( stroke_k.getTrack("BW") , bamp ) )
    }
  })
  return module
}

export const StrokeFade = () => {
  var module = new BaseModule("Fade Strokes",BaseModule.STROKE_MODULE)
  module.interval = 40;
  module.setConfiguration({
    all : true,
    speed : 2
  })
  function fade( stroke , settings ){

    const len = stroke.length
    let n = stroke.getTag("fade_strokes") || 0

    let pnt = null
    for ( let i = 0; i < len; i++ ) {

      if ( i < n ) {
        pnt = stroke.points[ i ];
        pnt.A = pnt.A < 0.05 ? 0 : pnt.A * _Math.map( settings.speed , 1 , 5 , 1 , 0.6)
      } else {
        break;
      }

    }

    n = Math.min( n + settings.speed , len);
    stroke.setTag("fade_strokes", n )

  }
  module.setFunction(function(strokes) {

    var settings = module.getConfiguration()
    if (settings.all) {
      strokes.eachStroke( fade , settings );
    } else {
      var stroke = strokes.activeStroke
      if ( stroke === 0 ) {return 0;}
      fade( stroke , settings );
    }

  })
  return module
}

export const DeleteFlaggedStroke = () => {
  var module = new BaseModule("Garbage Collection",BaseModule.STROKE_MODULE)
  module.interval = 1000;
  const destroyStroke = (stroke,strokes) => {
    if (strokes.activeStroke === stroke) {
      strokes.activeStroke = 0
    }
    stroke.destroy()
  }
  module.setFunction( function(strokes){
    strokes.list = strokes.list.filter((stroke)=>{
      if (stroke.points.length === 1) {
        destroyStroke(stroke,strokes)
        return false
      }
      if (stroke.points.reduce((acc, point)=>{
        return acc + point.A
      },0) <= 0.01) {
        destroyStroke(stroke,strokes)
        return false
      }
      return true
    })
  })
  module.createUI = () => {}
  return module;
}

export const SmoothStroke = () => {
  var module = new BaseModule("Smooth",BaseModule.STROKE_MODULE)
  module.interval = 85;
  //
  module.setConfiguration({ length: 60, factor: 13 })
  module.setFunction(function(strokes) {

    strokes.eachStroke( ( stroke ) => { _smooth( stroke ) } )
    function _smooth( stroke ) {
      stroke.eachPoint( function(cur,stk,i) {

        if (cur.bound) { return 0 }
        const prv = stk.getPoint(i - 1)
        const nxt = stk.getPoint(i + 1)
        if (prv == 0 || nxt == 0) { return 0 }

        const vprv = [prv.X - cur.X,prv.Y - cur.Y]
        const vnxt = [nxt.X - cur.X,nxt.Y - cur.Y]
        const dprv = prv.distanceTo( cur )
        const dnxt = nxt.distanceTo( cur )
        const cosa = (vprv[0] * vnxt[0] + vprv[1] * vnxt[1]) / (dprv * dnxt)
        // 180 > -1 & 0 > 1

        // Smooth: agle less than 120 deg = PI * 0.75
        const factor_1 = _Math.clamp( _Math.map( cosa , -0.5 , 1 , 0 , 0.1 ) , 0.01 , 0.1 )
        const factor_2 = factor_1 * 0.3;

        cur.X += ( vprv[0] + vnxt[0] ) * factor_1;
        cur.Y += ( vprv[1] + vnxt[1] ) * factor_1;
        if (!prv.bound) {
          prv.X += - vprv[0] * factor_2;
          prv.Y += - vprv[1] * factor_2;
        }
        if (!nxt.bound) {
          nxt.X += - vnxt[0] * factor_2;
          nxt.Y += - vnxt[1] * factor_2;
        }

      } , stroke )
    }

  })
  return module
}

export const Stroke3DMapping = ({canvasManager,threeManager}) => {
  var module = new BaseModule("3D MAGIC",BaseModule.STROKE_MODULE)
  module.interval = 20
  const _ep = ( point , stroke , i ) => {

    if ( point.FACE && point.OBJECT ) {

      // It is a 3D point!
      var obj = point.OBJECT
      var face = point.FACE

      // transform it
      var a,b,c,p;
      a = obj.localToWorld( obj.getMorphedVertex( face.a ) ).project(threeManager.camera)
      b = obj.localToWorld( obj.getMorphedVertex( face.b ) ).project(threeManager.camera)
      c = obj.localToWorld( obj.getMorphedVertex( face.c ) ).project(threeManager.camera)
      p = _Math.coordinateToPixel(
        a.x * point.BU + b.x * point.BV + c.x * point.BW,
        a.y * point.BU + b.y * point.BV + c.y * point.BW,
        canvasManager.width,
        canvasManager.height
      )

      point.X = p.x
      point.Y = p.y

    } else {

      const near = stroke.getNearestPointWith( "FACE" , i );
      if (near !== 0) {

        const before_present = near.before !== 0;
        const after_present = near.after !== 0;

        if ( before_present && after_present ) {

          const a = 1 / ( near.after_distance + near.before_distance )

          point.X += ( near.before.PX * near.after_distance + near.after.PX * near.before_distance ) * a
          point.Y += ( near.before.PY * near.after_distance + near.after.PY * near.before_distance ) * a

        } else if ( before_present || after_present ) {

          if ( before_present ) {

            point.X += near.before.PX
            point.Y += near.before.PY

          } else {

            point.X += near.after.PX
            point.Y += near.after.PY

          }

        }

      }

    }

  }
  module.setFunction(function(strokes) {
    strokes.eachStroke( ( stroke , strokes , i ) => {
      stroke.eachPoint( _ep , stroke )
    } , strokes )
  })
  module.createUI = () => {}
  return module
}
