"use strict"

//
// APIs & Libraries
//

var WACOM = document.getElementById('Wacom').penAPI;
    WACOM = WACOM || {pressure:1};

// Three.js

var SCENE, CAMERA, RENDERER, MESH, RAYCASTER;
    SCENE = new THREE.Scene();
    // SCENE.fog = new THREE.Fog( 0xF0F0F0 , 3, 5);
    CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    RENDERER = new THREE.WebGLRenderer( {
        canvas: document.getElementById('lighttable'),
        precision: "lowp",
        alpha: true
    } );
    RENDERER.setSize( window.innerWidth, window.innerHeight );
    RAYCASTER = new THREE.Raycaster();

document.body.appendChild( RENDERER.domElement );

// Set up environment for testing; module in the future...
var MESH, ANIMATION;
var loader = new THREE.JSONLoader();
loader.load( "models/human_01.js" , function( geometry ){

    //
    // ON LOAD
    //

    var mat = new THREE.MeshBasicMaterial( {
        color: 0xFFFFFF,
        vertexColors: THREE.FaceColors, 
        
        fog: true,
        
        wireframe: true, 
        wireframeLinewidth: 0.1,

        morphTargets: true,

        side: THREE.CullFaceBack
    } );

    MESH = new THREE.Mesh( geometry , mat )
    MESH.geometry.computeBoundingBox()
    var y_len = (MESH.geometry.boundingBox.max.y - MESH.geometry.boundingBox.min.y)
    var scale = 5 / y_len
    MESH.scale.set( scale , scale , scale )
    MESH.rotation.set( 0 , 4 , 0 )
    MESH.position.set( 0 , - 0.45 * y_len * scale , 0)

    ANIMATION = new THREE.MorphAnimation( MESH );
    ANIMATION.play();

    SCENE.add( MESH );

})
CAMERA.position.set( 0 , 0 , 5)

//
// OBJECTS
//
var STYLE, PEN, MODULES, STROKES, HUD, FRAMES, CANVAS, PAPER;

CANVAS = document.getElementById('paper');
CANVAS.width = RENDERER.domElement.width; CANVAS.height = RENDERER.domElement.height;
PAPER = CANVAS.getContext("2d");

STYLE = new URNDR.StrokeStyle();
PEN = new URNDR.Pen();
MODULES = new URNDR.ModuleManager();
STROKES = new URNDR.Strokes();
HUD = new URNDR.Hud( document.getElementById('HUD') );

//
// EVENTS
//

document.addEventListener("keydown", function (event) {

    var i,k,key,ignores,commands;
        key = event.keyCode || event.charCode

        ignores = {
            CmdR : function() { return (key === 82) && event.metaKey },
            mac_console : function() { return (key === 73) && event.metaKey && event.altKey; },
            chrome_presentation_mode : function() { return (key === 70) && event.metaKey && event.shiftKey; },
            full_screen : function() { return (key === 70) && event.ctrlKey && event.metaKey; }
        }
        for ( var scenario in ignores ) { if (ignores[scenario]()) { return false; } }

        var result = MODULES.toggleModuleByKey( key );
    
        if (result.type === URNDR.COMMAND_MODULE) {

            event.preventDefault();

            var msg = result.func()

            HUD.display(result.name , msg )

        } else if (result !== 0) {

            event.preventDefault();

            HUD.display(result.name,( result.enabled ? "ON" : "OFF" ))

        } else { HUD.display("key_pressed: "+key) }

});

CANVAS.addEventListener("mouseup", function (event) {

    if (PEN.drawingMode === 1) {
        // STROKES.optimize( STROKES.getActiveStroke() )
        // deselect stroke
        STROKES.active_stroke = 0
    }

    PEN.isDown = 0;

});
CANVAS.addEventListener("mousedown", function (event) {

    if (PEN.drawingMode === 1) {

        STROKES.beginNewStroke();

    }
    
    PEN.isDown = 1;

    PAPER.lineCap = STYLE.cap
    PAPER.lineJoin = STYLE.join

});
CANVAS.addEventListener("mousemove", Cowboy.throttle( 30 , function (event) {

    var mouse_data = PEN.getMousePos(CANVAS, event);
    mouse_data.pressure = WACOM.pressure;
    PEN.updatePen( mouse_data )

    if (PEN.isDown !== 1) { return false; }

    MODULES.runEnabledModulesInList(URNDR.STYLE_MODULE, STYLE )

    var point = {
        X : PEN.x,
        Y : PEN.y,
        S : STYLE.brush_size,
        R : STYLE.color.r, G : STYLE.color.g, B : STYLE.color.b,
        A : STYLE.color.a
    }

    // Point's 3d data
    var penNDC = new THREE.Vector2( PEN.ndc_x , PEN.ndc_y )
    
    RAYCASTER.setFromCamera( penNDC , CAMERA )

    var intersects = RAYCASTER.intersectObjects( SCENE.children );
    if (intersects.length > 0) {
        
        var i0, obj, face, vertices, a, b, c
            i0 = intersects[0]
            obj = i0.object
            face = i0.face
            vertices = obj.geometry.vertices

        point.OBJECT = obj;
        point.FACE = face
        
        a = obj.localToWorld( obj.getMorphedVertex( i0.face.a ) ).project(CAMERA)
        b = obj.localToWorld( obj.getMorphedVertex( i0.face.b ) ).project(CAMERA)
        c = obj.localToWorld( obj.getMorphedVertex( i0.face.c ) ).project(CAMERA)
        
        var bco = URNDR.Math.getBarycentricCoordinate( penNDC , a, b, c );
        
        point.BU = bco.u
        point.BV = bco.v
        point.BW = bco.w

    }
    
    // Run modules that changes the point.
    MODULES.runEnabledModulesInList( URNDR.POINT_MODULE , point )

    // WRITE POINT INTO STROKE
    var active_stroke = STROKES.getActiveStroke();
    if (active_stroke !== 0) {
        STROKES.getActiveStroke().addPoint( point )
    }

}) );
CANVAS.addEventListener("mouseout", function ( event ) {

    PEN.isDown = 0;

});

var counter = 0;
// requestAnimationFrame
var display = function() {

    // RENDER
    if ( MESH ) {

        ANIMATION.update( 8 );
        MESH.rotation.y += 0.003;

    }


    RENDERER.render(SCENE,CAMERA);

    if (STROKES.getStrokesCount() > 0) {

        MODULES.runEnabledModulesInList(URNDR.STROKE_MODULE , STROKES );
        MODULES.runEnabledModulesInList(URNDR.DRAW_MODULE , {strokes:STROKES,context:PAPER} );
        
    }
    
    counter = counter + 1;
    
    requestAnimationFrame( display );

}
display();

//
// HELPER FUNCTIONS
//

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