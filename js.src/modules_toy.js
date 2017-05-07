const RENDER_INTERVAL = 20;

// INTERFACE UPDATE FUNCTIONS

const $showcase = $(".showcase");
$showcase.putGeneratedImage = function( url ){

    var $new = $("<div>",{class:"exported item"}),
        $img = $("<img>",{src: url}),
        $btns= $('<div class="bar"><a href="#" class="del fa fa-trash-o"></a><a href="'+url+'" target="_blank" class="dw fa fa-download" download="urndr"></a></div>');

    $btns.find(".del").on("click",function(evt){
        evt.preventDefault();
        var $tar = $(this).parents(".exported.item");
        $tar.hide(300,function(){
            $tar.remove();
        })
    })

    $showcase.prepend( $new.append($img).append($btns) );

    if (! $showcase.is(":visible")) { $showcase.fadeIn(200); }

}

// INTERFACE SHORTHANDS FUNCTIONS

const trig = function() {
    var module = MODULES.getModuleByName( arguments[0] ),
        _arguments = [].slice.call( arguments );
        _arguments.shift();
    module.func.apply( module , _arguments )
}

const mreceive = function() {
    var module = MODULES.getModuleByName( arguments[0] ),
        _arguments = [].slice.call( arguments );
        _arguments.shift();
    module.listener.apply( module , _arguments )
}

const mtogg = function( mod_name , value ) {
    var module = MODULES.getModuleByName( arguments[0] );
    if (value != undefined) {
        module.enabled = value;
    } else {
        module.enabled = ! module.enabled;
    }
}

// Global

window.RENDER_INTERVAL = RENDER_INTERVAL
window.$showcase = $showcase
window.trig = trig
window.mreceive = mreceive
window.mtogg = mtogg

// Watches

const $input_brush_size = $("input#brush_size").get(0)
const $target_theta = $("#target_theta").get(0)
const $target_radius = $("#target_radius").get(0)
watch( STYLE , "brush_size" , function(){
    $input_brush_size.value = STYLE.brush_size;
})
watch( U3.rig , "target_theta" , function(){
    $target_theta.value = U3.rig.target_theta;
})
watch( U3.rig , "target_radius" , function(){
    $target_radius.value = U3.rig.target_radius;
})

// URNDR Modules

