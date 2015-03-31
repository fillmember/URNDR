var URNDR = {revision:'2'};

URNDR.COMMAND_MODULE = "COMMAND_MODULES"
URNDR.STYLE_MODULE = "STYLE_MODULES"
URNDR.POINT_MODULE = "POINT_MODULES"
URNDR.STROKE_MODULE = "STROKE_MODULES"
URNDR.DRAW_MODULE = "DRAW_MODULES"

// QuadTree
// source: http://gamedevelopment.tutsplus.com/tutorials/quick-tip-use-quadtrees-to-detect-likely-collisions-in-2d-space--gamedev-374

URNDR.QuadTree = function( pLevel , pBounds) {
    
    // Statics
    this.MAX_OBJECTS = 20
    this.MAX_LEVELS = 5

    // Attributes
    this.level = pLevel
    this.objects = []
    this.bounds = pBounds
    this.nodes = [null,null,null,null]

}
URNDR.QuadTree.prototype = {
    clear : function() {
        
        this.objects = []
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i] !== null) {
                this.nodes[i].clear()
                this.nodes[i] = null
            }
        }

    },
    split : function() {

        var subWidth,subHeight,x,y
            subWidth = this.bounds.width / 2
            subHeight = this.bounds.height / 2
            x = this.bounds.x
            y = this.bounds.y

        this.nodes[0] = new URNDR.QuadTree(this.level+1, new URNDR.Rectangle(x + subWidth, y, subWidth, subHeight) )
        this.nodes[1] = new URNDR.QuadTree(this.level+1, new URNDR.Rectangle(x, y, subWidth, subHeight) )
        this.nodes[2] = new URNDR.QuadTree(this.level+1, new URNDR.Rectangle(x, y + subHeight, subWidth, subHeight) )
        this.nodes[3] = new URNDR.QuadTree(this.level+1, new URNDR.Rectangle(x + subWidth, y + subHeight, subWidth, subHeight) )

    },
    getIndex : function(rect){

        var index,verticalMidPoint,horizontalMidPoint,topQuadrant,bottomQuadrant
            index = -1
            verticalMidPoint = this.bounds.x + this.bounds.width / 2
            horizontalMidPoint = this.bounds.y + this.bounds.height / 2
            // object can completely fit within the top quadrants
            topQuadrant = rect.y < horizontalMidPoint && rect.y + rect.height < horizontalMidPoint
            // object can completely fit within the bottom quadrants
            bottomQuadrant = rect.y > horizontalMidPoint

        // object can completely fit within the left quadrant
        if (rect.x < verticalMidPoint && rect.x + rect.width < verticalMidPoint) {
        
            if (topQuadrant) {
                index = 1
            } else if (bottomQuadrant) {
                index = 2
            }
        
        }
        // object can completely fit within the left quadrant
        else if (rect.x > verticalMidPoint) {
        
            if (topQuadrant) {
                index = 0
            } else if (bottomQuadrant) {
                index = 3
            }
        
        }

        return index

    },
    insert : function(rect) {

        if (this.nodes[0]) {

            var index = this.getIndex(rect)

            if (index !== -1) {

                return this.nodes[index].insert(rect)

            }

        }

        this.objects.push(rect)

        if (this.objects.length > this.MAX_OBJECTS && this.level < this.MAX_LEVELS) {

            if (!this.nodes[0]) {

                this.split()

            }

            var i = 0

            while (i < this.objects.length) {
                
                var index = this.getIndex(this.objects[i])
                
                if (index !== -1) {
                    this.nodes[index].insert( this.objects.splice(i,1)[0] )
                } else {
                    i++
                }

            }

        }

    },
    retrieve : function( arr , rect ) {

        var index = this.getIndex(rect)
        if (index !== -1 && this.nodes[0]) {
            arr = arr.concat( this.nodes[index].retrieve( arr , rect ) )
        }

        arr = arr.concat( this.objects )

        return arr

    }
}

URNDR.Rectangle = function(x,y,w,h,ref) {
    this.x = x
    this.y = y
    this.width = w
    this.height = h
    //
    this.reference = ref || undefined
}

// MODULE

URNDR.Module = function(n,t,k,e) {
    this.id = "MOD"+THREE.Math.generateUUID()
    this.priority = 1
    this.type = t
    this.name = n
    this.enabled = false
    //
    if ( typeof k === "boolean" && e === undefined ) {
        // no keycode data is sent
        this.enabled = k
    } else {
        if (typeof k === "number") { this.keyCode = k }
        if (typeof e === "boolean" && t !== URNDR.COMMAND_MODULE) { this.enabled = e }
    }
}
URNDR.Module.prototype.setFunction = function ( f ) { this.func = f }
URNDR.Module.prototype.getFunction = function () { return this.func }
URNDR.Module.prototype.setConfiguration = function ( s ) {
    this.configuration = s
    this.initialConfiguration = Object.create( this.configuration )
}
URNDR.Module.prototype.getConfiguration = function () { return this.configuration }

