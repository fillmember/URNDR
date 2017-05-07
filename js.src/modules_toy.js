import encode64 from './gifencoder/b64.js'
import {
	RandomPointPosition,
	PointPressureSensitivity
} from 'urndr/presets/pointfx.js'
import {
	StrokeFade,
	StrokeWiggle,
	DeleteFlaggedStroke,
	SmoothStroke,
	Stroke3DMapping
} from 'urndr/presets/strokefx.js'
import {
	SetRandomColorScheme
} from 'urndr/presets/commands.js'

const watchJS = require('./watch.js')
const watch = watchJS.watch

const RENDER_INTERVAL = 20;

// INTERFACE UPDATE FUNCTIONS

const $showcase = $(".showcase");
$showcase.putGeneratedImage = ( url ) => {

	var $new = $("<div>",{class:"exported item"}),
		$img = $("<img>",{src: url}),
		$btns= $('<div class="bar"><a href="#" class="del fa fa-trash-o"></a><a href="'+url+'" target="_blank" class="dw fa fa-download" download="urndr"></a></div>');

	$btns.find(".del").on("click",function(evt){
		evt.preventDefault();
		var $tar = $(this).parents(".exported.item");
		$tar.hide(300,() => {
			$tar.remove();
		})
	})

	$showcase.prepend($new.append($img).append($btns));

	if (!$showcase.is(":visible")) { $showcase.fadeIn(200); }

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

//
// COMMANDS
//

draw : function() {
	var module = new URNDR.Module("Draw",URNDR.Module.COMMAND_MODULE,66) // b
	module.setFunction(function() {
		PEN.selectToolByName("Draw");
		return "";
	})
	return module
},

eraser : function() {
	var module = new URNDR.Module("Eraser",URNDR.Module.COMMAND_MODULE,69) // e
	module.setFunction(function() {
		PEN.selectToolByName("Eraser");
		return "Make Invisible"
	})
	return module
},

selector : function() {
	var module = new URNDR.Module("Selector",URNDR.Module.COMMAND_MODULE,83) // s
	module.setFunction(function() {
		PEN.selectToolByName("Stroke Selector"); return "Select Point"
	})
	return module
},

clear_canvas : function() {
	var module = new URNDR.Module("Clear",URNDR.Module.COMMAND_MODULE)
	module.setFunction(function( evt ){
		STROKES.reset();
		return "";
	})
	return module
},

camera_mover : function() {
	var module = new URNDR.Module("Mover",URNDR.Module.COMMAND_MODULE)
	module.setFunction(function( evt ){
		PEN.selectToolByName("Mover"); return "Move Camera"
		return "";
	})
	return module
},

brush_size_up : function() {
	var module = new URNDR.Module("Increase Brush Size",URNDR.Module.COMMAND_MODULE,221)
	module.setFunction(function(){
		STYLE.brush_size += 5;
		return STYLE.brush_size;
	})
	return module
},

brush_size_down : function() {
	var module = new URNDR.Module("Reduce Brush Size",URNDR.Module.COMMAND_MODULE,219)
	module.setFunction(function(){
		STYLE.brush_size = STYLE.brush_size > 5 ? STYLE.brush_size - 5 : 5;
		return STYLE.brush_size;
	})
	return module
},

play_pause : function() {
	var module = new URNDR.Module("Play Pause",URNDR.Module.COMMAND_MODULE)
	module.setFunction( ( arg , btn ) => {
		U3.eachModel( (model) => {
			if (!model.animation) { return }
			const step = model.animation.duration / 60;
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
		})
	})
	return module
},

random_color_scheme : new SetRandomColorScheme({
	strokes : STROKES,
	style : STYLE,
	threeManager : U3,
	callback : (primary,contrast,primaryRGB,contrastRGB) => {
		$(".canvas_bg").css("background-color",primaryRGB)
	}
}),

camera_work : function() {
	var module = new URNDR.Module("Camera Work",URNDR.Module.COMMAND_MODULE,901)
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
	var module = new URNDR.Module("Random Stroke Color",URNDR.Module.STYLE_MODULE,65);
	module.interval = 70;
	module.setFunction(function(style) {
		var round = Math.round, random = Math.random;
		style.color[0] = round(random() * 255);
		style.color[1] = round(random() * 255);
		style.color[2] = round(random() * 255);
	})
	return module
},

subtle_pen_variation : function() {
	var module = new URNDR.Module("Subtle Pen Variation",URNDR.Module.STYLE_MODULE,9999,true);
	module.interval = 80;
	module.setFunction(function(style) {
		var round = Math.round, random = Math.random;
		var _f = function(v) {
			var b = 8, bh = b * 0.5;
			return round(v + random() * b - bh)
		};
		style.color[0] = _f(style.color[0]);
		style.color[1] = _f(style.color[1]);
		style.color[2] = _f(style.color[2]);
	})
	return module
},

//
// POINT DATA MODULES
//

random_point_position : new RandomPointPosition(),

pressure_sensitivity : new PointPressureSensitivity(),

// STROKE DATA MODULES

auto_rotation : function(){
	var module = new URNDR.Module("Auto Rotate",URNDR.Module.STROKE_MODULE,9999,false);
	module.interval = RENDER_INTERVAL;
	module.setConfiguration({
		direction: 1
	})
	module.setFunction( function(){
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

delete_flagged_strokes : new DeleteFlaggedStroke(),
move_drawing_with_3d_model : new Stroke3DMapping({canvasManager:cavMan,threeManager:U3}),
smooth_data : new SmoothStroke(),
fade_strokes : new StrokeFade(),
wiggle : new StrokeWiggle(),

// DRAW MODULES

default_draw_style : function() {
	var module = new URNDR.Module("Render",URNDR.Module.DRAW_MODULE,902,true);
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

				const p = Math.round( 100 * settings.renderedFrames / settings.totalFrames )

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
