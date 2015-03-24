"use strict"

//
// APIs & Libraries
//

var WACOM = document.getElementById('Wacom').penAPI || {pressure:3};
var U3 = new URNDR.ThreeManager( {
        canvas: document.getElementById('lighttable'),
        defaultMaterial: new THREE.MeshBasicMaterial( {
            color: 0xFFFFFF,
            vertexColors: THREE.FaceColors, 
            
            fog: true,
            
            wireframe: true, 
            wireframeLinewidth: 0.1,

            morphTargets: true,

            side: THREE.CullFaceBack
        } ),
        animationSpeed: 4
    } ),
    RAYCASTER = new THREE.Raycaster();

//
// OBJECTS
//
var CANVAS = document.getElementById('paper'), 
    PAPER = CANVAS.getContext("2d"),
    STYLE = new URNDR.StrokeStyle(),
    PEN = new URNDR.Pen( CANVAS , WACOM ),
    MODULES = new URNDR.ModuleManager(),
    STROKES = new URNDR.Strokes(),
    HUD = new URNDR.Hud( document.getElementById('HUD') );

//
// PenTools
//

PEN.addTool(new URNDR.PenTool({

    name: "Draw",
    strokes: STROKES,
    modules: MODULES,
    u3: U3,
    onmousedown: function(pen, evt){
        this.strokes.beginNewStroke();
    },
    onmouseup: function(pen, evt){
        this.strokes.getActiveStroke().simplify();
    },
    onmousemove: function(pen, evt){

        this.modules.runEnabledModulesInList(URNDR.STYLE_MODULE, STYLE )

        var point = new URNDR.Point({
                    X : pen.x,
                    Y : pen.y,
                    S : STYLE.brush_size,
                    R : STYLE.color.r, G : STYLE.color.g, B : STYLE.color.b,
                    A : STYLE.color.a
            });
        var penNDC = new THREE.Vector2( pen.ndc_x , pen.ndc_y )
        
        RAYCASTER.setFromCamera( penNDC , this.u3.camera )

        var intersects = RAYCASTER.intersectObjects( this.u3.scene.children );
        if (intersects.length > 0) {
            
            var i0, obj, face, vertices, a, b, c
                i0 = intersects[0]
                obj = i0.object
                face = i0.face
                vertices = obj.geometry.vertices

            point.OBJECT = obj;
            point.FACE = face
            
            a = obj.localToWorld( obj.getMorphedVertex( i0.face.a ) ).project(this.u3.camera)
            b = obj.localToWorld( obj.getMorphedVertex( i0.face.b ) ).project(this.u3.camera)
            c = obj.localToWorld( obj.getMorphedVertex( i0.face.c ) ).project(this.u3.camera)
            
            var bco = URNDR.Math.getBarycentricCoordinate( penNDC , a, b, c );
            
            point.BU = bco.u
            point.BV = bco.v
            point.BW = bco.w

        }
        
        // Run modules that changes the point.
        this.modules.runEnabledModulesInList( URNDR.POINT_MODULE , point )

        // WRITE POINT INTO STROKE
        var active_stroke = this.strokes.getActiveStroke();
        if (active_stroke !== 0) {
            this.strokes.getActiveStroke().addPoint( point )
        }

    }

}), true)

//
// INIT
//

window.onload = function() {

    // DOM
    document.body.appendChild( U3.renderer.domElement );
    CANVAS.width = U3.renderer.domElement.width;
    CANVAS.height = U3.renderer.domElement.height;

    // CANVAS
    PAPER.lineCap = STYLE.cap
    PAPER.lineJoin = STYLE.join

    // Set up environment for testing; module in the future...
    var MESH, ANIMATION;
    var loader = new THREE.JSONLoader();
    loader.load( "models/human_02.js" , function( geometry ){

        //
        // ON LOAD
        //

        MESH = new THREE.Mesh( geometry , U3.defaultMaterial )
        MESH.geometry.computeBoundingBox()
        var y_len = (MESH.geometry.boundingBox.max.y - MESH.geometry.boundingBox.min.y)
        var scale = 5 / y_len
        MESH.scale.set( scale , scale , scale )
        MESH.rotation.set( 0 , 4 , 0 )
        MESH.position.set( 0 , - 0.45 * y_len * scale , 0)

        ANIMATION = new THREE.MorphAnimation( MESH );

        U3.scene.add( MESH );

    })

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

    // requestAnimationFrame
    var display = function() {

        U3.renderer.render( U3.scene, U3.camera );

        MODULES.runEnabledModulesInList(URNDR.STROKE_MODULE , STROKES );
        MODULES.runEnabledModulesInList(URNDR.DRAW_MODULE , {strokes:STROKES, context:PAPER} );
        
        requestAnimationFrame( display );

    }
    display();

}

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