// MODULE MANAGER

URNDR.ModuleManager = function() {
    this.modules = {};
    this[ URNDR.COMMAND_MODULE ] = {};
    this[ URNDR.STYLE_MODULE ] = {};
    this[ URNDR.POINT_MODULE ] = {};
    this[ URNDR.STROKE_MODULE ] = {};
    this[ URNDR.DRAW_MODULE ] = {};
    this.key_map = {};
    // functions
    this.KEY_PREFIX = "key";
    this.setKeyMap = function( keyCode , id ) {

        this.key_map[ this.KEY_PREFIX + keyCode ] = { id: id }

    }
    this.getModuleIDbyKey = function( keyCode ) {

        var result = this.key_map[ this.KEY_PREFIX + keyCode ];
        return (result? result : false)

    }
    this.loadModule = function ( module ) {

        if (typeof module === "function") {

            // run the function to get the actual module
            module = module()

        }

        // put in general modules list
        this.modules[ module.id ] = module

        if (this.hasOwnProperty( module.type )) {
            this[ module.type ][ module.id ] = this.modules[ module.id ]
        }

        if (typeof module.keyCode === "number") {
            this.setKeyMap( module.keyCode , module.id )
        }

    }
    this.loadModules = function ( list ) {
    
        for ( var l in list ) { this.loadModule( list[l] ); }
    
    }

    this.getModule = function(id){

        return this.modules[id]

    }

    this.toggleModuleByKey = function (keyCode) {

        var mod_ref = this.getModuleIDbyKey(keyCode);
        
        if ( ! mod_ref ) { return 0; }
        
        var module = this.getModule(mod_ref.id);

        switch( module.type ) {

            case URNDR.COMMAND_MODULE:
                return { type: URNDR.COMMAND_MODULE , name: module.name , func: module.getFunction() }
                break;
            
            case URNDR.DRAW_MODULE:
                this.soloModule( module );
                return { name: module.name , enabled : module.enabled }
                break;
            
            default:
                module.enabled = ! module.enabled;
                return { name: module.name , enabled : module.enabled }
                break;

        }

    }
    this.soloModule = function( mod ) {

        var list = this[mod.type];
        for( var m in list ) { list[m].enabled = (list[m].id === mod.id) ? true : false }

    }
    this.runEnabledModulesInList = function (list_name, params) {

        var list = this[list_name],
            enabled_count = 0;

        for ( var m in list ) {
            if (list[m].enabled) {
                list[m].func(params);
                enabled_count ++;
            }
        }

        return enabled_count;

    }
    this.getEnabledModulesCount = function( list_name ) {

        var list = this[list_name], enabled_count = 0;
        for (m in list) { if (list[m].enabled) { enabled_count ++; } }

        return enabled_count;

    }
    this.resetModules = function( list_name ) {}
};

// Strokes

