import MathUtil from './math/math'

export default class PenTool {
    constructor (parameters) {
        this.id = "T-" + MathUtil.uuid();
        this.name = parameters.name || "Untitled Tool";
        this.onmousedown = parameters.onmousedown || function(){};
        this.onmouseup = parameters.onmouseup || function(){};
        this.onmousemove = parameters.onmousemove || function(){};
        this.onmouseout = parameters.onmouseout || function(){};
        this.engage = parameters.engage || function(){};
        this.disengage = parameters.disengage || function(){};
        this.size = parameters.size || 5;
        this.data = parameters.data || {};
	}
}
