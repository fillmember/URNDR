//
// APIs & Libraries
//

var WACOM;
	WACOM = document.getElementById('Wacom').penAPI;
	WACOM = WACOM ? WACOM : {pressure:1};

// Three.js

var SCENE, CAMERA, RENDERER, MESH, RAYCASTER;
	SCENE = new THREE.Scene();
	CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	RENDERER = new THREE.CanvasRenderer();
	RENDERER.setSize( window.innerWidth, window.innerHeight );
	RENDERER.domElement.setAttribute("id","lighttable")
	RENDERER.domElement.setAttribute("class","three canvas")
	RENDERER.domElement.setAttribute("onMouseDown","javascript:onMouseDown(event);")
	RENDERER.domElement.setAttribute("onMouseUp","javascript:onMouseUp(event);")
	RENDERER.domElement.setAttribute("onMouseMove","javascript:onMouseMove(event);")
	RENDERER.domElement.setAttribute("onMouseOut","javascript:onMouseOut(event);")
	RAYCASTER = new THREE.Raycaster();

document.body.appendChild( RENDERER.domElement );

// Set up environment for testing; module in the future...
MESH = new THREE.Mesh( new THREE.SphereGeometry(2,30,30) , new THREE.MeshBasicMaterial( { color: 0x00ff00 , wireframe: true } ) ); // new THREE.TorusKnotGeometry( 1.33, 0.4, 50, 10 );
SCENE.add( MESH );
CAMERA.position.z = 5;

var CANVAS,PAPER;
	CANVAS = document.getElementById('paper')
	CANVAS.width = RENDERER.domElement.width;
	CANVAS.height = RENDERER.domElement.height;
	PAPER = CANVAS.getContext("2d");

//
// CONSTANT / DATA_CONSTRUCTORS
//

COMMAND_MODULE = "COMMAND_MODULE"

//
// OBJECTS
//

var STYLE, PEN, MODULES, STROKES, HUD, FRAMES;

STYLE = new function() {
	this.cap = "round"; join = "round";
	this.composit = "source-over";
	this.brush_size = 80;
	this.color = {r:128,g:128,b:128,a:1};
};
PEN = new function() {
	this.x = 0
	this.y = 0
	this.ndc_x = 0
	this.ndc_y = 0
	this.pressure = 0
	this.active = 0
};
MODULES = new function() {
	this.style_modules = new Object();
	this.point_data_modules = new Object();
	this.stroke_data_modules = new Object();
	this.draw_modules = new Object();
	this.command_modules = new Object();
	this.key_map = new Object();
	// functions
	this.KEY_PREFIX = "KEY";
	this.setKeyMap = function( keyCode , type , id ) { this.key_map[ this.KEY_PREFIX + keyCode ] = { type: type , id: id } }
	this.getModuleReferenceFromKeyMap = function( keyCode ) {
		var result = this.key_map[ this.KEY_PREFIX + keyCode ];
		return (result? result : false)
	}
	this.loadModule = function ( module ) {
		if (typeof module === "function") { module = new module(); }
		var type, id;
			type = module.type+"_modules";
			id = module.id;
		try {
			this[type][id] = module; //setModule
		} catch(err) { HUD.display("failed to load one of the modules.","error: "+err); }
		if (module.keyCode) this.setKeyMap(module.keyCode, type, id)
	}
	this.loadAllModules = function ( list ) { for ( l in list ) { this.loadModule( list[l] ) } }
	this.getModule = function(type,id){ return this[type][id] }
	this.toggleModuleByKey = function (keyCode) {
		var obj = this.getModuleReferenceFromKeyMap(keyCode);
		if ( ! obj ) { return 0; }
		var target = this.getModule(obj.type,obj.id);
		switch( obj.type ) {
			case "command_modules":
				return { type: COMMAND_MODULE , name: target.name , func : target.func }
				break;
			case "draw_modules":
				this.soloModule( target );
				return { name: target.name , enabled : target.enabled }
				break;
			default:
				target.enabled = ! target.enabled;
				return { name: target.name , enabled : target.enabled }
				break;
		}
	}
	this.soloModule = function( mod ) {
		var list = this[mod.type+"_modules"];
		for( var m in list ) {
			if (list[m].id === mod.id) {
				list[m].enabled = true;
			} else {
				list[m].enabled = false;
			}
		}
	}
	this.runEnabledModulesInList = function (list_name, params) {
		var list = this[list_name],
			enabled_count = 0;
		for (m in list) {
			if (list[m].enabled) {
				list[m].func(params);
				enabled_count ++;
			}
		}
		return enabled_count;
	}
	this.getEnabledModulesCount = function( list_name ) {
		var list = this[list_name], enabled_count = 0;
		for (m in list) if (list[m].enabled) enabled_count ++
		return enabled_count;
	}
	this.resetModules = function( list_name ) { }
};