URNDR.Strokes = function(){
    
    // Data
    this.strokes = {}; // Store actual Stroke Objects. Key = Stroke ID.
    this.strokesHistory = []; // Store stroke ID. Record order of creation.
    this.strokesZDepth = []; // Store stroke ID. The later, the closer to screen.
    // Active Stroke is selector, ref by ID. When 0, means don't continue any existing stroke. 
    this.active_stroke = 0;
    // QuadTree
    var _qtw = arguments[0].canvasWidth || window.innerWidth
    var _qth = arguments[0].canvasHeight || window.innerWidth
    this.quadTree = new URNDR.QuadTree( 1, new URNDR.Rectangle( 0, 0, _qtw, _qth ) )

}
// functions
URNDR.Strokes.prototype.reset = function() {

    this.strokes = {};
    this.strokesHistory = [];
    this.strokesZDepth = [];
    
    this.active_stroke = 0;

    this.quadTree.clear();

}
URNDR.Strokes.prototype.rebuildQuadTree = function() {

    var qt = this.quadTree;
    var active_id = this.getActiveStroke().id

    qt.clear();

    this.eachStroke( function(stk,strokes){

        strokes.addToQuadTree( stk )
    
    }, this)

}
URNDR.Strokes.prototype.addToQuadTree = function( obj ) {

    var hit_size, half_hit,
        qt = this.quadTree;

    if (obj instanceof URNDR.Stroke) {

        obj.eachPoint( function(pnt,stk,i){

            hit_size = pnt.S,
            half_hit = - hit_size * 0.5;
            
            qt.insert( new URNDR.Rectangle(
                pnt.X + half_hit, // X
                pnt.Y + half_hit, // Y
                hit_size, // W
                hit_size, // H
                // Reference
                { strokeID: stk.id, stroke: stk, pointIndex: i, point: pnt }
            ) );

        }, obj );

    }

}
URNDR.Strokes.prototype.getFromQuadTree = function( x , y , w , h ) {

    if (!x || !y) { return 0; }

    _w = w || 2;
    _h = h || 2;
    _x = x - _w * 0.5;
    _y = y - _h * 0.5;

    var rect = new URNDR.Rectangle( _x , _y , _w , _h );

    // return: array contains Point objects
    var rects = this.quadTree.retrieve( [], rect )
    var result = [];
    for (var r in rects) {
        result.push( rects[r] )
    }

    return result;

}
URNDR.Strokes.prototype.getActiveStroke = function() {

    if (this.active_stroke !== 0) {
        return this.getStrokeByID( this.active_stroke );
    } else {
        return 0;
    }

}
// Make one stroke active by storing its ID into active_stroke
URNDR.Strokes.prototype.selectStrokeByID = function ( id ) {

    if ( this.strokes.hasOwnProperty(id) ) {
        this.active_stroke = id
    } else {
        return false;
    }

}
URNDR.Strokes.prototype.getLastStrokeInHistory = function() {

    return this.getStrokeByID( this.strokesHistory[ this.strokesHistory.length - 1 ] );

}
URNDR.Strokes.prototype.beginNewStroke = function (  ) {

    this.selectStrokeByID( this.addStroke() );

}
URNDR.Strokes.prototype.addStroke = function (  ) {

    // Check argument first
    var alen = arguments.length;
    if (alen === 0) {

        // Create an empty stroke for user.
        return this.addStroke( new URNDR.Stroke() )

    } else if (alen > 1) {

        // Several Strokes. 
        for ( var j = 0; j < alen; j++) {

            this.addStroke( arguments[j] )

        }

    } else if (alen === 1) {

        var this_stroke = arguments[0]

        if (this_stroke instanceof URNDR.Stroke ) {
            
            this.strokes[this_stroke.id] = this_stroke;
            this.strokesHistory.push( this_stroke.id )
            this.strokesZDepth.push( this_stroke.id )

            return this_stroke.id; // return the id so people can identify it. 

        } else {
            
            console.log("addStroke only accept Stroke objects. ")

            return false;

        }

    }

}
// NOTE: To iterate through strokes when drawing & manipulating... just use strokes map or strokesArray. 
URNDR.Strokes.prototype.getStrokeByID = function ( id ) {

    if (this.strokes.hasOwnProperty(id)) {
        return this.strokes[id]
    } else {
        return 0;
    }

}
URNDR.Strokes.prototype.deleteStrokeByID = function ( id ) {
    
    if (this.strokes.hasOwnProperty(id)) {

        var in_history = this.strokesHistory.indexOf(id)
        var in_z_depth = this.strokesZDepth.indexOf(id)

        // NOTE: if everything works right. They should also be present in these arrays...
        if (in_history >= 0) { this.strokesHistory.splice( in_history , 1) }
        if (in_z_depth >= 0) { this.strokesZDepth.splice( in_z_depth , 1) }
        if (in_history === -1 || in_z_depth === -1) { this.checkConsistency(id) } // auto check consistency, something might be wrong :(

        delete this.strokes[id]

    } else {

        console.log("Warning : Stroke not found. Did nothing. ")

    }

}
URNDR.Strokes.prototype.getStrokesCount = function () {

    return this.strokesHistory.length;

}
URNDR.Strokes.prototype.checkConsistency = function (id) {

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
        console.log("Tips : Don't control strokes without Strokes object's interface. ");
    }

}
URNDR.Strokes.prototype.eachStroke = function( my_function , parameters ) {
    var len = this.getStrokesCount();
    for( var i = 0; i < len; i++ ){
        my_function( this.getStrokeByID( this.strokesHistory[ i ] ) , parameters , i );
    }
}

