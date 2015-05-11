MODULES.loadModules( {

// COMMANDS

draw : function() {
    var module = new URNDR.Module("Draw",URNDR.COMMAND_MODULE,82) // r
    module.setFunction(function() {
        PEN.selectToolByName("Draw");
        return "";
    })
    return module
},

hideModels : function() {
    var module = new URNDR.Module("Toggle UI",URNDR.COMMAND_MODULE,72) // m = 77 // h = 72
    module.setConfiguration({
        $dom: $("#canvas_three")
    })
    module.setFunction(function() {
        $("#canvas_three,#HUD").fadeToggle();
        return "";
    })
    return module
},

eraser : function() {
    var module = new URNDR.Module("Eraser",URNDR.COMMAND_MODULE,69) // e
    module.setFunction(function() {
        PEN.selectToolByName("Eraser"); return "Make Invisible"
    })
    return module
},

mover : function() {
    var module = new URNDR.Module("Mover",URNDR.COMMAND_MODULE,81) // q
    module.setFunction(function() {
        PEN.selectToolByName("Mover"); return "Transform Objects"
    })
    return module
},

selector : function() {
    var module = new URNDR.Module("Selector",URNDR.COMMAND_MODULE,83) // s
    module.setFunction(function() {
        PEN.selectToolByName("Stroke Selector"); return "Select Point"
    })
    return module
},

clear_canvas : function() {
    var module = new URNDR.Module("Clear Canvas",URNDR.COMMAND_MODULE,32)
    module.setFunction(function(){
        STROKES.reset();
        return "";
    })
    return module
},

brush_size_up : function() {
    var module = new URNDR.Module("Increase Brush Size",URNDR.COMMAND_MODULE,221)
    module.setFunction(function(){
        STYLE.brush_size += 5;
        return STYLE.brush_size;
    })
    return module
},

brush_size_down : function() {
    var module = new URNDR.Module("Reduce brush size",URNDR.COMMAND_MODULE,219)
    module.setFunction(function(){
        STYLE.brush_size = STYLE.brush_size > 5 ? STYLE.brush_size - 5 : 5;
        return STYLE.brush_size;
    })
    return module
},

speed_up : function() {
    var module = new URNDR.Module("Speed Up",URNDR.COMMAND_MODULE,38)
    module.setFunction(function(){
        U3.speed = U3.speed <= 57.5 ? U3.speed + 2.5 : 60; return U3.speed;
    })
    return module
},

speed_down : function() {
    var module = new URNDR.Module("Speed Down",URNDR.COMMAND_MODULE,40)
    module.setFunction(function(){
        U3.speed = U3.speed >= 2.5 ? U3.speed - 2.5 : 0;
        return U3.speed;
    })
    return module
},

prev_model : function() {
    var module = new URNDR.Module("Previous Model",URNDR.COMMAND_MODULE,37)
    module.setFunction(function(){
        U3.activeModel -= 1;
        if (U3.activeModel < 0) {
            U3.activeModel = U3.count - 1;
        }
        U3.solo( U3.activeModel );
        return "#"+U3.activeModel;
    })
    return module
},

next_model : function() {
    var module = new URNDR.Module("Next Model",URNDR.COMMAND_MODULE,39)
    module.setFunction(function(){
        U3.activeModel += 1;
        if (U3.activeModel === U3.count) {
            U3.activeModel = 0;
        }
        U3.solo( U3.activeModel );
        return "#"+U3.activeModel;
    })
    return module
},

// STYLE MODULES
// When user's drawing and you want to do something realtime. 

random_stroke_color : function() {
    var module = new URNDR.Module("Random Stroke Color",URNDR.STYLE_MODULE,65);
    module.setFunction(function(STYLE) {
        STYLE.color[0] = URNDR.Helpers.randomNumber(255,{round: true});
        STYLE.color[1] = URNDR.Helpers.randomNumber(255,{round: true});
        STYLE.color[2] = URNDR.Helpers.randomNumber(255,{round: true});
    })
    return module
},

// POINT DATA MODULES

random_point_position : function() {
    var module = new URNDR.Module("Random Point",URNDR.POINT_MODULE,68);
    // 
    module.setConfiguration({amp : 60})
    module.setFunction(function( point ) {
        var amp = this.getConfiguration().amp;
        var half = amp/2
        point.X += half - URNDR.Helpers.randomNumber(amp);
        point.Y += half - URNDR.Helpers.randomNumber(amp);
        // also mess with barycentric coordinate.
        if (point.BU || point.BV || point.BW) {
            point.BU += 0.2 - 0.4 * URNDR.Helpers.randomNumber(1)
            point.BV += 0.2 - 0.4 * URNDR.Helpers.randomNumber(1)
            point.BW += 0.2 - 0.4 * URNDR.Helpers.randomNumber(1)
        }
    })
    return module
},

pressure_sensitivity : function() {
    var module = new URNDR.Module("Pressure Sensitivity",URNDR.POINT_MODULE,99999,false);
    module.setConfiguration( {
        min_size : 5,
        max_size : 80
    } )
    module.setFunction(function(point) {
        var settings = this.getConfiguration()
        point.S *= PEN.pressure;
        if (point.S < settings.min_size) point.S = settings.min_size;
        if (point.s > settings.max_size) point.S = settings.max_size;
    })
    return module
},

// STROKE DATA MODULES

delete_flagged_strokes : function(){
    var module = new URNDR.Module("delete flagged strokes",URNDR.STROKE_MODULE,99,true);
    module.setFunction( function(strokes){
        var strokes_to_delete = [];
        strokes.eachStroke(function(stk){
            if (stk.flag_to_delete) {
                strokes_to_delete.push( stk.id )
                if (stk.id === strokes.active_stroke) {
                    strokes.active_stroke = 0;
                }
            }
        })
        for (var i in strokes_to_delete) { strokes.deleteStrokeByID( strokes_to_delete[i] ) }
    })
    return module;
},

move_drawing_with_3d_model : function() {
    var module = new URNDR.Module("MAGIC 001: 3D MAGIC",URNDR.STROKE_MODULE,85,true); //u
    module.setConfiguration({
        delayFactor : 0.2
    })
    module.setFunction(function(strokes) {

        var settings = this.getConfiguration()

        // iterate time
        strokes.eachStroke( es , strokes );
        function es( stroke , strokes , i ) {

            stroke.eachPoint( ep , stroke );
            function ep( point , stroke , i) {

                if ( point.FACE && point.OBJECT ) {

                    // It is a 3D point!
                    var obj = point.OBJECT
                    var face = point.FACE

                    // transform it
                    var a,b,c,p;
                    a = obj.localToWorld( obj.getMorphedVertex( face.a ) ).project(U3.camera)
                    b = obj.localToWorld( obj.getMorphedVertex( face.b ) ).project(U3.camera)
                    c = obj.localToWorld( obj.getMorphedVertex( face.c ) ).project(U3.camera)
                    p = URNDR.Math.coordinateToPixel(
                        a.x * point.BU + b.x * point.BV + c.x * point.BW, 
                        a.y * point.BU + b.y * point.BV + c.y * point.BW
                    )

                    // record this point's potential movement.
                    point.PX = (p.x - point.X) * settings.delayFactor
                    point.PY = (p.y - point.Y) * settings.delayFactor

                    // set point X Y
                    point.X += point.PX
                    point.Y += point.PY

                } else {

                    var near = stroke.getNearestPointWith( "FACE" , i );
                    if (near instanceof Object) {

                        var before_present = near.before instanceof URNDR.Point;
                        var after_present = near.after instanceof URNDR.Point;

                        if ( before_present && after_present ) {

                            var a = 1 / ( near.after_distance + near.before_distance )

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


        }

    })
    return module
},

expand : function() {
    var module = new URNDR.Module("Expand",URNDR.STROKE_MODULE,999,false); // g
    module.setConfiguration({ speed : 2 });
    module.setFunction(function(strokes){
        var s = this.getConfiguration();
        strokes.eachStroke( function( stk , strokes, i) {
            if (stk.center) {
                stk.eachPoint( function( pnt, stk, j) {
                    var vector = new THREE.Vector2( pnt.X - stk.center.x, pnt.Y - stk.center.y ).normalize();
                        vector.multiplyScalar( THREE.Math.mapLinear(s.speed, 1, 5, 0.1, 5) )
                    pnt.X += vector.x;
                    pnt.Y += vector.y;
                }, stk )
            }
        }, strokes)
    })
    return module;
},

smooth_data : function() {
    var module = new URNDR.Module("Smooth",URNDR.STROKE_MODULE,87,false); // w
    // 
    module.setConfiguration({ length: 60, factor: 18 })
    module.setFunction(function(strokes) {
        
        var settings = module.getConfiguration(),
            tracks = ["S","X","Y"];

        strokes.eachStroke( function( stroke ) { _smooth( stroke, tracks, settings ); } )
        function _smooth( stroke, tracks, settings ) {
            var i, len = tracks.length
            tracks.forEach( function( symbol ){
                var track = stroke.getTrack( symbol ),
                    eArr = URNDR.Helpers.getLastElements( track , settings.length );
                URNDR.Helpers.smoothArray( eArr , { factor: settings.factor, round : true } );
                track = URNDR.Helpers.replaceLastElements( track , eArr );
                stroke.setTrack( symbol , track );
            } )
        }

    })
    return module
},

fade_strokes : function() {
    var module = new URNDR.Module("Fade Strokes",URNDR.STROKE_MODULE,70,false);
    module.setConfiguration({ all : true , speed : 1.5 })
    module.setFunction(function(strokes) {

        var settings = this.getConfiguration()
        if (settings.all) {
            strokes.eachStroke( fade , settings );
        } else {
            var stroke = strokes.getActiveStroke()
            if ( stroke === 0 ) {return 0;}
            fade( stroke , settings );
        }

        function fade( stroke , settings ){

            var n = stroke.getTag("fade_strokes");
            if (n > 0 === false) { n = 0; }

            var len = stroke.length;
            for ( var i = 0; i < len; i++ ) {

                if ( i < n ) {
                    stroke.points[ i ].A = stroke.points[ i ].A < 0.05 ? 0 : stroke.points[ i ].A * THREE.Math.mapLinear( settings.speed , 1 , 5 , 1 , 0.5)
                } else {
                    break;
                }

            }

            n = Math.min(n + THREE.Math.mapLinear( settings.speed , 1 , 5 , 0 , 2 ) , len);

            stroke.setTag("fade_strokes", n )

        }

    })
    return module
},

wiggle : function() {
    var module = new URNDR.Module("Wiggle",URNDR.STROKE_MODULE,90) // z
    module.setConfiguration({ amp : 8, all : true })
    module.setFunction(function(strokes) {
        var settings = module.getConfiguration()
        if (settings.all) {
            target_strokes = strokes.strokesZDepth
        } else {
            target_strokes = [ strokes.active_stroke ]
        }
        for (var st in target_strokes) {
            var bamp = settings.amp * 0.001;
            stroke_k = strokes.getStrokeByID( target_strokes[st] )
            stroke_k.setTrack( "X" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("X") , settings.amp ) )
            stroke_k.setTrack( "Y" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("Y") , settings.amp ) )
            stroke_k.setTrack( "BU" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BU") , bamp ) )
            stroke_k.setTrack( "BV" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BV") , bamp ) )
            stroke_k.setTrack( "BW" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BW") , bamp ) )
        }
    })
    return module
},

// DRAW MODULES

connection_network : function(){
    var module = new URNDR.Module("NETWORK DRAW",URNDR.DRAW_MODULE,49); // 1
    module.setFunction(function(params){
        var strokes, ctx, all_track, strokes_count, stroke_i, points_count;
        strokes = params.strokes
        ctx = params.context
        
        clear(1);
        
        all_track = new URNDR.Stroke();
        strokes_count = strokes.strokeCount;
        for ( var i = 0 ; i < strokes_count ; i ++ ) {
            stroke_i = strokes.getStrokeByID( strokes.strokesZDepth[ i ] )
            points_count = stroke_i.length;
            for ( var j = 0 ; j < points_count ; j ++ ) {
                all_track.addPoint( stroke_i.getPoint( j ) )
            }
        }

        var pe, pf, all_length;
        all_length = all_track.length;
        ctx.lineWidth = 1.5;
        for ( var e = 0 ; e < all_length ; e++ ) {
            pe = all_track.getPoint( e )

            for ( var f = 0 ; f < all_length ; f++ ) {
            
                pf = all_track.getPoint( f )
                if (pe.A + pf.A > 0 && Math.abs(e-f) > 20) {

                    var max = pe.S * 1.5, min = 10

                    if ( Math.abs(pe.X - pf.X) < max && Math.abs(pe.Y - pf.Y) < max && Math.abs(pe.X - pf.X) > min && Math.abs(pe.Y - pf.Y) > min ) {
                        var factor = getAlphaFactor( pf, all_track, f );
                        if (factor > 0) {
                            ctx.strokeStyle = STYLE.gradientMaker( ctx , pf , pe , factor );
                            ctx.beginPath();
                            ctx.moveTo(pe.X,pe.Y)
                            ctx.lineTo(pf.X,pf.Y)
                            ctx.stroke();
                            ctx.closePath();
                        }
                    }

                }
            
            }

        }

    })
    return module
},

default_draw_style : function() {
    var module = new URNDR.Module("VANILLA DRAW",URNDR.DRAW_MODULE,48,true);
    module.setConfiguration( {fillmember:false} )
    module.setFunction(function(params){

        var settings = this.getConfiguration();
        var strokes = params.strokes, ctx = params.context;
        
        clear(1);

        function _fillmember( ctx, prv, pnt, factor ){
            if(settings.fillmember && pnt.A * factor > 0.1) {
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                stroke_basic(ctx, prv, pnt, pnt.S + 15, "#FFF");
                ctx.restore();
            }
        }

        strokes.eachStroke( function( stk ){

            stk.eachPoint( function( pnt, stk, i ){

                var prv = stk.getPoint( i - 1 );
                if (prv !== 0) {
                    var factor = getAlphaFactor(pnt,stk,i);
                    if (factor > 0) {
                        _fillmember( ctx, prv, pnt, factor );
                        stroke_basic(ctx, prv, pnt, pnt.S, STYLE.gradientMaker( ctx , prv , pnt , factor ) )
                    }
                }

                hudCtx.lineWidth = 1.5;
                if ( stk.selected ) {
                    hudCtx.strokeStyle = "#FF0"
                    hudCtx.strokeRect( pnt.X - 4 , pnt.Y - 4 , 8, 8);
                    stroke_basic(hudCtx, prv, pnt, 1, "#FF0" );
                } else if ( stk.hovered ) {
                    hudCtx.strokeStyle = "#FFF"
                    hudCtx.strokeRect( pnt.X - 5 , pnt.Y - 5 , 10, 10);
                }

            } , stk)

            if (stk.closed) {
                
                var prv = stk.points[ 0 ],
                    pnt = stk.points[ stk.length - 1 ],
                    factor = getAlphaFactor(pnt,stk,0);

                _fillmember( ctx, prv, pnt, factor );
                stroke_basic(ctx, pnt, prv, pnt.S, 'rgba('+pnt.R+','+pnt.G+','+pnt.B+','+pnt.A * factor +')' );

            }
        } )

    })
    return module
}

} );

// HELPERS
function stroke_basic( ctx , p0 , p1 , lineWidth , strokeStyle ) {
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.moveTo( p0.X , p0.Y )
    ctx.lineTo( p1.X , p1.Y )
    ctx.closePath();
    ctx.stroke();
}

function getAlphaFactor( pnt, stk, i ){

    var factor = 1;

    if (pnt.OBJECT && pnt.FACE) {
                    
        factor = U3.camera.checkVisibility( pnt.OBJECT , pnt.FACE );

    } else {

        nearests = stk.getNearestPointWith( "FACE", i )
        if (nearests instanceof Object) {
            
            var before_present = nearests.before instanceof URNDR.Point;
            var after_present = nearests.after instanceof URNDR.Point;
            if (before_present && after_present) {

                factor  = U3.camera.checkVisibility( nearests.before.OBJECT , nearests.before.FACE ) * nearests.after_distance
                factor += U3.camera.checkVisibility( nearests.after.OBJECT , nearests.after.FACE )   * nearests.before_distance
                factor *= 1 / ( nearests.after_distance + nearests.before_distance )

            } else if (before_present || after_present) {

                if ( before_present ){

                    factor = U3.camera.checkVisibility( nearests.before.OBJECT , nearests.before.FACE )

                } else {

                    factor = U3.camera.checkVisibility( nearests.after.OBJECT , nearests.after.FACE )

                }

            }
            
        }

    }

    return factor

}

function getAlphaFactor2( pnt, stk, i ) {
    return getAlphaFactor(pnt, stk, i) > 0.5 ? 1 : 0;
}