"use strict";

var WACOM = document.getElementById('Wacom').penAPI || {pressure:3};
var U3 = new URNDR.ThreeManager( {
    canvas: document.getElementById('canvas_three'),
    material: new THREE.MeshBasicMaterial( {
        color: 0xCCCCCC,
        wireframe: true, 
        wireframeLinewidth: 2,
        morphTargets: true
    } )
} )
U3.renderer.context.preserveDrawingBuffer = true;

var HUD = new URNDR.Hud( document.getElementById('HUD') );

var MODULES = new URNDR.ModuleManager();
var STYLE = new URNDR.StrokeStyle();

var cavMan = new URNDR.CanvasManager();
    cavMan.add( document.getElementById('canvas_urndr') , "draw" , "2d" )
    cavMan.add( document.getElementById('canvas_hud') , "hud" , "2d" )
    cavMan.lineCap = STYLE.cap;
    cavMan.lineJoin = STYLE.join;

var PEN = new URNDR.Pen( cavMan.get("draw").element, cavMan.get("hud").element, WACOM );
var STROKES = new URNDR.Strokes( cavMan.get("draw").element );

PEN.addTool(new URNDR.PenTool({

    name: "Draw",
    strokes: STROKES,
    modules: MODULES,
    u3: U3,
    onmousedown: function(pen, evt){
        this.strokes.beginNewStroke();
    },
    onmouseup: function(pen, evt){
        var astk = this.strokes.getActiveStroke()
        astk.optimize();
    },
    onmousemove: function(pen, evt){

        if (pen.isDown !== 1) { return; }

        this.modules.runEnabledModulesInList(URNDR.STYLE_MODULE, STYLE )

        var pnt = new URNDR.Point({
            X : pen.x,
            Y : pen.y,
            S : STYLE.brush_size,
            R : STYLE.color[0], G : STYLE.color[1], B : STYLE.color[2],
            A : STYLE.color[3]
        });

        // WRITE POINT INTO STROKE
        var stk = this.strokes.getActiveStroke();
        if (stk !== 0) { stk.addPoint( pnt ) }

        // Run modules that changes the pnt.
        this.modules.runEnabledModulesInList( URNDR.POINT_MODULE , pnt )

        pnt.refreshBinding( U3 )

    }

}), true)
PEN.addTool( new URNDR.PenTool({

    name: "Eraser",
    style: STYLE,
    strokes: STROKES,
    delMod: undefined,
    init: function(){},
    onmousedown: function(pen, evt){},
    onmouseup: function(pen, evt){},
    onmousemove: function(pen, evt){

        if (pen.isDown !== 1) { return; }
        var s = pen.pressure;
        if (s < 0.1) {s = 0.1};

        var query = this.strokes.getFromQuadTree( pen.x, pen.y, s, s ),
            pnt, dx, dy, dist_sq,
            size_sq = s * this.style.brush_size * this.style.brush_size,
            power = 1 - s;

        power = power > 0.75 ? 0.75 : power;

        for(var q in query) {
            pnt = query[q].reference.point;
            dx = pen.x - pnt.X; dy = pen.y - pnt.Y;
            dist_sq = dx * dx + dy * dy;
            if ( dist_sq < size_sq ) {
                pnt.A = pnt.A > 0.2 ? pnt.A * power : 0;
            }
        }

    }

}));
window.onload = function() {

    // Canvas Setup
    // notify the renderer of the size change
    U3.renderer.setSize( 500, 500 );
    // update the camera
    U3.speed = 16.666666666666666;
    U3.camera.aspect = 1;
    U3.camera.updateProjectionMatrix();
    cavMan.resize( 500 , 500 );
	
	// Load Model
	U3.createModelFromFile("models/man_walk.js",{
		init: function() {
			this.mesh.scale.multiplyScalar( 0.03 );
			this.mesh.position.y = -2.5;
			this.animation = new THREE.MorphAnimation( this.mesh )
            this.animation.play();
		}
	})

    //
    // EVENTS
    //

    document.addEventListener("keydown", function (event) {

        var i,k,key,ignores,commands;
            key = event.keyCode || event.charCode

            ignores = {
                refresh: function() {
                    return (key === 82) && event.metaKey;
                },
                console: function() {
                    return (key === 73) && event.metaKey && event.altKey;
                },
                fullscreen: function() {
                    return (key === 70) && event.ctrlKey && event.metaKey;
                },
                fullscreen2: function() {
                    return (key === 70) && event.metaKey && event.shiftKey;
                },
            }
            for ( var scenario in ignores ) {
                if ( ignores[scenario]() ) {
                    return false;
                }
            }

            event.preventDefault();

            var response = MODULES.trigger( event );

            if (response === 0) {
                HUD.display("key_pressed: "+key);
            } else {
                HUD.display(response.module.name, response.message);
            }

    });

	// requestAnimationFrame
    U3.playing = true;
	var display = function() {
        if (U3.playing) {
		  U3.update();
        }
		MODULES.runEnabledModulesInList(URNDR.STROKE_MODULE , STROKES);
		MODULES.runEnabledModulesInList(URNDR.DRAW_MODULE, {
			strokes: STROKES, 
			canvasManager: cavMan
		})
		STROKES.rebuildQuadTree();

		requestAnimationFrame( display );
	}
	display();
}

