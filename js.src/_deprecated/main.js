"use strict";

//
// APIs & Libraries
//

var WACOM = document.getElementById('Wacom').penAPI || {pressure:3};
var U3 = new URNDR.ThreeManager( {
    canvas: document.getElementById('canvas_three'),
    material: new THREE.MeshBasicMaterial( {
        color: 0xFFFFFF,
        // wireframe: true,
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
        var astk = this.strokes.activeStroke
        if (astk) {
            astk.optimize();
        }
    },
    onmousemove: function(pen, evt){

        if (pen.isDown !== 1) { return; }

        this.modules.runEnabledModulesInList(URNDR.Module.STYLE_MODULE, STYLE )

        var pnt = new URNDR.Point({
            X : pen.x,
            Y : pen.y,
            S : STYLE.brush_size,
            R : STYLE.color[0], G : STYLE.color[1], B : STYLE.color[2],
            A : STYLE.color[3]
        });

        // WRITE POINT INTO STROKE
        var stk = this.strokes.activeStroke;
        if (stk !== 0) { stk.addPoint( pnt ) }

        // Run modules that changes the pnt.
        this.modules.runEnabledModulesInList( URNDR.Module.POINT_MODULE , pnt )

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
            this.strokes.activeStroke = nearest.stroke.id;
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

var midi = null;  // global MIDIAccess object

var OP_ONE = function(msg){
    var msg = msg.data;
    var pitch_bend = msg[0] === 224 ? true : false;
    if (pitch_bend) { return; }
    var ident = msg[1];
    var value = msg[2];
    if (ident == undefined || value == undefined) { return }
    var control = msg[0] === 176 ? true : false;
    var encoder = ident < 5 ? true : false;
    if (encoder && control) {
        value = value === 127 ? -1 : 1;
    } else if (control) {
        value = value === 127 ? 1 : 0;
    }
    // The control part
    if (value === 0) {return;}
    if (control) {
        switch (ident) {
            // ENCODERS
            case 1:
                U3.rig.target_theta += -value * 0.1;
                return;
            case 2:
                U3.rig.target_pitch += value * 0.1;
                return;
            case 3:
                U3.rig.target_radius += value * 0.1;
                return;
            case 4:
                var n = U3.speed + value * 2.5;
                U3.speed = THREE.Math.clamp( n , 0 , 1000)
                return;
            // Speech Bubble
            case 5:
                var mod = MODULES.getModuleByName( "VANILLA DRAW" );
                mod.settings.fillmember = ! mod.settings.fillmember;
                return;
            // Record , Play , Stop buttons
            case 38:
                PEN.selectToolByName("Draw");
                return;
            case 39:
                PEN.selectToolByName("Stroke Selector");
                return;
            case 40:
                PEN.selectToolByName("Eraser");
                return;
            // Metronome & Mixer
            case 6:
                MODULES.getModuleByName( "Previous Model" ).func({});
                return;
            case 10:
                MODULES.getModuleByName( "Next Model" ).func({});
                return;
            // Drop / Take tape
            case 17:
                var mod = MODULES.getModuleByName( "Pressure Sensitivity" );
                mod.enabled = !mod.enabled;
                return;
            case 16:
                MODULES.getModuleByName( "Increase Brush Size" ).func({});
                return;
            case 15:
                MODULES.getModuleByName( "Reduce Brush Size" ).func({});
                return;
            //
            case 21:
                var mod = MODULES.getModuleByName( "Random Stroke Color" );
                mod.enabled = !mod.enabled;
                return;
            // Dot Dot Dot
            case 23:
                var mod = MODULES.getModuleByName( "Fade Strokes" );
                mod.enabled = !mod.enabled;
                return;
            // M1 M2
            case 24:
                MODULES.getModuleByName( "Color Change" ).func({shiftKey: true});
                return;
            case 25:
                MODULES.getModuleByName( "B&W" ).func({});
                return;
            case 48:
                MODULES.getModuleByName( "Clear Canvas" ).func({})
                return;
            case 49:
                MODULES.getModuleByName( "Toggle UI" ).func({})
                return;
            case 64:
                var mod = MODULES.getModuleByName( "auto move" );
                mod.enabled = !mod.enabled;
                return;
            case 65:
                var mod = MODULES.getModuleByName( "auto move" );
                mod.receive({shiftKey: true})
                return;
            case 67:
                U3.speed = 15;
                return;
        }
    }
    // Model switcher : OCTAVE 0
    if (! control && value > 99 ) {
        var n = ident - 53;
        n = n % U3.count;
        U3.solo( n )
        return;
    }
    console.log( control ? "CTRL" : "NOTE", ident , value )
}

function onMIDISuccess( midiAccess ) {
  midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
  console.log("MIDI engaged")

  var inputs = midi.inputs.values();
  for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
    if (input.value.name === "OP-1 Midi Device") {
        input.value.onmidimessage = OP_ONE;
        console.log("OP-1 found")
    }
  }
}
function onMIDIFailure(msg) {
    console.log( "Failed to get MIDI access - " + msg );
}
navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );


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
                // U3.rig.target_pitch = x * 0.1;
            },
            theta: function(x) {
                // X : 1 per 10 degree.
                // 10 degress = 1/36 * 2 * Math.PI() in radian = 0.1744444
                // U3.rig.target_theta = x * 0.17444444;
            },
            add: function(property, x) {
                // U3.rig["target_" + property] += preset.rig[property]( x );
            }
        },
        man: {
            init: function( model ) {
                model.mesh.scale.multiplyScalar( 0.03 );
                model.mesh.position.y = -3.6;
            }
        },
        dog: {
            init: function( model ) {
                model.mesh.scale.multiplyScalar( 0.04 );
                model.mesh.position.y = -1;
            }
        },
        building: {
            init: function( model ) {
                model.mesh.scale.multiplyScalar( 0.8 );
                // model.mesh.scale.y = -3
            }
        }
    }

    // Dog
        U3.createModelFromFile( "models/dog_idle.js", {
            init: function() {
                preset.dog.init(this)
                this.mesh.morphTargetInfluences[ 0 ] = 1
            },
            onfocus: function(){
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
                this.animation.play();
            },
            onblur: function(){
                this.animation.pause();
            }
        });

    // // Man
    U3.createModelFromFile( "models/man_idle.js", {
        init: function() {
            preset.man.init(this)
            this.mesh.morphTargetInfluences[ 0 ] = 1
        },
        onfocus: function(){
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
            this.animation.play();
        },
        onblur: function(){
            this.animation.pause();
        }
    });

    // Pokemons
        U3.createModelFromFile( "models/pika.js", {
            init: function() {
                this.animation = new THREE.MorphAnimation( this.mesh );
                this.animation.duration = 1000;
                this.mesh.scale.multiplyScalar( 2 );
                this.mesh.position.y = -2;
            },
            onfocus: function(){
                this.animation.play();
            },
            onblur: function(){
                this.animation.pause();
            }
        });
        U3.createModelFromFile( "models/charmander.js", {
            init: function() {
                this.animation = new THREE.MorphAnimation( this.mesh );
                this.animation.duration = 4000;
                this.mesh.scale.multiplyScalar( 1.5 );
                this.mesh.position.y = -1.5;
            },
            onfocus: function(){
                this.animation.play();
            },
            onblur: function(){
                this.animation.pause();
            }
        });
        U3.createModelFromFile( "models/squirtle.js", {
            init: function() {
                this.animation = new THREE.MorphAnimation( this.mesh );
                this.animation.duration = 1000;
                this.mesh.scale.multiplyScalar( 1 );
                this.mesh.position.y = -2;
            },
            onfocus: function(){
                this.animation.play();
            },
            onblur: function(){
                this.animation.pause();
            }
        });

    // // Architecture
        U3.createModelFromFile( "models/arch_0.js", {
            init: function() {
                preset.building.init(this);
            }
        });
        U3.createModelFromFile( "models/arch_1.js", {
            init: function() {
                preset.building.init(this);
                this.mesh.position.y -= 0.125;
            }
        });
        U3.createModelFromFile( "models/arch_2.js", {
            init: function() {
                preset.building.init(this);
                this.mesh.position.y -= 0.25;
            }
        });
        U3.createModelFromFile( "models/arch_3.js", {
            init: function() {
                preset.building.init(this);
                this.mesh.position.y -= 0.5;
                this.mesh.position.x -= 1;
            }
        });
        U3.createModelFromFile( "models/arch_4.js", {
            init: function() {
                preset.building.init(this);
                this.mesh.position.y -= 1.25;
            }
        });

    U3.solo(0)

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

        MODULES.runEnabledModulesInList(URNDR.Module.STROKE_MODULE , STROKES );
        MODULES.runEnabledModulesInList(URNDR.Module.DRAW_MODULE , {
            strokes:STROKES,
            canvasManager: cavMan
        } );

        requestAnimationFrame( display );

    }
    display();

}
