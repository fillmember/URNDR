import MathUtil from './math/math'
import Point from './Point'

export default class Stroke {

    constructor (tags) {

        this.id = "S-"+MathUtil.uuid();
        this.tags = tags || {}; // for future stroke-specific effect.
        this.points = []; // must be sequential. From 0 to this.length.
        this.parent = undefined;

        this.closed = false;     // for draw modules to implement close function

        this.center = undefined; // for future transform function.
        this.start = 0           // for future "drawing" effect.
        this.end = 1
        this.link = ""         // for future "following" effect.

        this.hovered = false;
        this.selected = false;

        this._flag_to_delete = false;
    }

    get length() {
        return this.points.length;
    }
    get flag_to_delete() {

        if (this.length < 1) { return false; }
        if (this._flag_to_delete === true) { return true; }

        // sum up A and check
        var sum_A = 0;
        this.eachPoint(function(pnt) {sum_A+=pnt.A;})
        if (sum_A < 0.05) {
            return true;
        }

        // check out of range stroke
        if (this.parent.deleteOutOfRangeStroke) {

            var flag_invisible = true;
            this.eachPoint(function(pnt) {
                if (flag_invisible) {
                    var ndc = pnt.ndc
                    if (ndc.x > -1 && ndc.x < 1 && ndc.y > -1 && ndc.y < 1) {
                        flag_invisible = false;
                    }
                }
            })
            if (flag_invisible) { return true; }

        }

        // Pass all test...
        return false;

    }
    deleteStroke () { this._flag_to_delete = true; }
    addPoint ( arg ) {

        if ( arg instanceof Point ) {
            // already a Point object, just push it
            arg.parent = this;
            this.points.push( arg );
        } else {
            arg = arg != undefined ? arg : { parent: this };
            // copy the values to a newly created point.
            this.points.push( new Point( arg ) )
        }

    }
    getPoint ( i ) {

        if ( i >= 0 && i < this.length ) {
            return this.points[ i ]
        } else {

            if (i < 0) {
                return this.getPoint( this.length - i )
            }

            if (i > this.length) {
                return this.getPoint( i - this.length )
            }

            return 0
        }

    }
    getTrack ( track_name ) {

        var len = this.length,
            result = [];

        for ( var i = 0; i < len; i++ ) { result.push( this.getPoint(i)[ track_name ] ) }
        return result;

    }
    setTrack ( track_name , arr ) {

        var len = this.length

        if (len !== arr.length) { return 0 }

        for ( var i = 0; i < len; i++ ) { this.getPoint(i)[ track_name ] = arr[i]; }

    }
    removePoint ( point_n ) {

        if ( point_n >= 0 && point_n < this.length ) {

            this.points.splice( point_n , 1)

        }

    }
    simplify ( t ) {

        /*

         (c) 2013, Vladimir Agafonkin
         Simplify.js, a high-performance JS polyline simplification library
         mourner.github.io/simplify-js

        */

        // square distance between 2 points
        function getSqDist(p1, p2) {

            var dx = p1.X - p2.X,
                dy = p1.Y - p2.Y;

            return dx * dx + dy * dy;
        }

        // square distance from a point to a segment
        function getSqSegDist(p, p1, p2) {

            var x = p1.X,
                y = p1.Y,
                dx = p2.X - x,
                dy = p2.Y - y;

            if (dx !== 0 || dy !== 0) {

                var t = ((p.X - x) * dx + (p.Y - y) * dy) / (dx * dx + dy * dy);

                if (t > 1) {
                    x = p2.X;
                    y = p2.Y;

                } else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }

            dx = p.X - x;
            dy = p.Y - y;

            return dx * dx + dy * dy;
        }
        // rest of the code doesn't care about point format

        // basic distance-based simplification
        function simplifyRadialDist(points, sqTolerance) {

            var prevPoint = points[0],
                newPoints = [prevPoint],
                point;

            for (var i = 1, len = points.length; i < len; i++) {
                point = points[i];

                if (getSqDist(point, prevPoint) > sqTolerance) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }

            if (prevPoint !== point) newPoints.push(point);

            return newPoints;
        }

        // simplification using optimized Douglas-Peucker algorithm with recursion elimination
        function simplifyDouglasPeucker(points, sqTolerance) {

            var len = points.length,
                MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array,
                markers = new MarkerArray(len),
                first = 0,
                last = len - 1,
                stack = [],
                newPoints = [],
                i, maxSqDist, sqDist, index;

            markers[first] = markers[last] = 1;

            while (last) {

                maxSqDist = 0;

                for (i = first + 1; i < last; i++) {
                    sqDist = getSqSegDist(points[i], points[first], points[last]);

                    if (sqDist > maxSqDist) {
                        index = i;
                        maxSqDist = sqDist;
                    }
                }

                if (maxSqDist > sqTolerance) {
                    markers[index] = 1;
                    stack.push(first, index, index, last);
                }

                last = stack.pop();
                first = stack.pop();
            }

            for (i = 0; i < len; i++) {
                if (markers[i]) newPoints.push(points[i]);
            }

            return newPoints;
        }

        // both algorithms combined for awesome performance
        function simplify(points, tolerance, highestQuality) {

            if (points.length <= 1) return points;

            var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

            points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
            points = simplifyDouglasPeucker(points, sqTolerance);

            return points;
        }

        t = t === undefined || t < 0 ? 0.7 : t;

        this.points = simplify( this.points , t , true );

    }
    simplify_more ( n ) {

        n = n < 0 || n === undefined ? 30 : n

        this.optimize( n )

    }
    optimize ( a ) {

        // Check if is a closed path.

        if (this.length > 3) {

            var pnt = this.points[ this.length - 1 ],
                pnt0 = this.points[ 0 ];

            if ( pnt.distanceToSquared(pnt0) < 360 ) { this.closed = true; }

        }

        // Simplify

        this.simplify();

        // Calculate Center

        this.center = this.calculateCenterOfPoints();

    }
    calculateCenterOfPoints () {

        var result = {x:0,y:0},
            divider = 1 / this.length;

        this.eachPoint( function( pnt, parameters, i) {

            result.x += pnt.X;
            result.y += pnt.Y;

        }, null )

        result.x *= divider;
        result.y *= divider;

        return result;

    }
    setTag ( tag , tag_data ) {

        this.tags[tag] = tag_data;

    }
    getTag ( tag ) {

        if (this.tags.hasOwnProperty(tag)) {
            return this.tags[tag];
        } else {
            return undefined;
        }

    }
    eachPoint ( my_function , parameters ) {
        var arr = this.points.slice(0)
        for (var j = 0, len = this.length; j < len; j++ ) {
            my_function( arr[ j ] , parameters , j )
        }
    }
    getNearestPointWith ( track_name , n ) {

        if (this.length < 2) { return 0; }
        if (this.getPoint(n).hasOwnProperty( track_name ) === false ) { return 0; }

        var track = this.getTrack( track_name ),
            before_me, after_me, result;

        before_me = after_me = false;

        result = {
            before: 0,
            before_distance: Infinity,
            after: 0,
            after_distance: Infinity
        }

        for (var b = n; b >= 0; b--) {
            if ( track[b] != null ) {
                before_me = b;
                break;
            }
        }

        for (var a = n, len = track.length; a < len; a++) {
            if ( track[a] != null ) {
                after_me = a;
                break;
            }
        }

        if (before_me !== false) {
            result.before = this.getPoint( before_me )
            result.before_distance = n - before_me
        }
        if (after_me !== false) {
            result.after = this.getPoint( after_me );
            result.after_distance = after_me - n;
        }

        if (result.before_distance < result.after_distance) {
            result.nearest = result.before
            result.nearest_distance = result.before_distance
        } else {
            result.nearest = result.after
            result.nearest_distance = result.after_distance
        }

        return result

    }
}