MODULES.loadModules( {

// COMMANDS

draw : function() {
    var module = new URNDR.Module("Draw",URNDR.COMMAND_MODULE,66) // b
    module.setFunction(function() {
        PEN.selectToolByName("Draw");
        return "";
    })
    return module
},

eraser : function() {
    var module = new URNDR.Module("Eraser",URNDR.COMMAND_MODULE,69) // e
    module.setFunction(function() {
        PEN.selectToolByName("Eraser");
        return "Make Invisible"
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
    var module = new URNDR.Module("Clear",URNDR.COMMAND_MODULE)
    module.setFunction(function( evt ){
        STROKES.reset();
        return "";
    })
    return module
},

camera_mover : function() {
    var module = new URNDR.Module("Mover",URNDR.COMMAND_MODULE)
    module.setFunction(function( evt ){
        PEN.selectToolByName("Mover"); return "Move Camera"
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
    var module = new URNDR.Module("Reduce Brush Size",URNDR.COMMAND_MODULE,219)
    module.setFunction(function(){
        STYLE.brush_size = STYLE.brush_size > 5 ? STYLE.brush_size - 5 : 5;
        return STYLE.brush_size;
    })
    return module
},

play_pause : function() {
    var module = new URNDR.Module("Play Pause",URNDR.COMMAND_MODULE)
    module.setFunction(function( arg , btn ){
        U3.eachModel( function(model){
            if (model.animation) {
                var step = model.animation.duration / 60;

                switch ( arg ) {
                    case  1:
                        model.animation.pause();
                        model.animation.update( step * 2 , true)
                        break;
                    case -1:
                        model.animation.pause();
                        model.animation.update( step * -2 , true)
                        break;
                    default:
                        if ( model.animation.isPlaying ) {
                            model.animation.pause();
                        } else {
                            model.animation.play();
                        }
                }

            }
        } )
    })
    return module
},

random_color_scheme : function() {
    var module = new URNDR.Module("Color Change",URNDR.COMMAND_MODULE,191)
    module.setFunction(function( evt ){

        var round = Math.round, random = Math.random;

        var _msg = "";

        function _rgb( input ){ return "rgb("+input+")"; }
        function hslToRgb(h, s, l){
            var r, g, b;

            if(s == 0){
                r = g = b = l; // achromatic
            }else{
                var hue2rgb = function hue2rgb(p, q, t){
                    if(t < 0) t += 1;
                    if(t > 1) t -= 1;
                    if(t < 1/6) return p + (q - p) * 6 * t;
                    if(t < 1/2) return q;
                    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                }

                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return [round(r * 255), round(g * 255), round(b * 255)];

        }

        var _hue = random();
        var _sat = random();
        if (_sat < 0.2) { _sat = 0; }
        var primary = hslToRgb( _hue , _sat , 0.5 );
        var contrast = hslToRgb( (_hue + 0.5) % 1 , (_sat + 0.5) % 1 , 0.5 );
        var dark = hslToRgb( _hue , _sat * 0.80 , 0.2 );
        var pale = hslToRgb( _hue - 0.075 , _sat * 0.80 , 0.6 );

        var _f = function(v) {
            var b = 30, bh = b * 0.5;
            return round(v + random() * b - bh)
        };

        STROKES.eachStroke( function( stk ){
            stk.eachPoint( function( pnt ){
                pnt.R = _f(contrast[0])
                pnt.G = _f(contrast[1])
                pnt.B = _f(contrast[2])
            }, stk)
            stk.tags = {};
        } )

        STYLE.color[0] = contrast[0]
        STYLE.color[1] = contrast[1]
        STYLE.color[2] = contrast[2]
        U3.material.color = new THREE.Color( _rgb(pale) )
        U3.renderer.setClearColor( _rgb(primary) )
        $(".canvas_bg").css("background-color", _rgb(primary) );

        return _msg;
    })
    return module;
},

camera_work : function() {
    var module = new URNDR.Module("Camera Work",URNDR.COMMAND_MODULE,901)
    module.setFunction( function( directive ){
        var _arguments = [].slice.call( arguments );
            _arguments.shift();
        var directives = {}
        directives["Y"] = function( v ){
            $("#view_offset_y").get(0).value = v;
            var am = U3.getModel(U3.activeModel),
                amf = am.focusPoint;
            if (amf != undefined) {
                if (typeof amf === "object") {
                    U3.rig.focus.y = THREE.Math.mapLinear( v , -3, 3, amf.min, amf.max);
                } else {
                    U3.rig.focus.y = amf;
                }
            } else {
                U3.rig.focus.y = v;
            }
            U3.rig.target_pitch = v;
        }
        directives[directive].apply( this , _arguments )
    } )
    return module
},

// STYLE MODULES
// When user's drawing and you want to do something realtime.

random_stroke_color : function() {
    var module = new URNDR.Module("Random Stroke Color",URNDR.STYLE_MODULE,65);
    module.interval = 70;
    module.setFunction(function(STYLE) {
        var round = Math.round, random = Math.random;
        STYLE.color[0] = round(random() * 255);
        STYLE.color[1] = round(random() * 255);
        STYLE.color[2] = round(random() * 255);
    })
    return module
},

subtle_pen_variation : function() {
    var module = new URNDR.Module("Subtle Pen Variation",URNDR.STYLE_MODULE,9999,true);
    module.interval = 80;
    module.setFunction(function(STYLE) {
        var round = Math.round, random = Math.random;
        var _f = function(v) {
            var b = 8, bh = b * 0.5;
            return round(v + random() * b - bh)
        };
        STYLE.color[0] = _f(STYLE.color[0]);
        STYLE.color[1] = _f(STYLE.color[1]);
        STYLE.color[2] = _f(STYLE.color[2]);
    })
    return module
},

// POINT DATA MODULES

random_point_position : function() {
    var module = new URNDR.Module("Random Point",URNDR.POINT_MODULE,68);
    //
    module.interval = 30;
    module.setConfiguration({amp : 60})
    module.setFunction(function( point ) {
        var amp = this.getConfiguration().amp;
        var half = amp/2
        point.X += half - URNDR.Math.random(amp);
        point.Y += half - URNDR.Math.random(amp);
        // also mess with barycentric coordinate.
        if (point.BU || point.BV || point.BW) {
            point.BU += 0.2 - 0.4 * URNDR.Math.random(1)
            point.BV += 0.2 - 0.4 * URNDR.Math.random(1)
            point.BW += 0.2 - 0.4 * URNDR.Math.random(1)
        }
    })
    return module
},

pressure_sensitivity : function() {
    var _enabled = true;
    if (WACOM) {
        if (WACOM.nowacom === true) {
            _enabled = false;
        }
    }
    var module = new URNDR.Module("Pressure Sensitivity",URNDR.POINT_MODULE,9001,_enabled);
    module.interval = 1;
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

auto_rotation : function(){
    var module = new URNDR.Module("Auto Rotate",URNDR.STROKE_MODULE,9999,false);
    module.interval = RENDER_INTERVAL;
    module.setConfiguration({
        direction: 1
    })
    module.setFunction(function(strokes){
        U3.rig.target_theta += 0.1047 * this.settings.direction
    })
    module.listener = function (v) {
        if (v === 0) {
            this.enabled = false;
        } else {
            this.enabled = true;
            this.settings.direction = v;
        }
    }
    return module;
},

delete_flagged_strokes : function(){
    var module = new URNDR.Module("Garbage Collection",URNDR.STROKE_MODULE,99,true);
    module.interval = 1000;
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

        for ( var i = 0, max = strokes_to_delete.length; i < max; i++) {
            strokes.deleteStrokeByID( strokes_to_delete[i] );
        }

    })
    return module;
},

move_drawing_with_3d_model : function() {
    var module = new URNDR.Module("3D MAGIC",URNDR.STROKE_MODULE,true); //u
    module.interval = RENDER_INTERVAL;
    module.setConfiguration({
        delayFactor : 0.8
    })
    module.setFunction(function(strokes) {

        var settings = module.settings;

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
                        a.y * point.BU + b.y * point.BV + c.y * point.BW,
                        cavMan.width,
                        cavMan.height
                    )

                    // record this point's potential movement.
                    point.PX = (p.x - point.X) * settings.delayFactor
                    point.PY = (p.y - point.Y) * settings.delayFactor

                    // set point X Y
                    point.X += point.PX
                    point.Y += point.PY

                } else {

                    var near = stroke.getNearestPointWith( "FACE" , i );
                    if (near !== 0) {

                        var before_present = near.before !== 0,
                            after_present = near.after !== 0;

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
    module.interval = 85;
    //
    module.setConfiguration({ length: 60, factor: 13 })
    module.setFunction(function(strokes) {

        var mapLinear = THREE.Math.mapLinear,
            clamp = THREE.Math.clamp;

        strokes.eachStroke( function( stroke ) { _smooth( stroke ); } )
        function _smooth( stroke ) {
            stroke.eachPoint( function(cur,stk,i){

                if (cur.bound) { return 0; }
                var prv = stk.getPoint(i - 1),
                    nxt = stk.getPoint(i + 1);
                if (prv == 0 || nxt == 0) { return 0; }

                var vprv = [prv.X - cur.X,prv.Y - cur.Y],
                    vnxt = [nxt.X - cur.X,nxt.Y - cur.Y],
                    dprv = prv.distanceTo( cur ),
                    dnxt = nxt.distanceTo( cur ),
                    cosa = (vprv[0] * vnxt[0] + vprv[1] * vnxt[1]) / (dprv * dnxt); // 180 > -1 & 0 > 1

                // Smooth: agle less than 120 deg = PI * 0.75
                var factor_1 = clamp( mapLinear( cosa , -0.5 , 1 , 0 , 0.1 ) , 0.01 , 0.1 ),
                    factor_2 = factor_1 * 0.3;

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

            }, stroke )
        }

    })
    return module
},

fade_strokes : function() {
    var module = new URNDR.Module("Fade Strokes",URNDR.STROKE_MODULE,70,false);
    module.interval = 40;
    module.setConfiguration({
        all : true,
        speed : 2,
        toggle : 0
    })
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

            var len = stroke.length,
                step = THREE.Math.mapLinear( settings.speed , 1 , 5 , 0 , 3 );
            for ( var i = 0; i < len; i++ ) {

                if ( i < n ) {
                    var pnt = stroke.points[ i ];
                    pnt.A = pnt.A < 0.05 ? 0 : pnt.A * THREE.Math.mapLinear( settings.speed , 1 , 5 , 1 , 0.6)
                } else {
                    break;
                }

            }

            n = Math.min( n + step , len);

            stroke.setTag("fade_strokes", n )

        }

    })
    module.listener = function( evt ) {
        var m = this.settings;
        if (evt.shiftKey) {
            m.toggle = (m.toggle + 1) % 5
        } else {
            m.toggle = m.toggle >= 1 ? 0 : 1;
        }
        m.speed = m.toggle + 1;
        this.enabled = true;
        if (m.speed === 1) {
            this.enabled = false;
        }
        return "S" + m.toggle;
    }
    return module
},

wiggle : function() {
    var module = new URNDR.Module("Wiggle",URNDR.STROKE_MODULE,90) // z
    module.interval = 65;
    module.setConfiguration({ amp : 0, all : true })
    module.setFunction(function(strokes) {
        var settings = module.settings;
        //
        if (settings.all) {
            target_strokes = strokes.strokesZDepth
        } else {
            target_strokes = [ strokes.active_stroke ]
        }
        //
        settings.amp = THREE.Math.mapLinear( U3.speed , 0 , 60 , 2 , 12 )
        module.interval = THREE.Math.mapLinear( U3.speed , 0 , 60 , 100 , 40 )
        //
        for (var st = 0, max = target_strokes.length; st < max; st ++ ) {
            stroke_k = strokes.getStrokeByID( target_strokes[st] )
            stroke_k.setTrack( "X" , URNDR.Helpers.randomizeArray( stroke_k.getTrack("X") , settings.amp ) )
            stroke_k.setTrack( "Y" , URNDR.Helpers.randomizeArray( stroke_k.getTrack("Y") , settings.amp ) )
            var bamp = settings.amp * 0.001;
            stroke_k.setTrack( "BU" , URNDR.Helpers.randomizeArray( stroke_k.getTrack("BU") , bamp ) )
            stroke_k.setTrack( "BV" , URNDR.Helpers.randomizeArray( stroke_k.getTrack("BV") , bamp ) )
            stroke_k.setTrack( "BW" , URNDR.Helpers.randomizeArray( stroke_k.getTrack("BW") , bamp ) )
        }
    })
    return module
},

// DRAW MODULES

default_draw_style : function() {
    var module = new URNDR.Module("Render",URNDR.DRAW_MODULE,902,true);
    module.interval = RENDER_INTERVAL;
    module.setConfiguration( {
        // Styles
        fillmember: false,
        // GIF Maker
        showModel: true,
        encoder: null,
        exporting: false,
        renderedFrames: 0,
        totalFrames: 0,
        frameEvery: 2,
        postExportAction: function(){}
    } )
    module.helpers = {
        stroke_basic: function( ctx , p0 , p1 , lineWidth , strokeStyle ) {
            ctx.beginPath();
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.moveTo( p0.X , p0.Y );
            ctx.lineTo( p1.X , p1.Y );
            ctx.stroke();
        },
        getAlphaFactor: function( pnt, stk, i ){

            if (pnt.OBJECT && pnt.FACE) {

                return U3.camera.checkVisibility( pnt.OBJECT , pnt.FACE );

            } else {

                var nearests = stk.getNearestPointWith( "FACE", i );

                if (nearests !== 0) {

                    var before_present = nearests.before != 0,
                        after_present = nearests.after != 0;

                    var vis_before = 1, vis_after = 1;

                    if (before_present) {vis_before = U3.camera.checkVisibility( nearests.before.OBJECT , nearests.before.FACE )}
                    if (after_present) {vis_after = U3.camera.checkVisibility( nearests.after.OBJECT , nearests.after.FACE )}

                    if (before_present && after_present) {

                        return (vis_before * nearests.after_distance + vis_after * nearests.before_distance) / ( nearests.after_distance + nearests.before_distance )

                    } else if (before_present || after_present) {

                        return before_present ? vis_before : vis_after;

                    }

                }

            }

            // The rest of the cases: stroke is totally without any binding.

            return 1
        },
        stroke_outline: function( ctx, prv, pnt, factor ){
            if(module.settings.fillmember && pnt.A * factor > 0.1) {
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                module.helpers.stroke_basic(ctx, prv, pnt, pnt.S + 15, "#FFF");
                ctx.restore();
            }
        },
        // General Export Setups
        finishExport: function( mod ){
            var mod = mod.settings;

            // Finish GIF stream;
            mod.encoder.finish();
            mod.postExportAction( mod.encoder );

            // Response
            HUD.display("GIF Made.","100%")

            // Reset
            mod.encoder = null;
            mod.exporting = false;
            mod.renderedFrames = 0;
            mod.totalFrames = 0;
            mod.postExportAction = function(){};

        }
    }
    module.setFunction(function(params){

        var settings = this.settings,
            stroke_basic = this.helpers.stroke_basic,
            getAlphaFactor = this.helpers.getAlphaFactor,
            _fillmember = this.helpers.stroke_outline;

        var strokes = params.strokes,
            canvases = params.canvasManager,
            ctx = canvases.get("draw").context,
            hudCtx = canvases.get("hud").context;

        canvases.clear(1);

        var frame_this = settings.renderedFrames % settings.frameEvery === 0;

        // PRE-RENDER PROCESSES
        // #1 : EXPORTER
        if (settings.exporting) {

            if ( frame_this ) {

                if (settings.showModel) {
                    // RENDER : COPY 3D image
                    ctx.drawImage( U3.renderer.domElement , 0 , 0 )
                } else {
                    // RENDER : FILL CLEAR COLOR
                    ctx.fillStyle = $(".canvas_bg").first().css("background-color");
                    ctx.fillRect( 0 , 0 , canvases.width , canvases.height )
                }
            }

        }

        // RENDER
        if ( ! settings.exporting || settings.exporting && frame_this ) {

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

                } , stk)

                if ( stk.selected ) {

                    var pnt = stk.getPoint(0);

                    hudCtx.strokeStyle = "#FF0"
                    hudCtx.beginPath();
                    hudCtx.moveTo( pnt.X , pnt.Y )
                    stk.eachPoint( function(pnt) {
                        hudCtx.lineTo( pnt.X , pnt.Y )
                        hudCtx.strokeRect( pnt.X - 4 , pnt.Y - 4 , 8, 8);
                    } )

                    hudCtx.stroke();

                } else if ( stk.hovered ) {

                    hudCtx.strokeStyle = "#FFF"
                    stk.eachPoint( function(pnt) {
                        hudCtx.strokeRect( pnt.X - 5 , pnt.Y - 5 , 10, 10);
                    } )

                }

                if (stk.closed) {

                    var prv = stk.points[ 0 ],
                        pnt = stk.points[ stk.length - 1 ],
                        factor = getAlphaFactor(pnt,stk,0);

                    _fillmember( ctx, prv, pnt, factor );
                    stroke_basic(ctx, pnt, prv, pnt.S, 'rgba('+pnt.R+','+pnt.G+','+pnt.B+','+pnt.A * factor +')' );

                }
            } )

        }

        // POST-RENDER PROCESSES
        // #1 : EXPORTER
        if (settings.exporting) {

            // RENDER
            if (settings.renderedFrames < settings.totalFrames) {

                // SKIP FRAME DETECTION
                if ( frame_this ) {
                    settings.encoder.addFrame( ctx )
                }

                const p = settings.renderedFrames / settings.totalFrames;
                p = Math.round( p * 100 )

                HUD.display( "Making GIF..." , p + "%" );
                settings.renderedFrames += 1;

            } else {

                // ALL FRAMES EXPORTED
                this.helpers.finishExport( this );

            }

        }

    })
    module.listener = function( evt , frames ) {
        if (evt === "GIF") {
            // INIT GIF EXPORT PROCESS
            const ss = this.settings;

            if (ss.exporting === false) {
                // post-render action
                ss.postExportAction = function( encoder ){
                    const binary = encoder.stream().getData();
                    const data_url = 'data:image/gif;base64,' + encode64(binary);
                    $showcase.putGeneratedImage( data_url )
                }
                $showcase.fadeOut(300,function(){
                    // config
                    ss.exporting = true;
                    ss.frameEvery = 3;
                    ss.totalFrames = frames || 59;
                    ss.gifDelay = 50;
                    // encoder
                    ss.encoder = new GIFEncoder();
                    ss.encoder.setRepeat( 0 );
                    ss.encoder.setDelay( ss.gifDelay );
                    ss.encoder.start();
                    // display
                    HUD.display( "Making GIF." )
                })
            } else {
                HUD.display( "Already Rendering." )
            }

        }
        if (evt === "fillmember") {
            this.settings.fillmember = !this.settings.fillmember;
        }
    }
    return module
}

} );

// Watches for Modules
const $fade = $("#fade").get(0)
const $wiggle = $("#wiggle").get(0)
const $random_stroke_color = $("#random_stroke_color").get(0)

watch( MODULES.getModuleByName("Fade Strokes") , "enabled" , function() {
    $fade.checked = MODULES.getModuleByName("Fade Strokes").enabled;
})
watch( MODULES.getModuleByName("Wiggle") , "enabled" , function() {
    $wiggle.checked = MODULES.getModuleByName("Wiggle").enabled;
})
watch( MODULES.getModuleByName("Random Stroke Color") , "enabled" , function() {
    $random_stroke_color.checked = MODULES.getModuleByName("Random Stroke Color").enabled;
})
