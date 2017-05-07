import $ from 'jquery'
window.$ = $

import THREE from './three.js'
window.THREE = THREE

import URNDR from './urndr.js'
window.URNDR = URNDR;

require('./GIFEncoder/LZWEncoder.min.js')
require('./GIFEncoder/NeuQuant.min.js')
require('./GIFEncoder/GIFEncoder.min.js')

require('./toy.js')

require('./modules_toy.js')

