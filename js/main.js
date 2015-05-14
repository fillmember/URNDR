"use strict"

//
// APIs & Libraries
//

var WACOM = document.getElementById('Wacom').penAPI || {pressure:3};
var U3 = new URNDR.ThreeManager( {
    canvas: document.getElementById('canvas_three'),
    material: new THREE.MeshBasicMaterial( {
        color: 0xFFFFFF,
        wireframe: true, 
        wireframeLinewidth: 5,
        morphTargets: true
    } )
} )
document.body.appendChild( U3.renderer.domElement );

//
// OBJECTS
//

var CANVAS = document.getElementById('canvas_urndr');
var CANVAS_HUD = document.getElementById('canvas_hud');
    CANVAS_HUD.width = CANVAS.width = U3.renderer.domElement.width;
    CANVAS_HUD.height = CANVAS.height = U3.renderer.domElement.height;

var hudCtx = CANVAS_HUD.getContext("2d");

var HUD = new URNDR.Hud( document.getElementById('HUD') );
var MODULES = new URNDR.ModuleManager();
var PEN = new URNDR.Pen( CANVAS, CANVAS_HUD, WACOM );
var STROKES = new URNDR.Strokes( CANVAS );
var STYLE = new URNDR.StrokeStyle();
var PAPER = CANVAS.getContext("2d");
    PAPER.lineCap = STYLE.cap;
    PAPER.lineJoin = STYLE.join;

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
    delMod: undefined,
    init: function(){},
    onmousedown: function(pen, evt){},
    onmouseup: function(pen, evt){},
    onmousemove: function(pen, evt){

        if (pen.isDown !== 1) { return; }
        var s = pen.pressure;
        if (s < 0.1) {s = 0.1};

        var query = this.strokes.getFromQuadTree( pen.x, pen.y, s, s ),
            pnt, 
            dist_sq,
            size_sq = s * this.style.brush_size * s * this.style.brush_size * 0.3,
            power = 1 - s;

        power = power > 0.5 ? 0.5 : power;

        for(var q in query) {
            pnt = query[q].reference.point;
            dist_sq = ( pen.x - pnt.X )*( pen.x - pnt.X ) + ( pen.y - pnt.Y )*( pen.y - pnt.Y );
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

            U3.rig.target_theta += pen.ndc_x * 0.1;
            U3.rig.target_pitch = THREE.Math.mapLinear( pen.ndc_y, 1, -1, -2, 2 )

        } , 20)

    },
    onmouseup: function(pen, evt){

        clearInterval( this.timer )

    }

}));
PEN.addTool( new URNDR.PenTool({

    name: "Stroke Selector",
    strokes: STROKES,
    limit: 400,
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
                if ( dist < nearest_so_far ) {
                    candidate = i;
                    nearest_so_far = dist;
                }
            }
        }

        return candidate
    },
    onmousemove: function(pen,evt){

        this.strokes.eachStroke( function( stk ){ stk.hovered = false; })

        var query = this.strokes.getFromQuadTree( pen.x, pen.y, 0, 0 )
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
            this.strokes.active_stroke = nearest.stroke.id;
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
    function _static( model ) {
        model.animation = null;
    }
    function _style_architecture( model ) {
        model.mesh.scale.multiplyScalar( 0.8 )
    }
    U3.createModelFromFile( "models/cube.js", {
        init: function() {
            _static(this);
            _style_architecture(this);
        },
        onfocus: function(){
            U3.rig.target_pitch = 1.2;
            U3.rig.target_theta = -0.785;
        }
    } );
    U3.createModelFromFile( "models/house.js", {
        init: function() {
            _static(this);
            _style_architecture(this);
            this.mesh.position.y -= 0.125;
        },
        onfocus: function(){
            U3.rig.target_pitch = 1.4;
            U3.rig.target_theta = 0.785;
        }
    } );
    U3.createModelFromFile( "models/apartment.js",  {
        init: function() {
            _static(this);
            _style_architecture(this);
            this.mesh.position.y -= 0.25;
        },
        onfocus: function(){
            U3.rig.target_pitch = 1.7;
            U3.rig.target_theta = 0.785 + 0.3;
        }
    } );
    U3.createModelFromFile( "models/railhouse.js", {
        init: function() {
            _static(this);
            _style_architecture(this);
            this.mesh.position.y -= 0.5;
            this.mesh.position.x -= 1;
        },
        onfocus: function(){
            U3.rig.target_pitch = 2;
            U3.rig.target_theta = -0.785;
        }
    } );

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

        U3.update();

        MODULES.runEnabledModulesInList(URNDR.STROKE_MODULE , STROKES );
        MODULES.runEnabledModulesInList(URNDR.DRAW_MODULE , {strokes:STROKES, context:PAPER} );

        STROKES.rebuildQuadTree();
        
        requestAnimationFrame( display );

    }
    display();

}

//
// HELPER FUNCTIONS
//

function clear(a) {
    function func( ctx ){
        if (a === 1) { ctx.clearRect(0,0,CANVAS.width,CANVAS.height)
        } else {
            ctx.save();
            ctx.globalAlpha = a;
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillRect(0,0,CANVAS.width,CANVAS.height);
            ctx.restore();
        }
    }
    func( PAPER )
    func( hudCtx )
}