var _strokes = function(){
	this.data = {
		// Vector Data
		X:new Array(),Y:new Array(),Z:new Array(),S:new Array(),
		// Colour Data
		R:new Array(),G:new Array(),B:new Array(),A:new Array()
	};
	this.active_stroke = 0;
	for ( p in this.data ) { this.data[p][0] = new Array(); }
	// functions
	this.getStroke = function(stroke_n) {
		var result = new Object();
		for (p in this.data) { result[p] = this.data[p][stroke_n] }
		return result;
	}
	this.deleteStroke = function(stroke_n) {
		for (p in this.data) { this.data[p].splice( stroke_n , 1 ) }
		this.active_stroke--;
	}
	this.deletePointInStroke = function( stroke_n , point_n ) { for (p in this.data ) { this.data[p][stroke_n].splice(point_n, 1)} }
	this.setPointInStroke = function( stroke_n , point_n , data_set ) {
		for ( p in data_set ) { if (this.data.hasOwnProperty(p)) { this.data[p][stroke_n][point_n] = data_set[p]; } }
	}
	this.addNewPointInStroke = function( stroke_n , point ) { for ( p in this.data ) { this.data[p][stroke_n].push(point[p]) } }
	this.getStrokesCount = function() { return this.data.X.length; }
	this.getStrokeLength = function(stroke_n) { return this.data.X[stroke_n].length; }
	this.beginNewStroke = function() {
		for ( p in this.data ) { this.data[p].push(new Array()) }
		this.active_stroke++;
	}
	this.getActiveStroke = function() { return this.active_stroke; }
	this.getStrokeCenter = function(stroke_n) {
		var stroke = this.getStroke(stroke_n),
			len = this.getStrokeLength(stroke_n),
			sum = [0,0,0];
		for( var p = 0 ; p < len ; p ++ ) { sum[0] += stroke.X[p]; sum[1] += stroke.Y[p]; sum[2] += stroke.Z[p]; }
		sum[0] /= len; sum[1] /= len; sum[2] /= len;
		return sum;
	}
};
STROKES = new _strokes();

HUD = new function() {
	this.box = document.getElementById('HUD');
	this.messageStyle = { prefix : '<div class="argument">', suffix : '</div>', seperation : '' }
	// METHODS
	this.display = function() {
		this.box.innerHTML = this.makeMessage( arguments[0] );
		for (var i=1;i<arguments.length;i++) { this.box.innerHTML += this.messageStyle.seperation + this.makeMessage( arguments[i] ); }
	}
	this.appendToDisplay = function() { for (var i=0;i<arguments.length;i++) { this.box.innerHTML += '<br />' + arguments[i]; } }
	this.makeMessage = function(msg) {
		return this.messageStyle.prefix + msg + this.messageStyle.suffix;
	}
	this.clearDisplay = function() { this.box.innerHTML = null; }
}

