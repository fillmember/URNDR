import THREE from './three.js'

const URNDR = {}

import UIMessage from './urndr/ui/UIMessage'
export {UIMessage}

import CanvasManager from './urndr/CanvasManager.js'
export {CanvasManager}
URNDR.CanvasManager = CanvasManager

import Rectangle from './urndr/math/Rectangle.js'
export {Rectangle}
URNDR.Rectangle = Rectangle

import QuadTree from './urndr/math/QuadTree.js'
export {QuadTree}
URNDR.QuadTree = QuadTree

import BaseModule from './urndr/BaseModule.js'
export {BaseModule}
URNDR.Module = BaseModule

import ModuleManager from './urndr/ModuleManager'
export {ModuleManager}
URNDR.ModuleManager = ModuleManager

import Strokes from './urndr/Strokes'
export {Strokes}
URNDR.Strokes = Strokes

import Stroke from './urndr/Stroke'
export {Stroke}
URNDR.Stroke = Stroke

import Point from './urndr/Point'
export {Point}
URNDR.Point = Point

import Pen from './urndr/Pen'
export {Pen}
URNDR.Pen = Pen

import PenTool from './urndr/PenTool.js'
export {PenTool}
URNDR.PenTool = PenTool

import Hud from './urndr/Hud.js'
export {Hud}
URNDR.Hud = Hud

import StrokeStyle from './urndr/StrokeStyle.js'
export {StrokeStyle}
URNDR.StrokeStyle = StrokeStyle

import Model from './urndr/Model.js'
export {Model}
URNDR.Model = Model

import ThreeManager from './urndr/ThreeManager.js'
export {ThreeManager}
URNDR.ThreeManager = ThreeManager

import _Math from 'urndr/math/math.js';
export {_Math}
URNDR.Math = _Math;

import Helpers from 'urndr/helpers/helper.js';
export {Helpers}
URNDR.Helpers = Helpers;

import THREEHelper from 'urndr/helpers/THREEHelper.js'
export {THREEHelper}

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
