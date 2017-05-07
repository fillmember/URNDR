export default class CanvasManager {

    constructor () {

        this.list = {};

    }

    get width () {
        return this.get(0).element.width;
    }
    get height () {
        return this.get(0).element.height;
    }
    add ( domElement , name , context ) {
        this.list[name] = {};
        this.list[name].element = domElement;
        this.list[name].context = domElement.getContext( context );
    }
    get ( v ) {
        if (this.list.hasOwnProperty(v)) {
            return this.list[ v ];
        } else if (typeof v === "number") {
            return this.list[ Object.keys( this.list )[ v ] ]
        } else {
            return 0;
        }
    }
    each ( func ) {
        for ( var n in this.list ) {
            func( this.list[n] )
        }
    }
    resize ( w , h ) {
        if ( w == undefined ) {w = this.width;}
        if ( h == undefined ) {h = this.width;}
        this.each( function(item) {
            var _cap = item.context.lineCap,
                _join = item.context.lineJoin;
            item.element.width = w;
            item.element.height = h;
            item.context.lineCap = _cap;
            item.context.lineJoin = _join;
        } )
    }
    clear ( a ){
        var w = this.width;
        var h = this.height;
        this.each( function( canvas ){
            _func( canvas.context )
        } );
        function _func( ctx ) {
            if (a === 1) {
                ctx.clearRect(0,0,w,h)
            } else {
                ctx.save();
                ctx.globalAlpha = a;
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillRect(0,0,w,h);
                ctx.restore();
            }
        }
    }
    set lineCap (v) {
        this.each( function( item ) {
            item.context.lineCap = v;
        } )
    }
    set lineJoin (v) {
        this.each( function( item ) {
            item.context.lineJoin = v;
        } )
    }

}
