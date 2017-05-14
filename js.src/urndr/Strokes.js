import QuadTree from './math/QuadTree'
import Rectangle from './math/Rectangle'
import Stroke from './Stroke'

export default class Strokes {
    constructor (options = {}){

        this.list = []

        // Active Stroke is selector, ref by ID. When 0, means don't continue any existing stroke.
        this.activeStroke = 0;

        this.bound = new Rectangle(0,0,
            (options.width ? options.width : window.innerWidth),
            (options.height ? options.height : window.innerHeight)
        );

        // Options
        this.deleteOutOfRangeStroke = false

    }

    get count() {
        return this.list.length;
    }
    reset () {

        this.list = [];
        this.activeStroke = 0;

        this.quadTree.clear();

    }
    rebuildQuadTree () {

        this.quadTree = new QuadTree( 1, new Rectangle( 0, 0, this.bound.width, this.bound.height ) )
        this.eachStroke( (stk) => {this.addToQuadTree(stk)})

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

        return this.activeStroke

    }
    // Make one stroke active by storing its ID into activeStroke,
    selectStroke(stk) {

        this.activeStroke = stk

    }
    getLatestStroke () {

        return this.list[ this.list.length - 1 ]

    }
    beginNewStroke () {

        this.activeStroke = this.addStroke()

    }
    addStroke (stk) {

        stk = stk ? stk : new Stroke()
        stk.parent = this
        this.list.push(stk)
        return stk

    }
    eachStroke ( my_function , parameters ) {
        const len = this.list.length
        for( var i = 0; i < len; i++ ){
            my_function( this.list[i] , parameters , i )
        }
    }
    createUI (ui) {

        ui.watch(ui.build.display({
            title : 'count',
            target : this,
            property : 'count'
        }))

    }
}