FRAMES = new function() {
	this.data = {};
	this.KEY_PREFIX = "f";
	this.DEFAULT_FRAME_NAME = "Frame";
	this.DEFAULT_FRAME_TYPE = "keyframe";
	this.DEFAULT_FRAME_DURATION = 1;
	this.activeFrame = 0;
	this.getFrame = function ( frame_n ) {
		var f = this.KEY_PREFIX+frame_n;
		if ( this.data.hasOwnProperty(f) ) {
			return this.data[f];
		} else {
			return false;
		}
	}
	this.getFramesCount = function() {
		return Object.keys(this.data).length;
	}
	this.setFrame = function ( frame_n , data ) {
		var this_frame = this.getFrame(frame_n);
		if (this_frame) {
			if (data === undefined) return HUD.display("Error","Set exisiting frame "+frame_n+" but without data. ")
			for( var p in this_frame ){ if( data.hasOwnProperty(p) ) { this_frame[p] = data[p]; } }
		} else {
			this.createNewFrame(frame_n, data);
		}
	}
	this.deleteFrame = function ( frame_n ) {
		try {
			delete this.data[this.KEY_PREFIX + frame_n]
			return true;
		} catch (error) {
			console.log(error)
			return false;
		}
	}
	this.clearFrame = function ( frame_n ) {
		var f = getFrame(frame_n)
		if (f) {
			f.strokes_data = null;
		} else {
			return false;
		}
	}
	this.createNewFrame = function ( frame_n , data ) {
		this.data[this.KEY_PREFIX + frame_n] = this.createFrameInstance( data );
	}
	this.createFrameInstance = function ( data ) {
		var obj = {
			frame_name : this.DEFAULT_FRAME_NAME,
			frame_type : this.DEFAULT_FRAME_TYPE,
			frame_duration : this.DEFAULT_FRAME_DURATION,
			strokes_data : {}
		};
		if(data) { for ( var p in obj ){ if( data.hasOwnProperty(p) ){ obj[p] = data[p] } } }
		return obj;
	}
	this.getNearestFrameNumber = function ( frame_n , direction , frame_type ) {
		var keys,leng,pos;
			keys = Object.keys(this.data).sort();
			leng = keys.length;
		if (leng === 0) return false;
			pos = keys.indexOf( this.KEY_PREFIX + frame_n );
		if (pos === keys.length - 1 ) return false;
		if (pos === 0) return false;
		return pos + direction;
	}
}

//
// EVENTS
//

function onKeyDown(event) {
	var i,k,key,ignores,commands;
		key = event.keyCode || event.charCode

		ignores = {
			CmdR : function() { return (key === 82) && event.metaKey },
			mac_console : function() { return (key === 73) && event.metaKey && event.altKey; },
			chrome_presentation_mode : function() { return (key === 70) && event.metaKey && event.shiftKey; },
			full_screen : function() { return (key === 70) && event.ctrlKey && event.metaKey; }
		}
		for ( scenario in ignores ) { if (ignores[scenario]()) { return false; } }

		var result = MODULES.toggleModuleByKey( key );
		if (result.type !== 0) { event.preventDefault(); }
		if (result.type === COMMAND_MODULE) { HUD.display(result.name , result.func() )
		} else if (result != 0) { HUD.display("MODULE "+result.name,( result.enabled ? "ON" : "OFF" ))
		} else { HUD.display("key_pressed: "+key) }

}

function onMouseDown(event) { PEN.active = 1; }
function onMouseUp(event) {
	PEN.active = 0;
	if (PEN.active !== 0) return false;
	if (STROKES.data.X.length === 0) {return false;}
	STROKES.beginNewStroke();
}
function onMouseMove(event) {
	if (PEN.active !== 1) { return false; }
	style();
	//
	var mouse_data = getMousePos(CANVAS, event);
	//
	for (var k in mouse_data) { PEN[k] = mouse_data[k]; }
	PEN.pressure = WACOM.pressure;
	update();
}
function onMouseOut(event) { PEN.active = 0; }

var iteration = 0;
// requestAnimationFrame
var UPDATER = function() {
	update(0); draw(0);
	iteration ++;
	requestAnimationFrame( UPDATER )
}
UPDATER();

//
// HELPER FUNCTIONS
//

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	var obj = {};
		obj.x = evt.clientX - rect.left;
		obj.y = evt.clientY - rect.top;
		obj.ndc_x = ( obj.x / window.innerWidth ) * 2 - 1;
		obj.ndc_y = - ( obj.y / window.innerHeight ) * 2 + 1;
	return obj;
}

function clear(a) {
	if (a === 1) { PAPER.clearRect(0,0,CANVAS.width,CANVAS.height)
	} else {
		PAPER.save();
		PAPER.globalAlpha = a;
		PAPER.globalCompositeOperation = "destination-out";
		PAPER.fillRect(0,0,CANVAS.width,CANVAS.height);
		PAPER.restore();
	}
}