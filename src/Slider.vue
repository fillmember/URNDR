<template>
	<div class="slider-container">
		<label for="test"></label>
		<input type="range" id="test"
			v-model="myValue"
			:min="min"
			:max="max"
			:step="step"
			v-on:input="sliderUpdate"
		/>
		<output for="test">{{myValue}}</output>
	</div>
</template>

<script>
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
    	myValue : this.value
    }
  },
  methods : {
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
