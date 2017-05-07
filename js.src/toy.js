"use strict";

import {
    ThreeManager,
    ModuleManager,
    CanvasManager,
    StrokeStyle,
    Strokes,
    Point,
    Hud,
    Pen,
    PenTool,
    Module
} from 'urndr'

const $tu = $("#tutorial")
const $cn = $(".canvas_container canvas")
window.toggleTutorial = function ( state ) {
    switch (state) {
        case 0:
            $tu.fadeOut();
            $cn.fadeIn();
            break;
        case 1:
            $tu.fadeIn();
            $cn.fadeOut();
            break;
        default:
            var v = $tu.is(":visible");
            toggleTutorial( v ? 0 : 1 )
    }
}

const U3 = new URNDR.ThreeManager({
    fog: new THREE.FogExp2(0xFFFFFF,0.33),
    canvas: document.getElementById('canvas_three'),
    material: new THREE.MeshBasicMaterial({
        color: 0xCCCCCC,
        wireframe: true,
        wireframeLinewidth: 0.5,
        morphTargets: true
    })
})
U3.renderer.setClearColor("#FFFFFF");
window.U3 = U3

const HUD = new URNDR.Hud(document.getElementById('HUD'));
window.HUD = HUD

const MODULES = new URNDR.ModuleManager();
window.MODULES = MODULES
const STYLE = new URNDR.StrokeStyle();
window.STYLE = STYLE

const cavMan = new URNDR.CanvasManager();
cavMan.add(document.getElementById('canvas_urndr'), "draw", "2d")
cavMan.add(document.getElementById('canvas_hud'), "hud", "2d")
console.log( cavMan.get('draw').context.scale(1,1) )
cavMan.lineCap = STYLE.cap;
cavMan.lineJoin = STYLE.join;
window.cavMan = cavMan

const STROKES = new URNDR.Strokes(cavMan.get("draw").element);
window.STROKES = STROKES

const PEN = new URNDR.Pen({
    canvas_draw : cavMan.get("draw").element,
    canvas_hud : cavMan.get("hud").element,
    strokes : STROKES
});
window.PEN = PEN

import {
    PanTool,
    DrawTool,
    EraseTool,
    ModifyTool
} from 'urndr/presets/pentools.js'
PEN.addTool(new DrawTool({
    strokes : STROKES,
    modules : MODULES,
    threeManager : U3,
    style : STYLE
}), true)
PEN.addTool(new EraseTool({
    strokes : STROKES,
    modules : MODULES,
    threeManager : U3,
    style : STYLE
}));
PEN.addTool(new ModifyTool({
    strokes : STROKES,
    modules : MODULES,
    threeManager : U3,
    style : STYLE
}));
PEN.addTool(new PanTool({
    strokes : STROKES,
    modules : MODULES,
    threeManager : U3,
    style : STYLE
}))

window.onload = function() {

    // Canvas Setup
    // notify the renderer of the size change
    U3.renderer.setSize(500, 500);
    // update the camera
    U3.speed = 16.6666;
    U3.camera.aspect = 1;
    U3.camera.updateProjectionMatrix();
    cavMan.resize(500, 500);

    // Load Model
    U3.createModelFromFile("models/p.js", {
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
    U3.createModelFromFile("models/man_run.js", {
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
    U3.createModelFromFile("models/dog_run.js", {
        init: function() {
            this.animation = new THREE.MorphAnimation(this.mesh)
            this.mesh.scale.multiplyScalar(0.04);
            this.mesh.position.y = -1.7;
            this.focusPoint = 0;
        },
        onfocus: function() {
            this.animation.play();
            U3.rig.focus.y = 0;
        },
        onblur: function() { this.animation.pause(); }
    });
    U3.createModelFromFile("models/twister.js", {
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
            U3.rig.focus.y = 0;
        },
        onblur: function() { this.animation.pause(); }
    });
    U3.createModelFromFile("models/pika.js", {
        init: function() {
            this.animation = new THREE.MorphAnimation(this.mesh)
            this.animation.duration = 1500;
            this.mesh.scale.multiplyScalar( 2 );
            this.mesh.position.y = -2;
            this.mesh.rotation.y = -1.7 / 2;
        },
        onfocus: function() {
            this.animation.play();
            U3.rig.focus.y = 0;
        },
        onblur: function() { this.animation.pause(); }
    });
    U3.solo(0)

    //
    // EVENTS
    //

    document.addEventListener("keydown", (event) => {
        var response = MODULES.trigger(event);
        if (response === 0) {
            // HUD.display( event.charCode || event.keyCode )
        } else {
            var name = response.module.name;
            if (name.length > 15) {
                name = name.replace(/[aeiou]/g, '')
            }
            HUD.display(name, response.message);
        }
    });

    // requestAnimationFrame
    const display = () => {
        U3.update();
        MODULES.runEnabledModulesInList(URNDR.Module.STROKE_MODULE, STROKES);
        MODULES.runEnabledModulesInList(URNDR.Module.DRAW_MODULE, {
            strokes: STROKES,
            canvasManager: cavMan
        })
        requestAnimationFrame(display);
    }
    display();
}
