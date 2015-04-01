MODULES.loadModules( {

// COMMANDS
// Probably can't possibly conviniently pass parameters in for all kinds of commands.
// Developers will use global parameters from main.js. 

draw : function() {
    var module = new URNDR.Module("Draw",URNDR.COMMAND_MODULE,82) // r
    module.setFunction(function() {PEN.selectToolByName("Draw"); return ""})
    return module
},

eraser : function() {
    var module = new URNDR.Module("Eraser",URNDR.COMMAND_MODULE,69) // e
    module.setFunction(function() {PEN.selectToolByName("Eraser"); return "Make Invisible"})
    return module
},

mover : function() {
    var module = new URNDR.Module("Mover",URNDR.COMMAND_MODULE,81) // q
    module.setFunction(function() {PEN.selectToolByName("Mover"); return "Transform Objects"})
    return module
},

selector : function() {
    var module = new URNDR.Module("Selector",URNDR.COMMAND_MODULE,83) // s
    module.setFunction(function() {PEN.selectToolByName("Stroke Selector"); return "Select Stroke"})
    return module
},

clear_canvas : function() {
    var module = new URNDR.Module("Clear Canvas",URNDR.COMMAND_MODULE,32)
    module.setFunction(function(){ STROKES.reset(); return ""; })
    return module
},

brush_size_up : function() {
    var module = new URNDR.Module("Increase Brush Size",URNDR.COMMAND_MODULE,221)
    module.setFunction(function(){ STYLE.brush_size += 5; return STYLE.brush_size; })
    return module
},

brush_size_down : function() {
    var module = new URNDR.Module("Reduce brush size",URNDR.COMMAND_MODULE,219)
    module.setFunction(function(){ if (STYLE.brush_size > 5) {STYLE.brush_size -= 5;} return STYLE.brush_size;})
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
    var module = new URNDR.Module("Pressure Sensitivity",URNDR.POINT_MODULE,99999,true);
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

move_drawing_with_3d_model : function() {
    var module = new URNDR.Module("MAGIC 001: 3D MAGIC",URNDR.STROKE_MODULE,85,true); //u
    module.setConfiguration({
        delayFactor : 0.5
    })
    module.setFunction(function(strokes) {

        var settings = this.getConfiguration()

        // iterate time
        strokes.eachStroke( es , strokes );
        function es( stroke , strokes , i ) {
            // if (strokes.getActiveStroke() === stroke) return 0;
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

smooth_data : function() {
    var module = new URNDR.Module("Smooth",URNDR.STROKE_MODULE,87,false); // w
    // 
    module.setConfiguration({ length: 50, factor: 23 })
    module.setFunction(function(strokes) {
        
        var stroke, settings, target_tracks, track, eArr
        stroke = strokes.getActiveStroke()
        settings = module.getConfiguration()
        if (stroke === 0) {
            return;
        }
        
        target_tracks = ["R","G","B","A","S"]; // ,"X","Y"
        for (var i in target_tracks) {

            track = stroke.getTrack( target_tracks[i] );
            eArr = URNDR.Helpers.getLastElements( track , settings.length );

            URNDR.Helpers.smoothArray( eArr , { 
                factor: settings.factor, 
                round : true 
            } );

            track = URNDR.Helpers.replaceLastElements( track , eArr );
            stroke.setTrack( target_tracks[i] , track );

        }

    })
    return module
},

fade_strokes : function() {
    var module = new URNDR.Module("Fading Strokes",URNDR.STROKE_MODULE,70,false);
    module.setConfiguration({
        all : true,
        fade_length : 30,
    })
    module.setFunction(function(strokes) {
        var settings = this.getConfiguration();
        if (settings.all) {
            strokes.eachStroke( fade , settings );
        } else {
            fade( strokes.getActiveStroke() , settings )
        }

        function fade( stroke , settings ){

            var n, len
            
            if (stroke.checkTag("fade_strokes")) {
                n = stroke.getTag("fade_strokes");
            } else {
                n = 0
            }

            len = stroke.length;
            for ( var i = 0; i < len; i++ ) {

                if ( i <= n ) {
                    stroke.getPoint( i ).A *= 0.5;
                    if ( stroke.getPoint( i ).A <= 0.1) {
                        stroke.removePoint( i )
                        len --;
                        i --;
                    }
                }

            }

            stroke.setTag("fade_strokes", Math.min(n + 1 , len) )

        }

    })
    return module
},

wiggle : function() {
    var module = new URNDR.Module("Wiggle",URNDR.STROKE_MODULE,90) // z
    module.setConfiguration({ amp : 5, all : true })
    module.setFunction(function(strokes) {
        var settings = module.getConfiguration()
        if (settings.all) {
            target_strokes = strokes.strokesZDepth
        } else {
            target_strokes = [ strokes.active_stroke ]
        }
        for (var st in target_strokes) {
            stroke_k = strokes.getStrokeByID( target_strokes[st] )
            stroke_k.setTrack( "X" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("X") , settings.amp ) )
            stroke_k.setTrack( "Y" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("Y") , settings.amp ) )
            stroke_k.setTrack( "BU" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BU") , 0.02 ) )
            stroke_k.setTrack( "BV" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BV") , 0.02 ) )
            stroke_k.setTrack( "BW" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BW") , 0.02 ) )
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
        strokes_count = strokes.getStrokesCount();
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
                if (pe.A + pf.A === 0) continue;
                if (Math.abs(e-f) <= 2) continue;
                var max = pe.S * 1.5,
                    min = 10
                if ( Math.abs(pe.X - pf.X) < max && Math.abs(pe.Y - pf.Y) < max && Math.abs(pe.X - pf.X) > min && Math.abs(pe.Y - pf.Y) > min ) {
                    ctx.strokeStyle = STYLE.gradientMaker( ctx , pf , pe );
                    ctx.beginPath();
                    ctx.moveTo(pe.X,pe.Y)
                    ctx.lineTo(pf.X,pf.Y)
                    ctx.stroke();
                    ctx.closePath();
                }
            
            }

        }

    })
    return module
},

fillmember_style : function() {
    var module = new URNDR.Module("COMIC STYLE",URNDR.DRAW_MODULE,50); // 2
    module.setFunction(function(params){
        var strokes = params.strokes
        var ctx = params.context
        
        clear( 1 );

        strokes_count = strokes.strokeCount;
        strokes.eachStroke( function( stk ){
            stk.eachPoint( function( pnt , stk, i ) {
                f = getAlphaFactor(pnt, stk, i);
                if (pnt.A * f > 0.5) {
                    mi( 'destination-over', pnt.S + 15, '#FFF', stk.getPoint( i - 1 ), pnt);
                    mi( 'source-over', pnt.S, 'rgba('+pnt.R+','+pnt.G+','+pnt.B+','+pnt.A * f+')', stk.getPoint( i - 1 ), pnt)
                }
            }, stk )
        } )

        function mi( gco, lineWidth , strokeStyle, prv, pnt ) {
            ctx.beginPath();
            ctx.globalCompositeOperation = gco;
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
            ctx.moveTo( prv.X , prv.Y )
            ctx.lineTo( pnt.X, pnt.Y )
            ctx.closePath();
            ctx.stroke();
        }

    })
    return module
},

dot_debug_style : function() {
    var module = new URNDR.Module("DEBUG MODE (FUN MODE)",URNDR.DRAW_MODULE,51);
    module.setFunction(function(params){
        var strokes = params.strokes
        var ctx = params.context
        
        clear(.8);

        ctx.lineWidth = 4;

        strokes.eachStroke( function( stk ){
            if (stk.id === strokes.active_stroke) {
                ctx.strokeStyle = 'rgba(255,0,0,1)';
            } else if (stk.hovered) {
                ctx.strokeStyle = 'rgba(230,50,50,1)'
            } else {
                ctx.strokeStyle = 'rgba(100,100,100,1)';
            }
            stk.eachPoint( function( pnt , stk ){
                ctx.beginPath();
                ctx.moveTo( pnt.X, pnt.Y - 0.001 )
                ctx.lineTo( pnt.X, pnt.Y + 0.001 )
                ctx.closePath();
                ctx.stroke();
            }, stk )
        } )

    })
    return module
},

default_draw_style : function() {
    var module = new URNDR.Module("VANILLA DRAW",URNDR.DRAW_MODULE,48,true);
    module.setFunction(function(params){

        var strokes = params.strokes, ctx = params.context;
        
        clear(1);

        strokes.eachStroke( function( stk ){
            stk.eachPoint( function( pnt, stk, i ){
                if ( stk.selected ) {
                }
                stroke_basic(ctx, 
                    stk.getPoint( i - 1), 
                    pnt, 
                    pnt.S, 
                    'rgba('+pnt.R+','+pnt.G+','+pnt.B+','+pnt.A * getAlphaFactor( pnt, stk, i ) +')'
                )
                if ( stk.hovered ) {
                    ctx.fillStyle = "#FFFFFF"
                    ctx.fillRect( pnt.X - 5 , pnt.Y - 5 , 10, 10);
                }
                if ( stk.selected ) {
                    ctx.fillStyle = "#333333"
                    ctx.fillRect( pnt.X - 5 , pnt.Y - 5 , 10, 10);
                }
            } , stk)
            if (stk.closed) {
                stroke_basic(ctx, 
                    stk.points[ stk.length - 1 ], 
                    stk.points[ 0 ], 
                    pnt.S, 
                    'rgba('+pnt.R+','+pnt.G+','+pnt.B+','+pnt.A * getAlphaFactor( pnt, stk, i ) +')'
                )
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