// SUB CLASSES
URNDR.Stroke = function(tags) {

    this.id = "S-"+THREE.Math.generateUUID();
    this.tags = tags || {}; // for future stroke-specific effect.
    this.points = []; // must be sequential. From 0 to this.length.

    this.closed = false;     // for draw modules to implement close function

    this.center = undefined; // for future transform function.
    this.start = 0           // for future "drawing" effect.
    this.end = 1
    this.parent              // for future "following" effect.
}
URNDR.Stroke.prototype.getLength = function() {

    return this.points.length;

}
URNDR.Stroke.prototype.addPoint = function( point ) {

    if ( point instanceof URNDR.Point ) {
        // already a Point object, just push it
        this.points.push( point );
    } else {
        // copy the values to a newly created point.
        this.points.push( new URNDR.Point( point ) )

    }

}
URNDR.Stroke.prototype.getPoint = function( point_n ) {

    if ( point_n >= 0 && point_n < this.getLength() ) {
        return this.points[ point_n ]
    } else {
        return 0
    }

}
URNDR.Stroke.prototype.getTrack = function( track_name ) {

    var len, result
    len = this.getLength();
    result = [];

    if (len === 0) {
        return result;
    }

    if ( this.getPoint(0).hasOwnProperty( track_name ) === false ) {
        return 0
    }

    for ( var i = 0; i < len; i++ ) {

        result.push( this.getPoint(i)[ track_name ] )

    }
    return result;

}
URNDR.Stroke.prototype.setTrack = function( track_name , arr ) {

    var len = this.getLength()

    if (len !== arr.length) {
        return 0
    }

    for ( var i = 0; i < len; i++ ) {

        this.getPoint(i)[ track_name ] = arr[i]

    }

}
URNDR.Stroke.prototype.searchPoint = function( rect ) {}

URNDR.Stroke.prototype.removePoint = function( point_n ) {

    if ( point_n >= 0 && point_n < this.getLength() ) {
        this.points.splice( point_n , 1)
    } else {
        console.log("Warning: can't find the targeted point to remove. Index:",point_n,"/"+this.getLength() )
    }

}
URNDR.Stroke.prototype.simplify = function() {

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

    this.points = simplify( this.points , 0.75 , true );

}
URNDR.Stroke.prototype.optimize = function() {

    this.simplify();
    this.center = this.calculateCenterOfPoints();

}
URNDR.Stroke.prototype.calculateCenterOfPoints = function() {

    var result = {x:0,y:0},
        divider = 1 / this.getLength();

    this.eachPoint( function( pnt, parameters, i) {

        result.x += pnt.X;
        result.y += pnt.Y;

    }, null )

    result.x *= divider;
    result.y *= divider;

    return result;

}
URNDR.Stroke.prototype.setTag = function( tag , tag_data ) {

    this.tags[tag] = tag_data;

}
URNDR.Stroke.prototype.checkTag = function( tag ) {
    if (this.tags.hasOwnProperty(tag)) {
        return true;
    } else {
        return false;
    }
}
URNDR.Stroke.prototype.getTag = function( tag ) {

    if (this.tags.hasOwnProperty(tag)) {
        return this.tags[tag];
    } else {
        return undefined;
    }

}
URNDR.Stroke.prototype.eachPoint = function( my_function , parameters ) {
    var len = this.getLength()
    for (var j = 0; j < len; j++ ) {
        my_function( this.getPoint( j ) , parameters , j )
    }
}
URNDR.Stroke.prototype.getNearestPointWith = function( track_name , n ) {

    if (this.getLength() < 2) { return 0; }
    if (this.getPoint(0).hasOwnProperty( track_name ) === false ) { return 0; }

    var track = this.getTrack( track_name );
    var track_leng = track.length;
    var before_me, b, after_me, a;
    before_me = undefined;
    after_me = undefined;
    var result = {
        before: 0, after: 0, nearest: 0, 
        before_distance: 0, after_distance: 0, nearest_distance: 0, 
    }
    for (b = n - 1; b >= 0; b--) {
        if (track[b] !== null && track[b] !== undefined) {
            before_me = b;
            break;
        }
    }
    for (a = n; a < track_leng; a++) {
        if (track[a] !== null && track[a] !== undefined) {
            after_me = a;
            break;
        }
    }
    if (after_me === undefined) {
        if (before_me === undefined) {
            return 0;
        } else {
            result.before = this.getPoint( before_me )
            result.before_distance = n - before_me
            result.nearest = result.before
            result.nearest_distance = result.before_distance
        }
    } else {
        if (before_me === undefined) {
            result.after = this.getPoint( after_me )
            result.after_distance = after_me - n
            result.nearest = result.after
            result.nearest_distance = result.after_distance
        } else {
            result.before = this.getPoint( before_me )
            result.before_distance = n - before_me
            result.after = this.getPoint( after_me )
            result.after_distance = after_me - n
            if (result.before_distance > result.after_distance) {
                result.nearest = result.after
                result.nearest_distance = result.after_distance
            } else {
                result.nearest = result.before
                result.nearest_distance = result.before_distance
            }
        }
    }

    return result

}

