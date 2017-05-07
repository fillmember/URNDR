export default class StrokeStyle {

    constructor () {
        this.cap = "round";
        this.join = "round";
        this.composit = "source-over";
        this.brush_size = 40;
        this.color = [0,0,255,1];
    }

    gradientMaker (ctx,p1,p2,factor) {
        const grad = ctx.createLinearGradient( p1.X , p1.Y , p2.X , p2.Y );
        grad.addColorStop(0,'rgba('+p1.R+','+p1.G+','+p1.B+','+p1.A * factor+')')
        grad.addColorStop(1,'rgba('+p2.R+','+p2.G+','+p2.B+','+p2.A * factor+')')
        return grad
    }

}
