import QuadTree from './math/QuadTree'
import Rectangle from './math/Rectangle'
import Stroke from './Stroke'

export default class Strokes {
    constructor ( _canvas ){

        // Data
        this.strokes = {}; // Store actual Stroke Objects. Key = Stroke ID.
        this.strokesHistory = []; // Store stroke ID. Record order of creation.
        this.strokesZDepth = []; // Store stroke ID. The later, the closer to screen.
        this.age = 0;

        // Active Stroke is selector, ref by ID. When 0, means don't continue any existing stroke.
        this.active_stroke = 0;
        this.canvas = _canvas;

        // Options
        this.deleteOutOfRangeStroke = false

    }

    get strokeCount() {
        return this.strokesHistory.length;
    }
    reset () {

        this.strokes = {};
        this.strokesHistory = [];
        this.strokesZDepth = [];

        this.active_stroke = 0;

        this.quadTree.clear();

    }
    rebuildQuadTree () {

        // Create QuadTree
        var _qtw = this.canvas.canvasWidth || window.innerWidth,
            _qth = this.canvas.canvasHeight || window.innerWidth;

        this.quadTree = new QuadTree( 1, new Rectangle( 0, 0, _qtw, _qth ) )

        this.eachStroke( function(stk,strokes){

            strokes.addToQuadTree( stk )

        }, this)

    }
    addToQuadTree ( obj ) {

        var hit_size, half_hit,
            qt = this.quadTree;

        if (obj instanceof Stroke) {

            obj.eachPoint( function(pnt,stk,i){

                qt.insert( new Rectangle(
                    pnt.X, pnt.Y, 1, 1,
                    { stroke: stk, pointIndex: i, point: pnt }
                ) );

            }, obj );

        }

    }
    getFromQuadTree ( x , y , w , h ) {

        if (!x || !y) { return 0; }

        const _w = w || 2;
        const _h = h || 2;
        const _x = x - _w * 0.5;
        const _y = y - _h * 0.5;

        var rect = new Rectangle( _x , _y , _w , _h );

        // return: array contains Point objects
        var rects = this.quadTree.retrieve( [], rect )
        var result = [];
        for (var r = 0, max = rects.length; r < max; r ++) {
            result.push( rects[r] )
        }

        return result;

    }
    getActiveStroke () {

        if (this.active_stroke !== 0) {
            return this.getStrokeByID( this.active_stroke );
        } else {
            return 0;
        }

    }
    // Make one stroke active by storing its ID into active_stroke,
    selectStrokeByID ( id ) {

        if ( this.strokes.hasOwnProperty(id) ) {
            this.active_stroke = id
        } else {
            return false;
        }

    }
    getLatestStroke () {

        return this.getStrokeByID( this.strokesHistory[ this.strokesHistory.length - 1 ] );

    }
    beginNewStroke () {

        this.selectStrokeByID( this.addStroke() );

    }
    addStroke () {

        // Check argument first
        var alen = arguments.length;
        if (alen === 0) {

            // Create an empty stroke for user.
            return this.addStroke( new Stroke() )

        } else if (alen > 1) {

            // Several Strokes.
            for ( var j = 0; j < alen; j++) {

                this.addStroke( arguments[j] )

            }

        } else if (alen === 1) {

            var stk = arguments[0]

            if (stk instanceof Stroke ) {

                stk.parent = this;

                this.strokes[stk.id] = stk;
                this.strokesHistory.push( stk.id );
                this.strokesZDepth.push( stk.id );

                return stk.id; // return the id so people can identify it.

            }

        }

    }
    // NOTE: To iterate through strokes when drawing & manipulating... just use strokes map or strokesArray. ,
    getStrokeByID ( id ) {

        if (this.strokes.hasOwnProperty(id)) {
            return this.strokes[id]
        } else {
            return 0;
        }

    }
    deleteStrokeByID ( id ) {

        if (this.strokes.hasOwnProperty(id)) {

            var in_history = this.strokesHistory.indexOf(id)
            var in_z_depth = this.strokesZDepth.indexOf(id)

            // NOTE: if everything works right. They should also be present in these arrays...
            if (in_history >= 0) { this.strokesHistory.splice( in_history , 1) }
            if (in_z_depth >= 0) { this.strokesZDepth.splice( in_z_depth , 1) }
            // auto check consistency, something might be wrong :(
            if (in_history === -1 || in_z_depth === -1) { this.checkConsistency(id) }

            delete this.strokes[id]

        }

    }
    checkConsistency (id) {

        console.log("PART I : Start to check consistency in the data. ")

        if (id) {

            console.log("Check stroke by ID...")

            if ( this.strokes.hasOwnProperty(id) ) {

                var in_history = this.strokesHistory.indexOf(id);
                var in_z_depth = this.strokesZDepth.indexOf(id);

                console.log("Index in History Array: "+in_history,"Index in Z-Depth Array: "+in_z_depth);
                console.log("Something wrong? ",in_history === in_z_depth ? "NO :)" : "YES :(");

            } else {

                console.log("no such stroke present. ");

            }

        }

        console.log("PART II : Check Data Length");

        var slen, hlen, zlen;
        slen = Object.keys(strokes).length;
        hlen = this.strokesHistory.length;
        zlen = this.strokesZDepth.length;

        if ( slen === hlen === zlen) {
            console.log("")
        } else {
            console.log("Warning to developer : there's inconsistency between strokes and other two arrays! (slen,hlen,zlen) = (",slen,hlen,zlen,")");
        }

    }
    eachStroke ( my_function , parameters ) {
        var len = this.strokeCount;
        var arr = this.strokesHistory.slice(0)
        for( var i = 0; i < len; i++ ){
            my_function( this.getStrokeByID( arr[ i ] ) , parameters , i );
        }
    }
}
