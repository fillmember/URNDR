"use strict";

//
// APIs & Libraries
//

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

//
// OBJECTS
//

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
PEN.addTool( new URNDR.PenTool({

    name: "Mover",
    timer: null,
    threeManager: U3,
    onmousedown: function(pen, evt){

        var tool = this;

        clearInterval(this.timer)

        this.timer = setInterval( function(){

            U3.rig.target_theta += pen.ndc_x * THREE.Math.clamp( THREE.Math.mapLinear( U3.speed , 30 , 60 , 0.1 , 0.2 ) , 0.1 , 0.2 );
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

window.onresize = size_and_style;
function size_and_style() {
    // notify the renderer of the size change
    U3.renderer.setSize( window.innerWidth, window.innerHeight );
    // update the camera
    U3.camera.aspect   = window.innerWidth / window.innerHeight;
    U3.camera.updateProjectionMatrix();
    // CavMan
    cavMan.resize(window.innerWidth,window.innerHeight)
}
size_and_style();

//
// INIT
//

window.onload = function() {

    //
    // Models
    //

    var preset = {
        rig: {
            pitch: function(x) {
                // X : 1/10
                // THREE.Math.mapLinear( rig.pitch , -1 , 1 , -2 , 2 )
                U3.rig.target_pitch = x * 0.1;
            },
            theta: function(x) {
                // X : 1 per 10 degree.
                // 10 degress = 1/36 * 2 * Math.PI() in radian = 0.1744444
                U3.rig.target_theta = x * 0.17444444;
            },
            add: function(property, x) {
                U3.rig["target_" + property] += preset.rig[property]( x );
            }
        },
        man: {
            init: function( model ) {
                model.mesh.scale.multiplyScalar( 0.03 );
                model.mesh.position.y = -3.6;
            },
            focus: function( model ) {}
        },
        dog: {
            init: function( model ) {
                model.mesh.scale.multiplyScalar( 0.04 );
                model.mesh.position.y = -1;
            },
            focus: function( model ) {}
        },
        building: {
            init: function( model ) {
                model.mesh.scale.multiplyScalar( 0.8 );
                // model.mesh.scale.y = -3
            },
            onfocus: function( model ) {}
        }
    }

    U3.createModelFromFile( "models/dog_idle.js", {
        init: function() {
            preset.dog.init(this)
            this.mesh.morphTargetInfluences[ 0 ] = 1
        },
        onfocus: function(){
            preset.dog.focus(this)
            preset.rig.pitch(1)
            preset.rig.theta(-2)
        }
    });
    U3.createModelFromFile( "models/dog_idle.js", {
        init: function() {
            preset.dog.init(this)
            this.animation = new THREE.MorphAnimation( this.mesh )
            this.animation.loop = false;
            this.animation.duration = 800;
        },
        onfocus: function(){
            preset.dog.focus(this)
            this.animation.play();
        },
        onblur: function(){
            this.animation.stop();
        }
    });
    U3.createModelFromFile( "models/dog_walk.js", {
        init: function() {
            preset.dog.init(this);
            this.animation = new THREE.MorphAnimation( this.mesh )
            this.mesh.position.y -= 0.75;
        },
        onfocus: function(){
            preset.dog.focus(this)
            this.animation.play();
        },
        onblur: function(){
            this.animation.pause();
        }
    });
    U3.createModelFromFile( "models/dog_run.js", {
        init: function() {
            preset.dog.init(this);
            this.animation = new THREE.MorphAnimation( this.mesh )
            this.mesh.position.y -= 0.75;
        },
        onfocus: function(){
            preset.dog.focus(this)
            this.animation.play();
        },
        onblur: function(){
            this.animation.pause();
        }
    });

    // Architecture
    U3.createModelFromFile( "models/arch_0.js", {
        init: function() {
            preset.building.init(this);
        },
        onfocus: function(){
            U3.rig.target_pitch = 1.2;
            U3.rig.target_theta = -0.785;
        }
    });
    U3.createModelFromFile( "models/arch_1.js", {
        init: function() {
            preset.building.init(this);
            this.mesh.position.y -= 0.125;
        },
        onfocus: function(){
            U3.rig.target_pitch = 1.4;
            U3.rig.target_theta = 0.785;
        }
    });
    U3.createModelFromFile( "models/arch_2.js", {
        init: function() {
            preset.building.init(this);
            this.mesh.position.y -= 0.25;
        },
        onfocus: function(){
            U3.rig.target_pitch = 1.7;
            U3.rig.target_theta = 0.785 + 0.3;
        }
    });
    U3.createModelFromFile( "models/arch_3.js", {
        init: function() {
            preset.building.init(this);
            this.mesh.position.y -= 0.5;
            this.mesh.position.x -= 1;
        },
        onfocus: function(){
            U3.rig.target_pitch = 2;
            U3.rig.target_theta = -0.785;
        }
    });
    U3.createModelFromFile( "models/arch_4.js", {
        init: function() {
            preset.building.init(this);
            this.mesh.position.y -= 1.25;
        },
        onfocus: function(){
            U3.rig.target_pitch = 1.5;
            U3.rig.target_theta = -1.8;
        }
    });

    // Man
    U3.createModelFromFile( "models/man_idle.js", {
        init: function() {
            preset.man.init(this)
            this.mesh.morphTargetInfluences[ 0 ] = 1
        },
        onfocus: function(){
            preset.man.focus()
            preset.rig.pitch(1)
            preset.rig.theta(1)
        }
    });
    U3.createModelFromFile( "models/man_idle.js", {
        init: function() {
            preset.man.init(this)
            this.animation = new THREE.MorphAnimation( this.mesh )
            this.animation.loop = false;
            this.animation.duration = 800;
        },
        onfocus: function(){
            preset.man.focus()
            this.animation.play();
        },
        onblur: function(){
            this.animation.stop();
        }
    });
    U3.createModelFromFile( "models/man_walk.js", {
        init: function() {
            preset.man.init(this);
            this.animation = new THREE.MorphAnimation( this.mesh )
        },
        onfocus: function(){
            preset.man.focus()
            this.animation.play();
        },
        onblur: function(){
            this.animation.pause();
        }
    });
    U3.createModelFromFile( "models/man_run.js", {
        init: function() {
            preset.man.init(this);
            this.animation = new THREE.MorphAnimation( this.mesh )
            this.animation.duration = 1500;
        },
        onfocus: function(){
            preset.man.focus()
            this.animation.play();
        },
        onblur: function(){
            this.animation.pause();
        }
    });
    U3.createModelFromFile( "models/man_crazy.js", {
        init: function() {
            preset.man.init(this);
            this.animation = new THREE.MorphAnimation( this.mesh );
            this.animation.duration = 1200;
            this.mesh.position.y += 0.6;
        },
        onfocus: function(){
            preset.man.focus()
            this.animation.play();
        },
        onblur: function(){
            this.animation.pause();
        }
    });

    // var old_arr = Object.create( U3.models_array );
    // var new_order = [  0,  4,  8 ,
    //                    1,  5,  9 ,
    //                    2,  6, 10 ,
    //                    3,  7, 11 ]
    // U3.models_array = [];
    // new_order.forEach(function(value){
    //     U3.models_array.push( old_arr[ value ] )
    // })


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
    var display = function() {

        U3.update();

        MODULES.runEnabledModulesInList(URNDR.STROKE_MODULE , STROKES );
        MODULES.runEnabledModulesInList(URNDR.DRAW_MODULE , {
            strokes:STROKES, 
            canvasManager: cavMan
        } );

        STROKES.rebuildQuadTree();
        
        requestAnimationFrame( display );

    }
    display();

}