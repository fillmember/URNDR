import THREE from './three.js'

export {UIManager} from './ui/UIManager'

import UIMessage from './ui/UIMessage'
export {UIMessage}

import CanvasManager from './CanvasManager.js'
export {CanvasManager}

import Rectangle from './math/Rectangle.js'
export {Rectangle}

import QuadTree from './math/QuadTree.js'
export {QuadTree}

import BaseModule from './BaseModule.js'
export {BaseModule}

import ModuleManager from './ModuleManager'
export {ModuleManager}

import Strokes from './Strokes'
export {Strokes}

import Stroke from './Stroke'
export {Stroke}

import Point from './Point'
export {Point}

import Pen from './Pen'
export {Pen}

import PenTool from './PenTool.js'
export {PenTool}

import Hud from './Hud.js'
export {Hud}

import StrokeStyle from './StrokeStyle.js'
export {StrokeStyle}

import Model from './Model.js'
export {Model}

import ThreeManager from './ThreeManager.js'
export {ThreeManager}

import _Math from './math/math.js';
export {_Math}

import Helpers from './helpers/helper.js';
export {Helpers}

import THREEHelper from './helpers/THREEHelper.js'
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
