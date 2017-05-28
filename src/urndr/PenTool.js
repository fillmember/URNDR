import MathUtil from './math/math'

export default class PenTool {
    constructor (parameters) {
        this.id = "T-" + MathUtil.uuid();
        this.name = parameters.name || "Untitled Tool";
        this.icon = parameters.icon || undefined;
        this.onmousedown = parameters.onmousedown || function(){};
        this.onmouseup = parameters.onmouseup || function(){};
        this.onmousemove = parameters.onmousemove || function(){};
        this.onmouseout = parameters.onmouseout || function(){};
        this.engage = parameters.engage || function(){};
        this.disengage = parameters.disengage || function(){};
        this.data = parameters.data || {};
	}

    createUI (ui) {

        ui.build.startSection({title:`pentool detail`})

        ui.build.endSection()

    }
}
