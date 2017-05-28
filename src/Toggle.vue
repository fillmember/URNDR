<template>
	<div class="toggle-container">
    <input type="checkbox" v-model="myValue" :id="uuid" v-on:change="toggleUpdate" />
    <label :for="uuid">{{label}}</label>
	</div>
</template>

<script>
import { _Math } from './urndr/urndr'
export default {
  name: 'toggle',
  props: {
  	'label' : String,
    'value' : Boolean
  },
  data () {
    return {
      uuid : `${this.label}-${_Math.uuid()}`,
      myValue : this.value
    }
  },
  methods : {
    toggleUpdate () {
      this.$emit('update:value',this.myValue)
    }
  },
  mounted () {},
  beforeDestroy () {}
}
</script>

<style lang="stylus">
@import './stylus/Variables'

toggle-w = 18px
toggle-h = 9px
t-border-width = 2px
t-space = 26px
t-offset-y = 0
input[type=checkbox]
  display none
input[type=checkbox] + label
  margin-left t-space
  position relative
  &:before
  &:after
    display block
    position absolute
    content '\A'
    top t-offset-y
    left -1 * t-space
    transition transform transition-duration, background-color transition-duration
  &:before
    border-radius toggle-h * 0.5
    width toggle-w
    height toggle-h
    border t-border-width solid main-color
  &:after
    border-radius toggle-h * 0.5
    top t-offset-y
    width toggle-h
    height toggle-h
    background #FFF
    border 2px solid main-color
input[type=checkbox]:checked + label
  &:before
    background active-color
  &:after
    transform translateX(toggle-w - toggle-h)
</style>
