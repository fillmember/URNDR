export default class StrokeStyle {

    constructor () {
        this.cap = "round";
        this.join = "round";
        this.composit = "source-over";
        this.brush_size = 40;
        this.brush_size_range = [5,200];
        this.color = [0,0,255,1];
    }

    createUI (ui) {

        ui.build.startSection()

        ui.build.slider({
            target : this,
            property : 'brush_size',
            min : this.brush_size_range[0],
            max : this.brush_size_range[1]
        })

        ui.build.colorPicker({
            target : this,
            property : 'color'
        })

        ui.build.endSection()

    }

}
