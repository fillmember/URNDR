"use strict"

//
// APIs & Libraries
//

var WACOM = document.getElementById('Wacom').penAPI || {pressure:3};
var U3 = new URNDR.ThreeManager( {
    canvas: document.getElementById('canvas_three'),
    fog: new THREE.Fog( 0xF0F0F0, 3, 5 ),
    defaultMaterial: new THREE.MeshBasicMaterial( {

        color: 0xFFFFFF,
        vertexColors: THREE.FaceColors, 
        
        fog: true,
        
        wireframe: true, 
        wireframeLinewidth: 0.1,

        morphTargets: true,
    } )
} )

//
// OBJECTS
//
var CANVAS = document.getElementById('canvas_urndr'),
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

        if (pen.isDown !== 1) { return; }

        this.modules.runEnabledModulesInList(URNDR.STYLE_MODULE, STYLE )

        var point = new URNDR.Point({
            X : pen.x,
            Y : pen.y,
            S : STYLE.brush_size,
            R : STYLE.color[0], G : STYLE.color[1], B : STYLE.color[2],
            A : STYLE.color[3]
        });

        point.refreshBinding( U3 )
        
        // Run modules that changes the point.
        this.modules.runEnabledModulesInList( URNDR.POINT_MODULE , point )

        // WRITE POINT INTO STROKE
        var active_stroke = this.strokes.getActiveStroke();
        if (active_stroke !== 0) { this.strokes.getActiveStroke().addPoint( point ) }

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

        if (pen.isDown !== 1) { return; }
        var s = pen.pressure;
        if (s < 0.1) {s = 0.1};

        var query = this.strokes.getFromQuadTree( pen.x, pen.y, s, s ),
            pnt, 
            dist_sq,
            size_sq = s * this.style.brush_size * s * this.style.brush_size * 0.3,
            power = (1.1 - s);

        power = power > 0.95 ? 0.95 : power;

        for(var q in query) {
            pnt = query[q].reference.point
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

                model.animationObject.update( 10 )

            }, pen.ndc_x * 0.1 )

        } , 20)

    },
    onmouseup: function(pen, evt){

        clearInterval( this.timer )

    }

}));
PEN.addTool( new URNDR.PenTool({

    name: "Stroke Selector",
    strokes: STROKES,
    limit: 360,
    selectedPoint: 0,
    sqr_dist: function( p, q ) {
        var dX = p.x - q.x,
            dY = p.y - q.y;
        return dX * dX + dY * dY
    },
    pick: function( q , str ) {
        if ( q.hasOwnProperty("reference") ) {
            if ( q.reference.hasOwnProperty( str ) ) {
                return true;
            }
        }
        return false;
    },
    nearest: function( p, arr, str ) {

        var len = arr.length,
            candidate = false,
            nearest_so_far = this.limit,
            dist;

        for (var i = 0; i < len; i++) {
            if ( this.pick( arr[i] , str ) ) {
                dist = this.sqr_dist( p, arr[i] )
                if ( dist < this.limit && dist < nearest_so_far ) {
                    candidate = i;
                    nearest_so_far = dist;
                }
            }
        }

        return candidate
    },
    onmousemove: function(pen,evt){

        this.strokes.eachStroke( function( stk ){ stk.hovered = false; })

        var query = this.strokes.getFromQuadTree( pen.x, pen.y, 5, 5 )
        var nearest = this.nearest( pen, query, "point" );
        if (nearest !== false) {
            nearest = query[ nearest ].reference
            nearest.stroke.hovered = true;
            if (pen.isDown) {
                if (this.selectedPoint === 0) {
                    this.selectedPoint = nearest.point;
                }
            }
        }
        if (this.selectedPoint !== 0) {
            this.selectedPoint.X = pen.x;
            this.selectedPoint.Y = pen.y;
            this.selectedPoint.refreshBinding( U3 )
        }

    },
    onmouseup: function(pen,evt){

        if (this.selectedPoint !== 0) { }

        this.selectedPoint = 0;

        this.strokes.eachStroke( function( stk ){ stk.selected = false; })

        var query = this.strokes.getFromQuadTree( pen.x, pen.y, 5, 5 );
        var nearest = this.nearest( pen, query, "point" );
        if ( nearest !== false) {
            nearest = query[ nearest ].reference
            nearest.stroke.selected = true;
        }

    }

}))

//
// INIT
//

window.onload = function() {

    //
    // Models
    //

    U3.createModelFromFile( "models/sphere.js", function( model ){

        model.mesh.scale.multiplyScalar(0.7)
        model.mesh.position.y = 0

    } );

    // U3.createModelFromFile( "models/human_01.js", function( model ) {
    //     model.mesh.position.x = 2
    // }  );
    // U3.createModelFromFile( "models/human_02.js", function( model ) {
    //     model.mesh.position.x = -2
    // } );

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

                HUD.display(result.name,( result.enabled ? "ON" : "OFF" ));

            } else {

                HUD.display("key_pressed: "+key);

            }

    });

    // requestAnimationFrame
    var display = function() {

        U3.update( 0 );

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