URNDR.Point = function( input ) {

    this.X = -100;
    this.Y = -100;
    this.S = 0;
    
    this.R = 0;
    this.G = 0;
    this.B = 0;
    this.A = 0;

    this.OBJECT = null;
    this.FACE = null;
    this.BU = 1;
    this.BV = 0;
    this.BW = 0;

    // Potential movement
    this.PX = 0;
    this.PY = 0;

    this.updatePoint(input);

}
URNDR.Point.prototype.updatePoint = function( input ) {

    for (var key in input) {
        if (input.hasOwnProperty(key) && this.hasOwnProperty(key)) {
            this[key] = input[key]
        }
    }

}
URNDR.Point.prototype.updateBarycentricCoordinate = function( camera ) {
    if (this.OBJECT && this.FACE) {

        var ndc_pos, a, b, c, bary
        ndc_pos = URNDR.Math.pixelToCoordinate( this.X , this.Y )
        a = this.OBJECT.localToWorld( this.FACE.a.clone() ).project(camera)
        b = this.OBJECT.localToWorld( this.FACE.b.clone() ).project(camera)
        c = this.OBJECT.localToWorld( this.FACE.c.clone() ).project(camera)

        bary = URNDR.Math.getBarycentricCoordinate( ndc_pos , a , b , c )

        this.BU = bary.u
        this.BV = bary.v
        this.BW = bary.w

    }
}

// PEN

URNDR.Pen = function( canvas , wacom ) {
    
    // spatial data
    this.x = 0
    this.y = 0
    this.ndc_x = 0
    this.ndc_y = 0
    this.pressure = 0
    
    // state data
    this.isDown = 0
    this.active_tool = 0

    // tool data
    this.tools = {}
    this.canvas = canvas
    this.wacom = wacom

    // function
    this.onmousedown = function( pen, evt ) {
        pen.isDown = 1;
        if (pen.active_tool instanceof URNDR.PenTool) {
            pen.active_tool.onmousedown( pen, evt );
        }
    };
    this.onmouseup = function( pen, evt ) {
        pen.isDown = 0;
        if (pen.active_tool instanceof URNDR.PenTool) {
            pen.active_tool.onmouseup( pen, evt );
        }
    };
    this.onmousemove = function( pen, evt ) {

        var d = pen.getMousePos( evt )
        d.pressure = pen.wacom.pressure
        pen.updatePen( d )

        if (pen.active_tool instanceof URNDR.PenTool) {
            pen.active_tool.onmousemove( pen, evt );
        }

    };
    this.onmouseout = function( pen, evt ) {
        pen.isDown = 0;
        pen.active_tool.onmouseout( pen, evt );
    };

    // event
    var this_pen = this
    this.canvas.addEventListener("mousedown", function(evt){
        this_pen.onmousedown( this_pen, evt)
    } );
    this.canvas.addEventListener("mouseup", function(evt){
        this_pen.onmouseup( this_pen, evt)
    } );
    this.canvas.addEventListener("mousemove", function(evt){
        this_pen.onmousemove( this_pen, evt)
    } );
    this.canvas.addEventListener("mouseout", function(evt){
        this_pen.onmouseout( this_pen, evt)
    } );

}
URNDR.Pen.prototype.getMousePos = function (evt) {
    var rect = this.canvas.getBoundingClientRect();
    var obj = {};
        obj.x = evt.clientX - rect.left;
        obj.y = evt.clientY - rect.top;
        obj.ndc_x = THREE.Math.mapLinear( obj.x , 0 , this.canvas.width , -1 , 1 )
        obj.ndc_y = THREE.Math.mapLinear( obj.y , 0 , this.canvas.height , 1 , -1 )
    return obj;
}
URNDR.Pen.prototype.updatePen = function ( data ) {
    
    for (var k in data) {
        if ( PEN.hasOwnProperty(k) ) { PEN[k] = data[k]; }
    }

}
URNDR.Pen.prototype.selectToolByID = function ( id ) {

    if (this.tools.hasOwnProperty(id)) {
        this.active_tool = this.tools[id]
    }

}
URNDR.Pen.prototype.selectToolByName = function ( name ) {

    for ( var l in this.tools ) {
        if ( this.tools[l].name === name ) {
            this.active_tool = this.tools[l]
            return true;
        }
    }

    return false;

}
URNDR.Pen.prototype.addTool = function ( tool , activate ) {

    this.tools[tool.id] = tool
    if (activate) {
        this.selectToolByID( tool.id )
    }

}

