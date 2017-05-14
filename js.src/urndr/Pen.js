import PenTool from './PenTool'
import MathUtil from './math/math'

export default class Pen {

    constructor({canvas_draw, canvas_hud, strokes}) {

        // spatial data
        this.x = 0
        this.y = 0
        this.pressure = 1

        // state data
        this.isDown = 0
        this.currentTool = 0

        // tool data
        this.tools = []
        this.canvas = canvas_draw
        this.canvas_hud = canvas_hud
        this.strokes = strokes // strokeManager to draw to

        // event
        canvas_hud.addEventListener("mousedown", (evt) => this.onmousedown(this, evt) )
        canvas_hud.addEventListener("mouseup"  , (evt) => this.onmouseup(this, evt) )
        canvas_hud.addEventListener("mousemove", (evt) => this.onmousemove(this, evt) )
        canvas_hud.addEventListener("mouseout" , (evt) => this.onmouseout(this, evt) )
    }

    get ndc_x() {
        return MathUtil.map( this.x , 0 , this.canvas.width , -1 , 1 );
    }
    get ndc_y() {
        return MathUtil.map( this.y , 0 , this.canvas.height , 1 , -1 );
    }
    get ndc() {
        return [ this.ndc_x, this.ndc_y ];
    }
    set ndc( input ) {
        var o = MathUtil.coordinateToPixel( input[0], input[1] , this.canvas.width , this.canvas.height )
        this.x = o.x; this.y = o.y;
    }
    select (index) {
        this.currentTool = this.tools[index]
    }
    add (tool) {
        this.tools.push(tool)
    }

    onmousedown ( pen, evt ) {
        pen.isDown = 1;
        if (pen.currentTool instanceof PenTool) {
            this.strokes.rebuildQuadTree();
            pen.currentTool.onmousedown( pen, evt );
        }
    }
    onmouseup ( pen, evt ) {
        pen.isDown = 0;
        if (pen.currentTool instanceof PenTool) {
            pen.currentTool.onmouseup( pen, evt );
        }
    }
    onmousemove ( pen, evt ) {

        // update quad tree
        this.strokes.rebuildQuadTree();

        // update data
        var rect = this.canvas.getBoundingClientRect();
        this.x = evt.clientX - rect.left;
        this.y = evt.clientY - rect.top;

        // call tool
        if (this.currentTool instanceof PenTool) {
            this.currentTool.onmousemove( this, evt );
        }

    }
    onmouseout ( pen, evt ) {
        pen.isDown = 0;
        pen.currentTool.onmouseout( pen, evt );
    }
    //
    //
    //
    createUI (ui) {

        ui.build.startSection({title:`pen`})

        ui.build.startSection({title:`pentool select`,class:`btnGroup`})
        const buttons = this.tools.map( (tool) => {
            const btn = ui.build.button({
                icon : tool.icon,
                title : tool.name,
                click : () => {
                    this.currentTool = tool
                    buttons.forEach((_b)=>{_b.classList.remove('active')})
                    tool._activateButton.classList.add('active')
                }
            })
            tool._activateButton = btn
            return btn
        })

        ui.build.endSection()

        this.tools.forEach((pen)=>{
            pen.createUI(ui)
        })

        ui.build.endSection()

    }
}
