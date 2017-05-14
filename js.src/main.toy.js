import THREE from './three.js'
import {
	BaseModule, ThreeManager, ModuleManager,
	CanvasManager, StrokeStyle, Strokes,
	Point, Hud, Pen, PenTool, Module, UIManager
} from 'urndr'
import {PanTool,DrawTool,EraseTool,ModifyTool} from 'urndr/presets/pentools.js'
import {SetRandomColorScheme} from 'urndr/presets/commands.js'
import {RandomStrokeColor, ColorVariation} from 'urndr/presets/styles.js'
import {RandomPointPosition,PointPressureSensitivity} from 'urndr/presets/pointfx.js'
import {StrokeFade,StrokeWiggle,DeleteFlaggedStroke,SmoothStroke,Stroke3DMapping} from 'urndr/presets/strokefx.js'
import {LegacyRenderer} from 'urndr/renderers/CanvasRenderModules'

const _ui = new UIManager(document.querySelector('.sidebar.right'))

const _threeManager = new ThreeManager({
	fog: new THREE.FogExp2(0xFFFFFF,0.33),
	canvas: document.getElementById('canvas_three'),
	material: new THREE.MeshBasicMaterial({
		color: 0xCCCCCC,
		wireframe: true,
		wireframeLinewidth: 0.5,
		morphTargets: true
	})
})
_threeManager.speed = 16.6666;
_threeManager.renderer.setClearColor(0xFFFFFF);

const _urndrDisplay = new Hud(document.getElementById('HUD'));
const _modules = new ModuleManager();
const _style = new StrokeStyle();
_style.createUI(_ui)
const cavMan = new CanvasManager();
cavMan.add(document.getElementById('canvas_urndr'), "draw", "2d")
cavMan.add(document.getElementById('canvas_hud'), "hud", "2d")
cavMan.lineCap = _style.cap;
cavMan.lineJoin = _style.join;

cavMan.createUI(_ui)

const _strokes = new Strokes();

const _pen = new Pen({
	canvas_draw : cavMan.get("draw").element,
	canvas_hud : cavMan.get("hud").element,
	strokes : _strokes
});

const resize = (width=500,height=500) => {
	_threeManager.renderer.setSize(width, height);
	cavMan.resize(width, height);
	_threeManager.camera.aspect = width / height;
	_threeManager.camera.updateProjectionMatrix();
	_strokes.bound.width = width
	_strokes.bound.height = height
}
resize(500,500)

_pen.add(new DrawTool({strokes:_strokes,modules:_modules,threeManager:_threeManager,style:_style}))
_pen.add(new EraseTool({strokes:_strokes,modules:_modules,threeManager:_threeManager,style:_style}))
_pen.add(new ModifyTool({strokes:_strokes,modules:_modules,threeManager:_threeManager,style:_style}))
_pen.add(new PanTool({strokes:_strokes,modules:_modules,threeManager:_threeManager,style:_style}))
_pen.select(0)

_pen.createUI(_ui)

// Load Model
_threeManager.createModelFromFile("models/p.js", {
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
_threeManager.createModelFromFile("models/man_run.js", {
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
_threeManager.createModelFromFile("models/dog_run.js", {
	init: function() {
		this.animation = new THREE.MorphAnimation(this.mesh)
		this.mesh.scale.multiplyScalar(0.04);
		this.mesh.position.y = -1.7;
		this.focusPoint = 0;
	},
	onfocus: function() {
		this.animation.play();
		_threeManager.rig.focus.y = 0;
	},
	onblur: function() { this.animation.pause(); }
});
_threeManager.createModelFromFile("models/twister.js", {
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
		_threeManager.rig.focus.y = 0;
	},
	onblur: function() { this.animation.pause(); }
});
_threeManager.solo(0)

_threeManager.createUI(_ui)

_modules.add( SetRandomColorScheme({
	strokes : _strokes,
	style : _style,
	threeManager : _threeManager
}) )
_modules.add( RandomStrokeColor() )
_modules.add( ColorVariation() )
_modules.add( RandomPointPosition() )
_modules.add( PointPressureSensitivity({pen : _pen}))
_modules.add( DeleteFlaggedStroke() )
_modules.add( Stroke3DMapping({canvasManager:cavMan,threeManager:_threeManager}) )
_modules.add( SmoothStroke() )
_modules.add( StrokeFade() )
_modules.add( StrokeWiggle() )
_modules.add( LegacyRenderer({
	strokes : _strokes,
	threeManager : _threeManager,
	style : _style
}) )

_modules.createUI(_ui)

const display = () => {
	_threeManager.update();
	_modules.runModules(BaseModule.STROKE_MODULE, _strokes);
	_modules.runModules(BaseModule.DRAW_MODULE, {
		strokes: _strokes,
		canvasManager: cavMan
	})
	_ui.update()
	requestAnimationFrame(display);
}
display();
