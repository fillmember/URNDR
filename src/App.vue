<template>
  <div id="app" class="outer-wrapper">
    <section class="canvas-container">
      <canvas id="three" ref="canvas_three" :width="width" :height="height" />
      <canvas id="urndr" ref="canvas_urndr" :width="width" :height="height" />
      <canvas id="hud" ref="canvas_hud" :width="width" :height="height" />
    </section>
    <section id="control" class="sidebar right">
      <urndr-slider
        label="b"
        :value.sync="style.brush_size"
        :min="style.brush_size_range[0]"
        :max="style.brush_size_range[1]"
        :step="1"
      />
    </section>
  </div>
</template>

<script>
import THREE from './urndr/three.js'
import {
  BaseModule, ThreeManager, ModuleManager,
  CanvasManager, StrokeStyle, Strokes,
  Point, Hud, Pen, PenTool, Module, UIManager
} from './urndr/urndr'
import {
  PanTool,DrawTool,EraseTool,ModifyTool
} from './urndr/presets/pentools'
import {
  SetRandomColorScheme
} from './urndr/presets/commands'
import {
  RandomStrokeColor, ColorVariation
} from './urndr/presets/styles'
import {
  RandomPointPosition,PointPressureSensitivity
} from './urndr/presets/pointfx'
import {
  StrokeFade,StrokeWiggle,DeleteFlaggedStroke,
  SmoothStroke,Stroke3DMapping
} from './urndr/presets/strokefx'
import {
  LegacyRenderer
} from './urndr/renderers/CanvasRenderModules'

import Slider from './Slider.vue'

export default {
  name: 'app',
  components: {
    'urndr-slider' : Slider
  },
  data () {
    const d = {
      width : 500,
      height : 500,
      threeManager  : null,
      modules       : new ModuleManager(),
      style         : new StrokeStyle(),
      canvasManager : new CanvasManager(),
      strokes       : new Strokes(),
      pen           : new Pen({}),
      // Refs
      animationFrame : null
    }
    d.pen.strokes = d.strokes
    return d
  },
  methods : {
    onResize (event) {
      this.setSize(this.width,this.height)
    },
    setSize (width,height) {
      this.threeManager.renderer.setSize(width, height)
      this.threeManager.camera.aspect = width / height
      this.threeManager.camera.updateProjectionMatrix()
      this.strokes.bound.width = width
      this.strokes.bound.height = height
    },
    onEnterframe () {
      this.threeManager.update();
      this.modules.runModules(BaseModule.STROKE_MODULE, this.strokes);
      this.modules.runModules(BaseModule.DRAW_MODULE, {
        strokes: this.strokes,
        canvasManager: this.canvasManager
      })
      this.animationFrame = requestAnimationFrame(this.onEnterframe)
    }
  },
  mounted () {
    //
    this.canvasManager.add(this.$refs.canvas_urndr, "draw", "2d")
    this.canvasManager.add(this.$refs.canvas_hud, "hud", "2d")
    this.canvasManager.lineCap = this.style.cap;
    this.canvasManager.lineJoin = this.style.join;
    //
    this.threeManager = new ThreeManager({
      fog: new THREE.FogExp2(0xFFFFFF,0.33),
      canvas: this.$refs.canvas_three,
      material: new THREE.MeshBasicMaterial({
        color: 0xCCCCCC,
        wireframe: true,
        wireframeLinewidth: 0.5,
        morphTargets: true
      })
    })
    const _threeManager = this.threeManager
    this.threeManager.speed = 16.6666;
    this.threeManager.renderer.setClearColor(0xFFFFFF);
    this.threeManager.createModelFromFile("models/p.js", {
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
    this.threeManager.createModelFromFile("models/man_run.js", {
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
    this.threeManager.createModelFromFile("models/dog_run.js", {
      init: function() {
        this.animation = new THREE.MorphAnimation(this.mesh)
        this.mesh.scale.multiplyScalar(0.04);
        this.mesh.position.y = -1.7;
        this.focusPoint = 0;
      },
      onfocus: function() {
        this.animation.play();
        _threeManager.rig.focus.y = 0;
      },
      onblur: function() { this.animation.pause(); }
    });
    this.threeManager.createModelFromFile("models/twister.js", {
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
        _threeManager.rig.focus.y = 0;
      },
      onblur: function() { this.animation.pause(); }
    });
    this.threeManager.solo(0)

    const _urndrRefs = {
      threeManager  : this.threeManager,
      modules       : this.modules,
      style         : this.style,
      canvasManager : this.canvasManager,
      strokes       : this.strokes,
      pen           : this.pen
    }
    this.modules.add( SetRandomColorScheme(_urndrRefs) )
    this.modules.add( RandomStrokeColor().setActive(false) )
    this.modules.add( ColorVariation(_urndrRefs) )
    this.modules.add( RandomPointPosition(_urndrRefs).setActive(false) )
    this.modules.add( PointPressureSensitivity(_urndrRefs))
    this.modules.add( DeleteFlaggedStroke(_urndrRefs) )
    this.modules.add( SmoothStroke(_urndrRefs).setActive(false) )
    this.modules.add( StrokeFade(_urndrRefs) )
    this.modules.add( StrokeWiggle(_urndrRefs).setActive(false) )
    this.modules.add( LegacyRenderer(_urndrRefs) )
    this.modules.add( Stroke3DMapping(_urndrRefs) )
    //
    this.setSize(this.width,this.height)
    //
    this.pen.canvas = this.$refs.canvas_urndr
    this.pen.canvas_hud = this.$refs.canvas_hud
    this.pen.bindEvents()
    this.pen.add(new DrawTool(_urndrRefs))
    this.pen.add(new EraseTool(_urndrRefs))
    this.pen.add(new ModifyTool(_urndrRefs))
    this.pen.add(new PanTool(_urndrRefs))
    this.pen.select(0)
    //
    this.animationFrame = requestAnimationFrame(this.onEnterframe)
    //
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy () {
    //
    cancelAnimationFrame(this.animationFrame)
    //
    window.removeEventListener('resize', this.onResize)
  }
}
</script>

<style lang="stylus">
  @import './stylus/Variables'
  @import './stylus/Base'
  .outer-wrapper
    display flex
    flex-flow row nowrap
    width 100vw
    height 100vh

  .canvas-container
    width 80%
    height 100%
    min-height 500px
    min-width 500px

    background-color gray
    display flex
    align-items center
    justify-content center
    div
      height 500px
      width 500px
      position relative
    canvas
      position absolute
      top 0
      left 0

  .sidebar
    font-weight 700
    padding 0 .1rem
    width 20%
</style>