URNDR.PenTool = function(parameters) {
    this.id = "T-" + THREE.Math.generateUUID();
    this.name = parameters.name || "Untitled Tool";
    this.onmousedown = parameters.onmousedown || function(){};
    this.onmouseup = parameters.onmouseup || function(){};
    this.onmousemove = parameters.onmousemove || function(){};
    this.onmouseout = parameters.onmouseout || function(){};
    this.size = parameters.size || 5;
    for (var p in parameters) {
        var flag = true
        // exclude these
        for (var no in ["id","name","onmousedown","onmouseup","onmousemove","size"]) {
            if (p === no) {
                flag = false
            }
        }
        // if not one of above, set it into the object
        if (flag === true) {
            this[p] = parameters[p]
        }
    }
}

// DEBUG HUD

URNDR.Hud = function(box) {
    this.box = box;
    this.messageStyle = { prefix : '<div class="argument">', suffix : '</div>', seperation : '' }
    this.vocal = true;
    this.devToDisplay = true;
    this.msg_count = 0;
    this.MAX_msg_count = 8;
    // METHODS
    
}
URNDR.Hud.prototype.display = function() {

    this.box.innerHTML = this.makeMessage( arguments[0] );
    this.msg_count = 1;

    for (var i=1;i<arguments.length;i++) {
        this.box.innerHTML += this.messageStyle.seperation + this.makeMessage( arguments[i] );
        this.msg_count += 1;
    }

}
URNDR.Hud.prototype.appendToDisplay = function() {
    
    for (var i=0;i<arguments.length;i++) {
        this.box.innerHTML += this.messageStyle.seperation + this.makeMessage( arguments[i] );
        this.msg_count += 1;
    }

}
URNDR.Hud.prototype.makeMessage = function(msg) {

    return this.messageStyle.prefix + msg + this.messageStyle.suffix;

}
URNDR.Hud.prototype.clearDisplay = function() {

    this.box.innerHTML = null;
    this.msg_count = 0;

}
URNDR.Hud.prototype.setPosition = function(left,top) {
    
    var style = this.box.style
    style.left = left || style.left;
    style.top = top || style.top;

}
URNDR.Hud.prototype.devChannel = function(msg) {

    if (this.vocal) {
        if (this.devToDisplay) {
            this.appendToDisplay(msg)
        } else {
            console.log(msg)
        }
    }

}

// FRAMES MANAGER

URNDR.FramesManager = function() {
    this.data = {};
    this.KEY_PREFIX = "f";
    this.DEFAULT_FRAME_NAME = "Frame";
    this.DEFAULT_FRAME_TYPE = "keyframe";
    this.DEFAULT_FRAME_DURATION = 1;
    this.activeFrame = 0;
}
URNDR.FramesManager.prototype = {
    getFrame : function ( frame_n ) {
        var f = this.KEY_PREFIX+frame_n;
        if ( this.data.hasOwnProperty(f) ) {
            return this.data[f];
        } else {
            return false;
        }
    },
    getFramesCount : function() {
        return Object.keys(this.data).length;
    },
    setFrame : function ( frame_n , data ) {
        var this_frame = this.getFrame(frame_n);
        if (this_frame) {
            if (data === undefined) return HUD.display("Error","Set exisiting frame "+frame_n+" but without data. ")
            for( var p in this_frame ){ if( data.hasOwnProperty(p) ) { this_frame[p] = data[p]; } }
        } else {
            this.createNewFrame(frame_n, data);
        }
    },
    deleteFrame : function ( frame_n ) {
        try {
            delete this.data[this.KEY_PREFIX + frame_n]
            return true;
        } catch (error) {
            console.log(error)
            return false;
        }
    },
    clearFrame : function ( frame_n ) {
        var f = getFrame(frame_n)
        if (f) {
            f.strokes_data = null;
        } else {
            return false;
        }
    },
    createNewFrame : function ( frame_n , data ) {
        this.data[this.KEY_PREFIX + frame_n] = this.createFrameInstance( data );
    },
    createFrameInstance : function ( data ) {
        var obj = {
            frame_name : this.DEFAULT_FRAME_NAME,
            frame_type : this.DEFAULT_FRAME_TYPE,
            frame_duration : this.DEFAULT_FRAME_DURATION,
            strokes_data : {}
        };
        if(data) { for ( var p in obj ){ if( data.hasOwnProperty(p) ){ obj[p] = data[p] } } }
        return obj;
    },
    getNearestFrameNumber : function ( frame_n , direction , frame_type ) {
        var keys,leng,pos;
            keys = Object.keys(this.data).sort();
            leng = keys.length;
        if (leng === 0) return false;
            pos = keys.indexOf( this.KEY_PREFIX + frame_n );
        if (pos === keys.length - 1 ) return false;
        if (pos === 0) return false;
        return pos + direction;
    },
    requestCanvasExport : function() {
        var req = new XMLHttpRequest();
        var i = new Date().getTime();
        var data = PAPER.toDataURL();
            data = 'data=' + encodeURIComponent(data) + '&i=' + i;
        req.open('post','php/saveframe.php')
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.setRequestHeader("Content-length", data.length);
        req.setRequestHeader("Connection", "close");
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status === 200) {
                console.log("Request done for frame " + i)
            }
        }
        req.send(data)
    }
}
// MATH

