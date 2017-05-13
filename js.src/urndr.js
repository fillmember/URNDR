import THREE from './three.js'

import UIManager from './urndr/ui/UIManager'
export {UIManager}

import UIMessage from './urndr/ui/UIMessage'
export {UIMessage}

import CanvasManager from './urndr/CanvasManager.js'
export {CanvasManager}

import Rectangle from './urndr/math/Rectangle.js'
export {Rectangle}

import QuadTree from './urndr/math/QuadTree.js'
export {QuadTree}

import BaseModule from './urndr/BaseModule.js'
export {BaseModule}

import ModuleManager from './urndr/ModuleManager'
export {ModuleManager}

import Strokes from './urndr/Strokes'
export {Strokes}

import Stroke from './urndr/Stroke'
export {Stroke}

import Point from './urndr/Point'
export {Point}

import Pen from './urndr/Pen'
export {Pen}

import PenTool from './urndr/PenTool.js'
export {PenTool}

import Hud from './urndr/Hud.js'
export {Hud}

import StrokeStyle from './urndr/StrokeStyle.js'
export {StrokeStyle}

import Model from './urndr/Model.js'
export {Model}

import ThreeManager from './urndr/ThreeManager.js'
export {ThreeManager}

import _Math from 'urndr/math/math.js';
export {_Math}

import Helpers from 'urndr/helpers/helper.js';
export {Helpers}

import THREEHelper from 'urndr/helpers/THREEHelper.js'
export {THREEHelper}

//
// Extends THREE for URNDR
//

THREE.Object3D.prototype.getMorphedVertex = function( vertex_index ) {

    return THREEHelper.getMorphedVertex(this,vertex_index)

}
THREE.Camera.prototype.checkVisibility = function( obj, face ) {

    return THREEHelper.checkVisibility(this,obj,face)

}

THREE.MorphAnimation.prototype.stop = function() {

    return THREEHelper.stopMorphAnimation(this)

}

export default URNDR
