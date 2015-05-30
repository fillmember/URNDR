var RENDER_INTERVAL = 16.666666;

var $showcase = $(".showcase");
$showcase.putGeneratedImage = function( url ){

    var $new = $("<div>",{class:"exported item"}),
        $img = $("<img>",{src: url}),
        $btns= $('<div class="bar"><a href="#" class="del fa fa-trash-o"></a><a href="'+url+'" class="dw fa fa-download" download="urndr"></a></div>');

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

var trig = function() {
    var _arguments = [].slice.call( arguments );
        _arguments.shift();
    MODULES.getModuleByName( arguments[0] ).func.apply( this , _arguments )
}

watch( STYLE , "brush_size" , function(){
    $("input#brush_size").get(0).value = STYLE.brush_size;
})

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

eraser : function() {
    var module = new URNDR.Module("Eraser",URNDR.COMMAND_MODULE,69) // e
    module.setFunction(function() {
        PEN.selectToolByName("Eraser"); return "Make Invisible"
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
    var module = new URNDR.Module("Play Pause",URNDR.COMMAND_MODULE,32)
    module.setFunction(function( arg , btn ){
        U3.eachModel( function(model){
            if (model.animation) {

                switch ( arg ) {
                    case  1:
                        model.animation.pause();
                        model.animation.update( 16.6667 , true)
                        break;
                    case -1:
                        model.animation.pause();
                        model.animation.update( -32.3334 , true)
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
    var module = new URNDR.Module("Color Change",URNDR.COMMAND_MODULE,222)
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

        STROKES.eachStroke( function( stk ){
            stk.eachPoint( function( pnt ){
                f = 0.8;
                rf = 1 - f;
                pnt.R = round(contrast[0] * f + random() * contrast[0] * rf)
                pnt.G = round(contrast[1] * f + random() * contrast[1] * rf)
                pnt.B = round(contrast[2] * f + random() * contrast[2] * rf)
                pnt.A = 1;
            }, stk)
            stk.tags = {};
        } )
        
        STYLE.color[0] = contrast[0]
        STYLE.color[1] = contrast[1]
        STYLE.color[2] = contrast[2]

        U3.material.color = new THREE.Color( _rgb(pale) )

        $(".canvas_bg")
            .css(  "background", _rgb(primary) )
            .data( "background", _rgb(primary) )

        return _msg;
    })
    return module;
},

// STYLE MODULES
// When user's drawing and you want to do something realtime. 

random_stroke_color : function() {
    var module = new URNDR.Module("Random Stroke Color",URNDR.STYLE_MODULE,65);
    module.interval = 70;
    module.setFunction(function(STYLE) {
        STYLE.color[0] = URNDR.Math.random(255,{round: true});
        STYLE.color[1] = URNDR.Math.random(255,{round: true});
        STYLE.color[2] = URNDR.Math.random(255,{round: true});
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
    var module = new URNDR.Module("Pressure Sensitivity",URNDR.POINT_MODULE99,true,999);
    module.interval = 5;
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
    var module = new URNDR.Module("Auto Rotate",URNDR.STROKE_MODULE,190,false);
    module.interval = RENDER_INTERVAL;
    module.setConfiguration({
        direction: 1
    })
    module.setFunction(function(strokes){
        U3.rig.target_theta += 0.1047 * this.settings.direction
    })
    module.listener = function (v) {
        switch (v) {
            case -1:
                this.settings.direction = -1;
                break;
            case  1:
                this.settings.direction = 1;
                break;
        }
        this.enabled = ! this.enabled;
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
    var module = new URNDR.Module("3D MAGIC",URNDR.STROKE_MODULE,85,true); //u
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

                if (cur.binded) { return 0; }
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
                if (!prv.binded) {
                    prv.X += - vprv[0] * factor_2;
                    prv.Y += - vprv[1] * factor_2;
                }
                if (!nxt.binded) {
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
    var module = new URNDR.Module("Render",URNDR.DRAW_MODULE,48,true);
    module.interval = RENDER_INTERVAL;
    module.setConfiguration( {
        // Styles
        fillmember: false,
        // GIF Maker
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

        // PRE-RENDER PROCESSES
        // #1 : EXPORTER
        if (settings.exporting) {

            //BACKGROUND PASS
            ctx.fillStyle = $(".canvas_bg").data("background");
            ctx.fillRect( 0, 0, ctx.canvas.width, ctx.canvas.height );

            // RENDER : COPY 3D image
            ctx.drawImage( U3.renderer.domElement , 0 , 0 )

        }

        // RENDER
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

        // POST-RENDER PROCESSES
        // #1 : EXPORTER
        if (settings.exporting) {

            // RENDER
            if (settings.renderedFrames < settings.totalFrames) {
                
                // SKIP FRAME DETECTION
                if ( settings.renderedFrames % settings.frameEvery === 0 ) {
                    settings.encoder.addFrame( ctx )
                }
                
                HUD.display( "Making GIF..." , settings.renderedFrames + "/" + settings.totalFrames );
                settings.renderedFrames += 1;

            } else {

                // ALL FRAMES EXPORTED
                this.helpers.finishExport( this );

            }

        }

    })
    module.listener = function( evt ) {
        if (evt === "GIF") {
            // INIT GIF EXPORT PROCESS
            var ss = this.settings;
            
            if (ss.exporting === false) {
                // post-render action
                ss.postExportAction = function( encoder ){
                    var binary = encoder.stream().getData();
                    var data_url = 'data:image/gif;base64,' + encode64(binary);
                    $showcase.putGeneratedImage( data_url )
                }
                $showcase.fadeOut(300,function(){
                    // config
                    ss.exporting = true;
                    ss.frameEvery = 2;
                    ss.totalFrames = 59;
                    ss.gifDelay = 70;
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