URNDR.Math = {

    pixelToCoordinate: function( x , y ) {
        return {x : THREE.Math.mapLinear( x , 0 , window.innerWidth , -1 , 1 ),
                y : THREE.Math.mapLinear( y , 0 , window.innerHeight , 1 ,-1 )}
    },
    
    coordinateToPixel : function( x , y ) {
        return { x : ( x / 2 + 0.5) * window.innerWidth,
                 y : -( y / 2 - 0.5) * window.innerHeight }
    },

    // Compute barycentric coordinates (u,v,w) for point p with respect to triangle (a,b,c)
    getBarycentricCoordinate : function( p , a , b , c ) {
        var v0,v1,v2,d00,d01,d11,d20,d21,denom,u,v,w;
        v0 = new THREE.Vector2(b.x-a.x,b.y-a.y)
        v1 = new THREE.Vector2(c.x-a.x,c.y-a.y)
        v2 = new THREE.Vector2(p.x-a.x,p.y-a.y)
        d00 = v0.dot(v0)
        d01 = v0.dot(v1)
        d11 = v1.dot(v1)
        d20 = v2.dot(v0)
        d21 = v2.dot(v1)
        denom = 1 / (d00 * d11 - d01 * d01)
        v = (d11 * d20 - d01 * d21) * denom
        w = (d00 * d21 - d01 * d20) * denom
        u = 1 - v - w
        return {u:u,v:v,w:w}
    }

}

URNDR.Helpers = {

    replaceLastElements : function(arr,rep) {
        var l = arr.length, 
            n = rep.length;

        if ( l <= n ) {
            arr = rep.slice( 0 , l );
        } else {
            arr = arr.slice( 0 , l - n ).concat(rep);
        }

        return arr;
    },

    getLastElements : function(arr,n) {

        if (n > arr.length) {
            return Object.create(arr);
        }

        return arr.slice( - n );

    },

    smoothArray : function(arr,params) {
        var l = arr.length;
        if (!params.factor) {params.factor = 8}
        for ( var i = 1 ; i < l - 1 ; i ++ ) {
            arr[i] = (arr[i-1] + arr[i] * params.factor + arr[i+1]) / (params.factor + 2);
            if (params.round) { arr[i] = Math.round(arr[i]); }
        }
    },

    randomNumber : function(number,params) {

        if (!number) { number = 1; }
        
        var result;
            result = number * Math.random();
        
        if (params) {
            if (params.round) result = Math.round(result);
        }

        return result
    
    },

    randomiseArray : function(arr , amp) {
        var l = arr.length;
        if (!amp) {amp = 10;}
        for ( i = 0 ; i < l ; i ++ ) {
            arr[i] += amp/2 - Math.random() * amp
        }
        return arr
    }

}

// STYLE

URNDR.StrokeStyle = function() {
    this.cap = "round";
    this.join = "round";
    this.composit = "source-over";
    this.brush_size = 50;
    this.color = {r:0,g:0,b:255,a:1};
}
URNDR.StrokeStyle.prototype.gradientMaker = function(ctx,p1,p2) {
    var grad = ctx.createLinearGradient( p1.X , p1.Y , p2.X , p2.Y );
    grad.addColorStop(0,'rgba('+p1.R+','+p1.G+','+p1.B+','+p1.A+')')
    grad.addColorStop(1,'rgba('+p2.R+','+p2.G+','+p2.B+','+p2.A+')')
    return grad
}

// MODEL -- an extension to displaying three objects.

