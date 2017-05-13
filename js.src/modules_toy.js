//
// COMMANDS & ETC
//

import {BaseModule} from 'urndr'

MODULES.loadModules( {

draw : function() {
	var module = new BaseModule("Draw",BaseModule.COMMAND_MODULE,66) // b
	module.setFunction(function() {
		PEN.selectToolByName("Draw");
		return "";
	})
	return module
},

eraser : function() {
	var module = new BaseModule("Eraser",BaseModule.COMMAND_MODULE,69) // e
	module.setFunction(function() {
		PEN.selectToolByName("Eraser");
		return "Make Invisible"
	})
	return module
},

selector : function() {
	var module = new BaseModule("Selector",BaseModule.COMMAND_MODULE,83) // s
	module.setFunction(function() {
		PEN.selectToolByName("Stroke Selector"); return "Select Point"
	})
	return module
},

clear_canvas : function() {
	var module = new BaseModule("Clear",BaseModule.COMMAND_MODULE)
	module.setFunction(function( evt ){
		STROKES.reset();
		return "";
	})
	return module
},

camera_mover : function() {
	var module = new BaseModule("Mover",BaseModule.COMMAND_MODULE)
	module.setFunction(function( evt ){
		PEN.selectToolByName("Mover"); return "Move Camera"
		return "";
	})
	return module
},

brush_size_up : function() {
	var module = new BaseModule("Increase Brush Size",BaseModule.COMMAND_MODULE,221)
	module.setFunction(function(){
		STYLE.brush_size += 5;
		return STYLE.brush_size;
	})
	return module
},

brush_size_down : function() {
	var module = new BaseModule("Reduce Brush Size",BaseModule.COMMAND_MODULE,219)
	module.setFunction(function(){
		STYLE.brush_size = STYLE.brush_size > 5 ? STYLE.brush_size - 5 : 5;
		return STYLE.brush_size;
	})
	return module
},

play_pause : function() {
	var module = new BaseModule("Play Pause",BaseModule.COMMAND_MODULE)
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
	var module = new BaseModule("Auto Rotate",BaseModule.STROKE_MODULE,9999,false);
	module.interval = 20;
	module.setConfiguration({
		direction: 1
	})
	module.setFunction( function(){
		U3.rig.target_theta += 0.1047 * this.settings.direction
	})
	return module;
})

MODULES.loadModule(function() {
	var module = new BaseModule("Camera Work",BaseModule.COMMAND_MODULE,901)
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
