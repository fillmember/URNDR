import PenTool from './PenTool'

export default class Pen {

    constructor({canvas_draw, canvas_hud, strokes}) {

        // spatial data
        this.x = 0
        this.y = 0
        this.pressure = 1

        // state data
        this.isDown = 0
        this.active_tool = 0

        // tool data
        this.tools = {}
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
        return THREE.Math.mapLinear( this.x , 0 , this.canvas.width , -1 , 1 );
    }
    get ndc_y() {
        return THREE.Math.mapLinear( this.y , 0 , this.canvas.height , 1 , -1 );
    }
    get ndc() {
        return [ this.ndc_x, this.ndc_y ];
    }
    set ndc( input ) {
        var o = URNDR.Math.coordinateToPixel( input[0], input[1] , this.canvas.width , this.canvas.height )
        this.x = o.x; this.y = o.y;
    }
    selectToolByID ( id ) {

        if (this.tools.hasOwnProperty(id)) {

            if (this.active_tool instanceof PenTool) {
                this.active_tool.disengage();
            }

            this.active_tool = this.tools[id]
            this.active_tool.engage();

        }

    }
    selectToolByName ( name ) {

        for ( var l in this.tools ) {
            if ( this.tools[l].name === name ) {

                if (this.active_tool instanceof PenTool) {
                    this.active_tool.disengage();
                }

                this.active_tool = this.tools[l]
                this.active_tool.engage();
                return true;

            }
        }

        return false;

    }
    addTool ( tool , activate ) {

        this.tools[tool.id] = tool
        if (activate) { this.selectToolByID( tool.id ) }

    }

    onmousedown ( pen, evt ) {
        pen.isDown = 1;
        if (pen.active_tool instanceof PenTool) {
            this.strokes.rebuildQuadTree();
            pen.active_tool.onmousedown( pen, evt );
        }
    }
    onmouseup ( pen, evt ) {
        pen.isDown = 0;
        if (pen.active_tool instanceof PenTool) {
            pen.active_tool.onmouseup( pen, evt );
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
        if (this.active_tool instanceof PenTool) {
            this.active_tool.onmousemove( this, evt );
        }

    }
    onmouseout ( pen, evt ) {
        pen.isDown = 0;
        pen.active_tool.onmouseout( pen, evt );
    }
}
