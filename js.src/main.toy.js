import THREE from './three.js'
// window.THREE = THREE

import {
	BaseModule, ThreeManager, ModuleManager,
	CanvasManager, StrokeStyle, Strokes,
	Point, Hud, Pen, PenTool, Module
} from 'urndr'

const U3 = new ThreeManager({
	fog: new THREE.FogExp2(0xFFFFFF,0.33),
	canvas: document.getElementById('canvas_three'),
	material: new THREE.MeshBasicMaterial({
		color: 0xCCCCCC,
		wireframe: true,
		wireframeLinewidth: 0.5,
		morphTargets: true
	})
})
U3.speed = 16.6666;
U3.renderer.setClearColor("#FFFFFF");
const HUD = new Hud(document.getElementById('HUD'));
const MODULES = new ModuleManager();
const STYLE = new StrokeStyle();
const cavMan = new CanvasManager();
cavMan.add(document.getElementById('canvas_urndr'), "draw", "2d")
cavMan.add(document.getElementById('canvas_hud'), "hud", "2d")
cavMan.lineCap = STYLE.cap;
cavMan.lineJoin = STYLE.join;
const STROKES = new Strokes(cavMan.get("draw").element);
const PEN = new Pen({
	canvas_draw : cavMan.get("draw").element,
	canvas_hud : cavMan.get("hud").element,
	strokes : STROKES
});

const width = 500;
const height = 500;
U3.renderer.setSize(width, height);
cavMan.resize(width, height);
U3.camera.aspect = width / height;
U3.camera.updateProjectionMatrix();

import {PanTool,DrawTool,EraseTool,ModifyTool} from 'urndr/presets/pentools.js'
PEN.addTool(new DrawTool({
	strokes : STROKES,
	modules : MODULES,
	threeManager : U3,
	style : STYLE
}), true)
PEN.addTool(new EraseTool({
	strokes : STROKES,
	modules : MODULES,
	threeManager : U3,
	style : STYLE
}));
PEN.addTool(new ModifyTool({
	strokes : STROKES,
	modules : MODULES,
	threeManager : U3,
	style : STYLE
}));
PEN.addTool(new PanTool({
	strokes : STROKES,
	modules : MODULES,
	threeManager : U3,
	style : STYLE
}))

// Load Model
U3.createModelFromFile("models/p.js", {
	init: function() {
		this.animation = new THREE.MorphAnimation(this.mesh);
		this.animation.duration = 1000;
		this.mesh.scale.multiplyScalar(0.015);
		this.mesh.position.y = 0;
		this.mesh.position.x = 0.5;
		this.mesh.rotation.y = -4.3149;
		this.focusPoint = {max:1.8,min:-2}
	},
	onfocus: function() { this.animation.play(); },
	onblur: function() { this.animation.pause(); }
});
U3.createModelFromFile("models/man_run.js", {
	init: function() {
		this.animation = new THREE.MorphAnimation(this.mesh);
		this.animation.duration = 1500;
		this.mesh.scale.multiplyScalar(0.03);
		this.mesh.position.y = -2.5;
		this.mesh.rotation.y = -1.7;
		this.focusPoint = {max: 2, min:-1.3}
	},
	onfocus: function() { this.animation.play(); },
	onblur: function() { this.animation.pause(); }
});
U3.createModelFromFile("models/dog_run.js", {
	init: function() {
		this.animation = new THREE.MorphAnimation(this.mesh)
		this.mesh.scale.multiplyScalar(0.04);
		this.mesh.position.y = -1.7;
		this.focusPoint = 0;
	},
	onfocus: function() {
		this.animation.play();
		U3.rig.focus.y = 0;
	},
	onblur: function() { this.animation.pause(); }
});
U3.createModelFromFile("models/twister.js", {
	init: function() {
		this.animation = new THREE.MorphAnimation(this.mesh)
		this.animation.duration = 2000;
		var f = 0.11;
		this.mesh.geometry.computeBoundingBox();
		var b = this.mesh.geometry.boundingBox;
		this.mesh.scale.multiplyScalar(f);
		this.mesh.position.x = (b.max.x + b.min.x) * -0.5 * f;
		this.mesh.position.y = (b.max.y + b.min.y) * -0.5 * f;
		this.mesh.position.z = (b.max.z + b.min.z) * -0.5 * f;
		this.mesh.rotation.y = Math.PI;
		this.focusPoint = 0;
	},
	onfocus: function() {
		this.animation.play();
		U3.rig.focus.y = 0;
	},
	onblur: function() { this.animation.pause(); }
});
U3.createModelFromFile("models/pika.js", {
	init: function() {
		this.animation = new THREE.MorphAnimation(this.mesh)
		this.animation.duration = 1500;
		this.mesh.scale.multiplyScalar( 2 );
		this.mesh.position.y = -2;
		this.mesh.rotation.y = -1.7 / 2;
	},
	onfocus: function() {
		this.animation.play();
		U3.rig.focus.y = 0;
	},
	onblur: function() { this.animation.pause(); }
});
U3.solo(0)

//
// COMMANDS & ETC
//

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

import {SetRandomColorScheme} from 'urndr/presets/commands.js'
MODULES.loadModule(new SetRandomColorScheme({
	strokes : STROKES,
	style : STYLE,
	threeManager : U3
}));

import {RandomStrokeColor, ColorVariation} from 'urndr/presets/styles.js'
MODULES.loadModule(new RandomStrokeColor())
MODULES.loadModule(new ColorVariation())

import {RandomPointPosition,PointPressureSensitivity} from 'urndr/presets/pointfx.js'
MODULES.loadModule(new RandomPointPosition())
MODULES.loadModule(new PointPressureSensitivity({
	pen : PEN
}))

import {StrokeFade,StrokeWiggle,DeleteFlaggedStroke,SmoothStroke,Stroke3DMapping} from 'urndr/presets/strokefx.js'
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

const display = () => {
	U3.update();
	MODULES.runEnabledModulesInList(BaseModule.STROKE_MODULE, STROKES);
	MODULES.runEnabledModulesInList(BaseModule.DRAW_MODULE, {
		strokes: STROKES,
		canvasManager: cavMan
	})
	requestAnimationFrame(display);
}
display();
