URNDR.Pen = function() {
    this.x = 0
    this.y = 0
    this.ndc_x = 0
    this.ndc_y = 0
    this.pressure = 0
    this.isDown = 0
    this.drawingMode = 1
}
URNDR.Pen.prototype.getMousePos = function (canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    var obj = {};
        obj.x = evt.clientX - rect.left;
        obj.y = evt.clientY - rect.top;
        obj.ndc_x = THREE.Math.mapLinear( obj.x , 0 , window.innerWidth , -1 , 1 )
        obj.ndc_y = THREE.Math.mapLinear( obj.y , 0 , window.innerHeight , 1 , -1 )
    return obj;
}