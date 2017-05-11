import encode64 from './gifencoder/b64.js'

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
	const module = MODULES.getModuleByName( arguments[0] );
	let _arguments = [].slice.call( arguments );
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

window.$showcase = $showcase
window.trig = trig
window.mreceive = mreceive
window.mtogg = mtogg

//
// COMMANDS & ETC
//

MODULES.loadModules( {

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
}

});

MODULES.loadModule(function(){
	var module = new URNDR.Module("Auto Rotate",URNDR.Module.STROKE_MODULE,9999,false);
	module.interval = 20;
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
})

MODULES.loadModule(function() {
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
})

import {
	SetRandomColorScheme
} from 'urndr/presets/commands.js'

MODULES.loadModule(new SetRandomColorScheme({
	strokes : STROKES,
	style : STYLE,
	threeManager : U3,
	callback : (primary,contrast,primaryRGB,contrastRGB) => {
		$(".canvas_bg").css("background-color",primaryRGB)
	}
}));

import {
	RandomStrokeColor,
	ColorVariation
} from 'urndr/presets/styles.js'

MODULES.loadModule(new RandomStrokeColor())
MODULES.loadModule(new ColorVariation())

import {
	RandomPointPosition,
	PointPressureSensitivity
} from 'urndr/presets/pointfx.js'

MODULES.loadModule(new RandomPointPosition())
MODULES.loadModule(new PointPressureSensitivity())

import {
	StrokeFade,
	StrokeWiggle,
	DeleteFlaggedStroke,
	SmoothStroke,
	Stroke3DMapping
} from 'urndr/presets/strokefx.js'

MODULES.loadModule(new DeleteFlaggedStroke())
MODULES.loadModule(new Stroke3DMapping({canvasManager:cavMan,threeManager:U3}))
MODULES.loadModule(new SmoothStroke())
MODULES.loadModule(new StrokeFade())
MODULES.loadModule(new StrokeWiggle())

import {LegacyRenderer} from 'urndr/renderers/CanvasRenderModules'
MODULES.loadModule(new LegacyRenderer({
	strokes : STROKES,
	threeManager : U3,
	style : STYLE
}))


// Watches

const watchJS = require('./watch.js')
const watch = watchJS.watch

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