URNDR.Model = function() {

    this.id = "MODEL-" + THREE.Math.generateUUID();
    this.name = "";

    // Animation Attributes
    this.active = false;
    this.tags = {};

    // THREE JSONLoader related attributes
    this.file_path = "";
    this.loader = new THREE.JSONLoader();
    this.loaded = false;

    // THREE.js Objects
    this.mesh = undefined;
    this.geometry = undefined;
    this.material = undefined;
    this.animationObject = undefined;

}
URNDR.Model.prototype = {
    loadModel: function( file_path, callback ){

        if (file_path) { this.file_path = file_path };

        var model = this; // pass this scope into the callback function
        this.loader.load( this.file_path, function( _geometry, _material ) {

            model.geometry = _geometry;
            model.geometry.computeBoundingBox();
            if (_material) { model.material = _material; }

            model.mesh = new THREE.Mesh( model.geometry, model.material )

            // SET MODEL POSITION
            var y_len = (model.mesh.geometry.boundingBox.max.y - model.mesh.geometry.boundingBox.min.y),
                scale = 5 / y_len;
            model.mesh.scale.set( scale, scale, scale )
            model.mesh.rotation.set( 0, 0, 0 )
            model.mesh.position.set( 0, -0.45 * y_len * scale, -5 )

            // ANMATION
            if (model.geometry.morphTargets.length > 0) {

                model.animationObject = new THREE.MorphAnimation( model.mesh )
                model.animationObject.play();
                // initialize the morphTarget array...
                model.animationObject.update( model.animationObject.duration / model.animationObject.frames )

            }

            // UNLOCK
            model.loaded = true;
            model.active = true;

            // CALLBACK
            callback( model );

        });

    },
    update: function( animSpeed ) {

        if (this.animationObject !== undefined) {

            this.animationObject.update( animSpeed );
            
        }


    }
}

// ThreeManager -- to manage all things regards Three.js

URNDR.ThreeManager = function( arg ) {

    // Storage
    this.models = {}
    this.models_sequence = []
    
    // THREE
    this.renderer = new THREE.WebGLRenderer({
        canvas: arg.canvas,
        precision: "lowp",
        alpha: true
    })
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 500)
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.defaultMaterial = arg.defaultMaterial || new THREE.MeshBasicMaterial({color: 0xCCCCCC})
    if (arg.fog) { this.scene.fog = arg.fog; }
    this.defaultAnimationSpeed = arg.defaultAnimationSpeed || 4

    // THREE setup
    this.renderer.setSize( window.innerWidth , window.innerHeight )
    this.camera.position.set( 0 , 0 , 0 )

}
URNDR.ThreeManager.prototype = {

    createModelFromFile: function( file_path, callback ) {

        // CREATE
        var manager = this,
            model = new URNDR.Model();
            model.material = this.defaultMaterial

        model.loadModel( file_path , function(){

            // THREE
            manager.scene.add( model.mesh );

            // STORAGE
            manager.models[ model.id ] = model;
            manager.models_sequence.push( model.id )

            // CALLBACK
            callback( model );

        } );

    },
    getModel: function( input ) {

        if (typeof input === "string") {
            // search by id
            if ( this.models.hasOwnProperty( input ) ) {
                return this.models[ input ]
            } else {
                return -1
            }
        } else if (typeof input === "number") {
            // search by index
            if (input >= 0 && input < this.models_sequence.length) {
                return this.getModel( this.models_sequence[input] )
            } else {
                return -1
            }
        }

    },
    eachModel: function( my_function , parameters ) {

        for( var i in this.models ){
            my_function( this.getModel(i) , parameters, i)
        }

    },
    update: function( speed ) {

        var manager = this;

        manager.eachModel( function( model , manager ){

            if (model.loaded && model.active) {

                if (typeof speed !== "number") {
                    speed = manager.defaultAnimationSpeed
                }
                model.update( speed );

            }

        }, manager )
        
        manager.renderer.render( this.scene , this.camera )

    }

}

// EXTEND THREE.JS for connecting my custom objects.

THREE.Object3D.prototype.getMorphedVertex = function( vertex_index ) {

    var geo = this.geometry,
        target_count = geo.morphTargets.length,
        influence_sum = this.morphTargetInfluences.reduce(function(a,b){return a+b});
    if ( target_count === 0 || influence_sum === 0 ) {
        return geo.vertices[ vertex_index ].clone();
    }

    // compute the vertex by morphTargets. 
    var result = new THREE.Vector3();
    for ( var i = 0; i < target_count; i++ ) {
        result.add( geo.morphTargets[i].vertices[ vertex_index ].clone().multiplyScalar( this.morphTargetInfluences[ i ] ) )
    }

    return result

}

THREE.Camera.prototype.calculateLookAtVector = function() {
    this.lookAtVector = new THREE.Vector3( 0, 0, -1 ).applyQuaternion( this.quaternion );
}
THREE.Camera.prototype.checkVisibility = function( obj, face ) {

    if (obj.visible === false) {
        return 0;
    }

    if (!this.lookAtVector) { this.calculateLookAtVector(); }

    var normalMatrix, N, result;

    normalMatrix = new THREE.Matrix3().getNormalMatrix( obj.matrixWorld );
    N = face.normal.clone().applyMatrix3( normalMatrix ).negate();
    result = THREE.Math.mapLinear( this.lookAtVector.angleTo(N), 1.2, 1.57, 1, 0 )
    result = THREE.Math.clamp( result, 0, 1 )

    return result;

}