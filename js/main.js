"use strict"

//
// APIs & Libraries
//

var WACOM = document.getElementById('Wacom').penAPI || {pressure:3};
var U3 = new URNDR.ThreeManager( {
        canvas: document.getElementById('lighttable'),
        fog: new THREE.Fog( 0xF0F0F0, 3, 5 ),
        defaultMaterial: new THREE.MeshBasicMaterial( {

            color: 0x333333,
            vertexColors: THREE.FaceColors, 
            
            fog: true,
            
            wireframe: true, 
            wireframeLinewidth: 0.1,

            morphTargets: true,
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
    HUD = new URNDR.Hud( document.getElementById('HUD') );

document.body.appendChild( U3.renderer.domElement );
CANVAS.width = U3.renderer.domElement.width;
CANVAS.height = U3.renderer.domElement.height;
PAPER.lineCap = STYLE.cap
PAPER.lineJoin = STYLE.join

var STROKES = new URNDR.Strokes({
    canvasWidth: CANVAS.width,
    canvasHeight: CANVAS.height
})

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
        var astk = this.strokes.getActiveStroke()
        astk.optimize();
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
            
            a = obj.localToWorld( obj.getMorphedVertex( i0.face.a ) ).project( this.u3.camera )
            b = obj.localToWorld( obj.getMorphedVertex( i0.face.b ) ).project( this.u3.camera )
            c = obj.localToWorld( obj.getMorphedVertex( i0.face.c ) ).project( this.u3.camera )
            
            var bco = URNDR.Math.getBarycentricCoordinate( penNDC , a, b, c );

            // write to point
            
            point.OBJECT = obj;
            point.FACE = face;
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
PEN.addTool( new URNDR.PenTool({

    name: "Eraser",
    style: STYLE,
    strokes: STROKES,
    onmousedown: function(pen, evt){},
    onmouseup: function(pen, evt){
        var strokes_to_delete = [];
        this.strokes.eachStroke(function(stk){
            var alpha_sum = 0;
            var alpha_flag = false;
            stk.eachPoint( function(pnt){
                if (pnt.A > 0.1) {
                    alpha_flag = true;
                }
                alpha_sum += pnt.A
            })
            if (alpha_sum < 0.05 && alpha_flag === false) {
                strokes_to_delete.push( stk.id )
            }
        })
        for (var i in strokes_to_delete) {
            this.strokes.deleteStrokeByID( strokes_to_delete[i] )
        }
    },
    onmousemove: function(pen, evt){
        var query = this.strokes.getFromQuadTree( pen.x, pen.y, pen.pressure, pen.pressure ),
            pnt, 
            dist_sq,
            size_sq = pen.pressure * this.style.brush_size * pen.pressure * this.style.brush_size * 0.3,
            power = (1.1 - pen.pressure);

        power = power > 0.95 ? 0.95 : power;

        for(var q in query) {
            pnt = query[q].point
            dist_sq = ( pen.x - pnt.X )*( pen.x - pnt.X ) + ( pen.y - pnt.Y )*( pen.y - pnt.Y )
            if ( dist_sq < size_sq ) {
                if (pnt.A > 0.2) {
                    pnt.A *= power;
                } else {
                    pnt.A = 0
                }
            }
        }
    }

}));
PEN.addTool( new URNDR.PenTool({

    name: "Mover",
    timer: null,
    threeManager: U3,
    onmousedown: function(pen, evt){

        var tool = this;

        clearInterval(this.timer)

        this.timer = setInterval( function(){

            tool.threeManager.eachModel( function(model,value) {

                model.mesh.rotation.y += value;

                model.animationObject.update( 4 )

            }, pen.ndc_x * 0.1 )

        } , 20)

    },
    onmouseup: function(pen, evt){

        clearInterval( this.timer )

    },
    onmouseout: function(){

        clearInterval( this.timer )

    },
    onmousemove: function(pen, evt){}

}));

//
// INIT
//

window.onload = function() {

    //
    // Models
    //

    U3.createModelFromFile( "models/human_02.js" );

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

        U3.update();

        MODULES.runEnabledModulesInList(URNDR.STROKE_MODULE , STROKES );
        MODULES.runEnabledModulesInList(URNDR.DRAW_MODULE , {strokes:STROKES, context:PAPER} );

        STROKES.rebuildQuadTree();
        
        // recursive
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