<template>
	<div class="slider-container"
	>
		<label :for="htmlFor">{{label}}</label>
		<input type="range" :id="htmlFor"
			v-model="myValue"
			:min="min"
			:max="max"
			:step="step"
			v-on:input="sliderUpdate"
			v-on:mousedown="onMouseDown"
			v-on:mouseup="onMouseUp"
		/>
		<output :for="htmlFor">{{myValue}}</output>
	</div>
</template>

<script>
import { _Math } from './urndr/urndr'
export default {
  name: 'app',
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
    	htmlFor : _Math.uuid(),
    	myValue : this.value
    }
  },
  methods : {
  	onMouseDown () {
  		this.isMouseDown = true
  	},
  	onMouseUp () {
  		this.isMouseDown = false
  	},
  	sliderUpdate () {
  		this.$emit('update:value',parseFloat(this.myValue))
  	}
  },
  mounted () {},
  beforeDestroy () {}
}
</script>

<style lang="stylus">

</style>
