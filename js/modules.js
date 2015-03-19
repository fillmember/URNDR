MODULES.loadModules( {

// COMMANDS
// Probably can't possibly conviniently pass parameters in for all kinds of commands.
// Developers will use global parameters from main.js. 

reload_web_page : function() {
    var module = new URNDR.Module("Reload Web Page",URNDR.COMMAND_MODULE,13)
    module.setFunction(function() {window.location.reload(); return ""})
    return module
},

clear_canvas : function() {
    var module = new URNDR.Module("Clear Canvas",URNDR.COMMAND_MODULE,32)
    module.setFunction(function(){ clear(1); STROKES = new URNDR.Strokes(); return ""; })
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

simplified_all_strokes : function() {
    var module = new URNDR.Module("Simplfy Strokes",URNDR.COMMAND_MODULE,81)
    module.setFunction(function() {
        var simp_count = 0, s;
        for( var k = 0 ; k < STROKES.getStrokesCount() ; k ++ ) { s = STROKES.getStroke(k); }
        return "Points deleted: " + simp_count;
    })
    return module
},

// STYLE MODULES
// When user's drawing and you want to do something realtime. 

random_stroke_color : function() {
    var module = new URNDR.Module("Random Stroke Color",URNDR.STYLE_MODULE,65);
    module.setFunction(function(STYLE) {
        STYLE.color.r = URNDR.Helpers.randomNumber(255,{round: true});
        STYLE.color.g = URNDR.Helpers.randomNumber(255,{round: true});
        STYLE.color.b = URNDR.Helpers.randomNumber(255,{round: true});
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
        min_size : 1,
        max_size : 200
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
        var obj,face,p3d,newp,delta,len;
            len = strokes.getStrokesCount();
        // get camera's lookat vector
        var cameraVector = new THREE.Vector3(0,0, -1).applyQuaternion( CAMERA.quaternion ).normalize();

        var settings = this.getConfiguration()

        // iterate time
        strokes.eachStroke( es , strokes );
        function es( stroke , strokes , i ) {
            if (strokes.getActiveStroke() === stroke) return 0;
            stroke.eachPoint( ep , stroke );
            function ep( point , stroke , i) {

                if ( point.FACE && point.OBJECT ) {

                    // It is a 3D point!
                    var obj = point.OBJECT
                    var face = point.FACE
                    // check if visible
                    if ( checkVisible( obj , face , cameraVector , 0.1) === false ) {
                        point.A = 0;
                        point.PX = 0;
                        point.PY = 0;
                    }
                    // transform it
                    var a,b,c,p;
                    a = obj.localToWorld( obj.getMorphedVertex( face.a ) ).project(CAMERA)
                    b = obj.localToWorld( obj.getMorphedVertex( face.b ) ).project(CAMERA)
                    c = obj.localToWorld( obj.getMorphedVertex( face.c ) ).project(CAMERA)
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
        function checkVisible( obj, face, camera, threshold ) {

            return true;

            if ( face instanceof THREE.Face3 ) {
                face = obj.localToWorld( face.normal.clone() ).normalize();
            } else if ( face instanceof THREE.Vector3 ) {
                // face = face
            } else {
                throw("checkVisible only accept Face3 or Vector3 object from THREE.js Library. ")
            }

            if (camera instanceof THREE.Camera) {
                camera = new THREE.Vector3(0,0, -1).applyQuaternion( CAMERA.quaternion ).normalize();
            } else if ( camera instanceof THREE.Vector3 ) {
                // camera = camera
            } else {
                throw("checkVisible only accept Face3 or Vector3 object from THREE.js Library. ")
            }

            if ( Math.abs( camera.dot(face) ) < threshold ) {
                return false
            } else {
                return true;
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
        
        target_tracks = ["R","G","B","X","Y"];
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
        if (counter % 2 !== 0 ) return false;

        var settings = this.getConfiguration();
        var visible_point_count = 0;
        var strokes_to_be_delete = [];
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

            len = stroke.getLength();
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

randomise_strokes : function() {
    var module = new URNDR.Module("Randomise Strokes",URNDR.STROKE_MODULE,90) // z
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
            // stroke_k.setTrack( "BU" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BU") , settings.amp ) )
            // stroke_k.setTrack( "BV" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BV") , settings.amp ) )
            // stroke_k.setTrack( "BW" , URNDR.Helpers.randomiseArray( stroke_k.getTrack("BW") , settings.amp ) )
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
            points_count = stroke_i.getLength();
            for ( var j = 0 ; j < points_count ; j ++ ) {
                all_track.addPoint( stroke_i.getPoint( j ) )
            }
        }

        var pe, pf, all_length;
        all_length = all_track.getLength();
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
        var strokes, ctx, strokes_count, stroke_i, points_count, point_j, point_prev, grad;
        var strokes = params.strokes
        var ctx = params.context

        clear(1);

        strokes_count = strokes.getStrokesCount();
        for ( var i = 0 ; i < strokes_count ; i++ ) {

            stroke_i = strokes.getStrokeByID( strokes.strokesZDepth[ i ] );

            points_count = stroke_i.getLength();
            if (points_count === 0) { continue; }

            ctx.strokeStyle = 'rgb(255,255,255)'
            
            for ( var k = 1 ; k < points_count ; k++ ) {
                point_prev = stroke_i.getPoint( k - 1 )
                point_j = stroke_i.getPoint( k )

                if (point_prev.A + point_j.A === 0) { continue; }

                ctx.beginPath();
                ctx.lineWidth = point_j.S * 2;
                ctx.moveTo(point_prev.X,point_prev.Y);
                ctx.lineTo(point_j.X,point_j.Y);
                ctx.stroke();
                ctx.closePath();

            }

            for ( var j = 1 ; j < points_count ; j++ ) {
                point_prev = stroke_i.getPoint( j - 1 )
                point_j = stroke_i.getPoint( j )

                if (point_prev.A + point_j.A === 0) { continue; }

                ctx.lineWidth = point_j.S;
                
                grad = ctx.createLinearGradient( point_prev.X , point_prev.Y , point_j.X , point_j.Y );
                grad.addColorStop(0,'rgba('+point_prev.R+','+point_prev.G+','+point_prev.B+','+point_prev.A+')')
                grad.addColorStop(1,'rgba('+point_j.R+','+point_j.G+','+point_j.B+','+point_j.A+')')
                
                ctx.strokeStyle = grad;
                ctx.beginPath();
                ctx.moveTo( point_prev.X , point_prev.Y )
                ctx.lineTo( point_j.X , point_j.Y )
                ctx.stroke();
                ctx.closePath();
            }

        }

    })
    return module
},

dot_debug_style : function() {
    var module = new URNDR.Module("DEBUG MODE (FUN MODE) ",URNDR.DRAW_MODULE,51);
    module.setFunction(function(params){
        var strokes, ctx, strokes_count, stroke_i, points_count, point_j;
        strokes = params.strokes
        ctx = params.context
        
        clear(.2);

        ctx.lineWidth = 2;

        strokes_count = strokes.getStrokesCount();
        for ( var i = 0 ; i < strokes_count ; i++ ) {

            stroke_i = strokes.getStrokeByID( strokes.strokesZDepth[ i ] );
            points_count = stroke_i.getLength();
            if (points_count === 0) { continue; }
            
            for ( var j = 0 ; j < points_count  ; j++ ) {
                point_j = stroke_i.getPoint( j )
                ctx.strokeStyle= 'rgba('+point_j.R+','+point_j.G+','+point_j.B+','+point_j.A+')';
                ctx.beginPath();
                ctx.moveTo(point_j.X-0.001,point_j.Y-0.001);
                ctx.lineTo(point_j.X,point_j.Y);
                ctx.stroke();
                ctx.closePath();
            }

        }
    })
    return module
},

default_draw_style : function() {
    var module = new URNDR.Module("VANILLA DRAW",URNDR.DRAW_MODULE,48,true);
    module.setFunction(function(params){

        var strokes, ctx, strokes_count, stroke_i, points_count, point_j, point_prev, grad;
        strokes = params.strokes
        ctx = params.context
        
        // default drawing style
        clear(1);
        
        strokes_count = strokes.getStrokesCount();

        for ( var i = 0 ; i < strokes_count  ; i ++ ) {

            stroke_i = strokes.getStrokeByID( strokes.strokesZDepth[ i ] );
            points_count = stroke_i.getLength();
            if (points_count === 0) { continue; }

            for ( var j = 1 ; j < points_count ; j ++ ) {

                point_prev = stroke_i.getPoint( j - 1 )
                point_j = stroke_i.getPoint( j )

                if (point_prev.A + point_j.A === 0) { continue; }

                ctx.lineWidth = point_j.S;
                
                ctx.strokeStyle = STYLE.gradientMaker( ctx , point_prev , point_j );
                ctx.beginPath();
                ctx.moveTo( point_prev.X , point_prev.Y )
                ctx.lineTo( point_j.X , point_j.Y )
                ctx.stroke();
                ctx.closePath();

            }

        }

    })
    return module
}

} );