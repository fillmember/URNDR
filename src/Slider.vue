<template>
	<div class="slider-container">
		<label :for="uuid" ref="label">{{label}}</label>
		<input type="range" :id="uuid"
			v-model="myValue"
			:min="min"
			:max="max"
			:step="step"
			v-on:input="sliderUpdate"
			v-on:mousedown="onMouseDown"
			v-on:mouseup="onMouseUp"
		/>
		<output :for="uuid" ref="output">{{myValue}}</output>
	</div>
</template>

<script>
import { _Math } from './urndr/urndr'
import { TweenLite } from 'gsap'
export default {
  name: 'slider',
  props: {
  	'label' : String,
  	'value' : Number,
  	'min' : Number,
  	'max' : Number,
  	'step' : Number
  },
  data () {
    return {
    	isMouseDown : false,
    	uuid : `${this.label}-${_Math.uuid()}`,
    	myValue : this.value
    }
  },
  methods : {
    toggleLabel (bool,t=0.1) {
      TweenLite.to( this.$refs.label , 0.1, {
        autoAlpha : bool ? 1 : 0,
        x         : bool ? 0 : -5,
        scale     : bool ? 1 : 0.8,
        ease      : Power2.easeInOut
      })
      TweenLite.to( this.$refs.output , 0.1, {
        autoAlpha : bool ? 0 : 1,
        x         : bool ? -5 : 0,
        scale     : bool ? 0.8 : 1,
        ease      : Power2.easeInOut
      })
    },
  	onMouseDown () {
  		this.isMouseDown = true
      this.toggleLabel(false)
  	},
  	onMouseUp () {
  		this.isMouseDown = false
      this.toggleLabel(true)
  	},
  	sliderUpdate () {
  		this.$emit('update:value',parseFloat(this.myValue))
  	}
  },
  mounted () {
    this.toggleLabel(true)
  },
  beforeDestroy () {}
}
</script>

<style lang="stylus">
@import './stylus/Variables'

slider-height = 10px
s-knob-h = 14px
s-knob-w = 14px
s-offset-y = 0px
s-border-width = 2px
input[type=range]
  border-radius slider-height * 0.5
input[type=range]::-webkit-slider-runnable-track
input[type=range]::-webkit-slider-thumb
  appearance none
  border-radius slider-height * 0.5
  background #FFF
  border s-border-width solid main-color
  position relative
input[type=range]::-webkit-slider-runnable-track
  top s-offset-y
  height slider-height
input[type=range]::-webkit-slider-thumb
  height s-knob-h
  width s-knob-w
  top (slider-height - s-knob-h) * 0.5 - s-border-width
</style>
