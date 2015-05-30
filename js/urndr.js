var URNDR = {revision:'2'};

URNDR.COMMAND_MODULE = "COMMAND_MODULES"
URNDR.STYLE_MODULE = "STYLE_MODULES"
URNDR.POINT_MODULE = "POINT_MODULES"
URNDR.STROKE_MODULE = "STROKE_MODULES"
URNDR.DRAW_MODULE = "DRAW_MODULES"

// CanvasManager

URNDR.CanvasManager = function(){
    this.list = {};
}
URNDR.CanvasManager.prototype = {
    get width () { return this.get(0).element.width; },
    get height () { return this.get(0).element.height; },
    add: function( domElement , name , context ) {
        this.list[name] = {};
        this.list[name].element = domElement;
        this.list[name].context = domElement.getContext( context );
    },
    get: function( v ) {
        if (this.list.hasOwnProperty(v)) {
            return this.list[ v ];
        } else if (typeof v === "number") {
            return this.list[ Object.keys( this.list )[ v ] ]
        } else {
            return 0;
        }
    },
    each: function( func ) {
        for ( var n in this.list ) {
            func( this.list[n] )
        }
    },
    resize: function( w , h ) {
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
    },
    clear: function( a ){
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
    },
    set lineCap (v) {
        this.each( function( item ) {
            item.context.lineCap = v;
        } )
    },
    set lineJoin (v) {
        this.each( function( item ) {
            item.context.lineJoin = v;
        } )
    }
}

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
        for (var i = 0, max = this.nodes.length; i < max; i++) {
            if (this.nodes[i] !== null) {
                this.nodes[i].clear()
                this.nodes[i] = null
            }
        }

    },
    split : function() {

        var w,h,x,y,lvl;
        
        lvl = this.level + 1;
        w = this.bounds.width / 2;
        h = this.bounds.height / 2;
        x = this.bounds.x;
        y = this.bounds.y;

        var qt = URNDR.QuadTree, rect = URNDR.Rectangle;

        this.nodes[0] = new qt( lvl, new rect(x + w, y    , w, h) )
        this.nodes[1] = new qt( lvl, new rect(x    , y    , w, h) )
        this.nodes[2] = new qt( lvl, new rect(x    , y + h, w, h) )
        this.nodes[3] = new qt( lvl, new rect(x + w, y + h, w, h) )

    },
    getIndex : function(rect){

        var index,verticalMidPoint,horizontalMidPoint,topQuadrant,bottomQuadrant;

            index = -1;
            verticalMidPoint = this.bounds.x + this.bounds.width * 0.5;
            horizontalMidPoint = this.bounds.y + this.bounds.height * 0.5;

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

// Module
URNDR.Module = function(n,t,k,e) {

    // Parameter Control
    var _name, _type, _keycode, _enabled;
    if (e == undefined) {
        _enabled = false
        if (typeof k == "number") {
            _keycode = k
        } else {
            // don't assign keycode
            _enabled = k
            _keycode = false;
        }
    } else {
        _enabled = e
        _keycode = k
    }
    _type = t
    _name = n

    // Properties that will always be
    this.id = "MOD-"+THREE.Math.generateUUID()
    this.priority = 1
    this.enabled = _enabled;
    this.type = _type
    this.name = _name
    this.timeControlObject = {
        then: Date.now(),
        interval: 25
    }
    this.func = function(){};

    // Properties that could be
    if (_type != URNDR.COMMAND_MODULE) {
        this.listener = function(){};
    }
    if (_keycode) {
        this.keyCode = _keycode;
    }

}
URNDR.Module.prototype = {
    get timeControl () {
        var obj = this.timeControlObject,
            now = Date.now(), 
            delta = now - obj.then;
        if (delta < obj.interval) {
            return false;
        } else {
            obj.then = now - (delta % obj.interval);
            return true;
        }
    },
    set interval (v) {
        this.timeControlObject.interval = v;
    },
    set settings ( s ) {
        this.configuration = s;
        this.initialConfiguration = Object.create(s);
    },
    get settings () {
        return this.configuration;
    },
    setFunction: function( f ) { this.func = f },
    getFunction: function() { return this.func },
    setConfiguration: function( s ) {
        this.configuration = s;
        this.initialConfiguration = Object.create( this.configuration )
    },
    getConfiguration: function() { return this.configuration },
    receive: function( event ) { return this.listener( event ) }
}

// Module Manager
URNDR.ModuleManager = function() {
    this.modules = {};
    this[ URNDR.COMMAND_MODULE ] = {};
    this[ URNDR.STYLE_MODULE ] = {};
    this[ URNDR.POINT_MODULE ] = {};
    this[ URNDR.STROKE_MODULE ] = {};
    this[ URNDR.DRAW_MODULE ] = {};
    
    this.KEY_PREFIX = "key";
    this.key_map = {};

    this.counter = 0;
    
    // functions
    this.setKeyMap = function( keyCode , id ) {

        this.key_map[ this.KEY_PREFIX + keyCode ] = id;

    }

    this.getModuleIDbyKey = function( keyCode ) {

        var result = this.key_map[ this.KEY_PREFIX + keyCode ];
        return (result? result : false)

    }

    this.loadModule = function ( module ) {

        if (module instanceof URNDR.Module === false) {

            if (typeof module === "function") {
                module = module();
            } else if (typeof module === "object") {
                return 0;
            }

        }

        // put in general modules list
        this.modules[ module.id ] = module;

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

    this.getModuleByName = function( query ){
        for( var m in this.modules ) {
            if ( query === this.modules[m].name ) {
                return this.modules[m]
            }
        }
        return false
    }
    this.trigger = function (evt) {
        var keyCode = evt.keyCode || evt.charCode,
            module = this.getModuleIDbyKey(keyCode);

        if ( module ) {
            
            module = this.getModule( module );
            
            var response = {module: module};
            
            switch( module.type ) {
            
                case URNDR.COMMAND_MODULE:
                    response.message = module.func( evt );
                    break;
            
                case URNDR.DRAW_MODULE:
                    this.soloModule( module )
                    response.message = "Activated";
                    break;

                // every other kind of modules (realtime modules & such...)
                default:
                    module.enabled = ! module.enabled;
                    _msg = module.receive( evt );
                    response.message = module.enabled ? "ON" : "OFF";
                    if (_msg) {
                        response.message += " : " + _msg;
                    }
                    break;
            
            }

            return response
            
        } else {

            return 0;

        }
    }
    this.soloModule = function( mod ) {

        var list = this[mod.type];

        for( var m in list ) {

            list[m].enabled = (list[m].id === mod.id) ? true : false

        }

    }
    this.runEnabledModulesInList = function (list_name, params) {

        var list = this[list_name];
        var m,mod;

        for ( m in list ) {
            mod = list[m];
            if (mod.enabled) {
                if (mod.timeControl) {
                    mod.func(params);
                }
            }
        }

    }
    this.getEnabledModulesCount = function( list_name ) {

        var list = this[list_name], enabled_count = 0;
        for (m in list) { if (list[m].enabled) { enabled_count ++; } }

        return enabled_count;

    }
}

// Strokes
URNDR.Strokes = function( _canvas ){
    
    // Data
    this.strokes = {}; // Store actual Stroke Objects. Key = Stroke ID.
    this.strokesHistory = []; // Store stroke ID. Record order of creation.
    this.strokesZDepth = []; // Store stroke ID. The later, the closer to screen.

    // Active Stroke is selector, ref by ID. When 0, means don't continue any existing stroke. 
    this.active_stroke = 0;
    this.canvas = _canvas;

}
URNDR.Strokes.prototype = {
    get strokeCount() {
        return this.strokesHistory.length;
    },
    reset: function() {

        this.strokes = {};
        this.strokesHistory = [];
        this.strokesZDepth = [];
        
        this.active_stroke = 0;

        this.quadTree.clear();

    },
    rebuildQuadTree: function() {

        // Create QuadTree
        var _qtw = this.canvas.canvasWidth || window.innerWidth, 
            _qth = this.canvas.canvasHeight || window.innerWidth;

        this.quadTree = new URNDR.QuadTree( 1, new URNDR.Rectangle( 0, 0, _qtw, _qth ) )

        this.eachStroke( function(stk,strokes){

            strokes.addToQuadTree( stk )
        
        }, this)

    },
    addToQuadTree: function( obj ) {

        var hit_size, half_hit,
            qt = this.quadTree;

        if (obj instanceof URNDR.Stroke) {

            obj.eachPoint( function(pnt,stk,i){
                
                qt.insert( new URNDR.Rectangle(
                    pnt.X, pnt.Y, 1, 1, 
                    { stroke: stk, pointIndex: i, point: pnt }
                ) );

            }, obj );

        }

    },
    getFromQuadTree: function( x , y , w , h ) {

        if (!x || !y) { return 0; }

        _w = w || 2;
        _h = h || 2;
        _x = x - _w * 0.5;
        _y = y - _h * 0.5;

        var rect = new URNDR.Rectangle( _x , _y , _w , _h );

        // return: array contains Point objects
        var rects = this.quadTree.retrieve( [], rect )
        var result = [];
        for (var r = 0, max = rects.length; r < max; r ++) {
            result.push( rects[r] )
        }

        return result;

    },
    getActiveStroke: function() {

        if (this.active_stroke !== 0) {
            return this.getStrokeByID( this.active_stroke );
        } else {
            return 0;
        }

    },
    // Make one stroke active by storing its ID into active_stroke,
    selectStrokeByID: function( id ) {

        if ( this.strokes.hasOwnProperty(id) ) {
            this.active_stroke = id
        } else {
            return false;
        }

    },
    getLatestStroke: function() {

        return this.getStrokeByID( this.strokesHistory[ this.strokesHistory.length - 1 ] );

    },
    beginNewStroke: function() {

        this.selectStrokeByID( this.addStroke() );

    },
    addStroke: function() {

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

            var stk = arguments[0]

            if (stk instanceof URNDR.Stroke ) {

                stk.parent = this;
                
                this.strokes[stk.id] = stk;
                this.strokesHistory.push( stk.id );
                this.strokesZDepth.push( stk.id );

                return stk.id; // return the id so people can identify it. 

            }

        }

    },
    // NOTE: To iterate through strokes when drawing & manipulating... just use strokes map or strokesArray. ,
    getStrokeByID: function( id ) {

        if (this.strokes.hasOwnProperty(id)) {
            return this.strokes[id]
        } else {
            return 0;
        }

    },
    deleteStrokeByID: function( id ) {
        
        if (this.strokes.hasOwnProperty(id)) {

            var in_history = this.strokesHistory.indexOf(id)
            var in_z_depth = this.strokesZDepth.indexOf(id)

            // NOTE: if everything works right. They should also be present in these arrays...
            if (in_history >= 0) { this.strokesHistory.splice( in_history , 1) }
            if (in_z_depth >= 0) { this.strokesZDepth.splice( in_z_depth , 1) }
            if (in_history === -1 || in_z_depth === -1) { this.checkConsistency(id) } // auto check consistency, something might be wrong :(

            delete this.strokes[id]

        }

    },
    checkConsistency: function(id) {

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

    },
    eachStroke: function( my_function , parameters ) {
        var len = this.strokeCount;
        var arr = this.strokesHistory.slice(0)
        for( var i = 0; i < len; i++ ){
            my_function( this.getStrokeByID( arr[ i ] ) , parameters , i );
        }
    }
}

// Stroke
URNDR.Stroke = function(tags) {

    this.id = "S-"+THREE.Math.generateUUID();
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
URNDR.Stroke.prototype = {
    get length() {
        return this.points.length;
    },
    get flag_to_delete() {

        if (this.length < 1) { return false; }
        if (this._flag_to_delete === true) { return true; }
        
        var sum_A = 0;
        var flag_invisible = true;
        
        this.eachPoint(function(pnt){
            sum_A+=pnt.A
            if (flag_invisible) {
                var ndc = pnt.ndc
                if (ndc.x > -1 && ndc.x < 1 && ndc.y > -1 && ndc.y < 1) {
                    flag_invisible = false;
                }
            }
        })
        
        if (flag_invisible) { return true; }
        if (sum_A < 0.05) { return true; } else { return false; }
    },
    deleteStroke: function(){ this._flag_to_delete = true; },
    addPoint: function( arg ) {

        if ( arg instanceof URNDR.Point ) {
            // already a Point object, just push it
            arg.parent = this;
            this.points.push( arg );
        } else {
            arg = arg != undefined ? arg : { parent: this };
            // copy the values to a newly created point.
            this.points.push( new URNDR.Point( arg ) )
        }

    },
    getPoint: function( point_n ) {

        if ( point_n >= 0 && point_n < this.length ) {
            return this.points[ point_n ]
        } else {
            return 0
        }

    },
    getTrack: function( track_name ) {

        var len, result
        len = this.length;
        result = [];

        if (len === 0) { return result; }
        if ( this.getPoint(0).hasOwnProperty( track_name ) === false ) { return 0; }

        for ( var i = 0; i < len; i++ ) { result.push( this.getPoint(i)[ track_name ] ) }
        return result;

    },
    setTrack: function( track_name , arr ) {

        var len = this.length

        if (len !== arr.length) { return 0 }

        for ( var i = 0; i < len; i++ ) { this.getPoint(i)[ track_name ] = arr[i]; }

    },
    removePoint: function( point_n ) {

        if ( point_n >= 0 && point_n < this.length ) {

            this.points.splice( point_n , 1)

        }

    },
    simplify: function( t ) {

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

    },
    simplify_more: function( n ) {

        n = n < 0 || n === undefined ? 30 : n

        this.optimize( n )

    },
    optimize: function( a ) {

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

    },
    calculateCenterOfPoints: function() {

        var result = {x:0,y:0},
            divider = 1 / this.length;

        this.eachPoint( function( pnt, parameters, i) {

            result.x += pnt.X;
            result.y += pnt.Y;

        }, null )

        result.x *= divider;
        result.y *= divider;

        return result;

    },
    setTag: function( tag , tag_data ) {

        this.tags[tag] = tag_data;

    },
    getTag: function( tag ) {

        if (this.tags.hasOwnProperty(tag)) {
            return this.tags[tag];
        } else {
            return undefined;
        }

    },
    eachPoint: function( my_function , parameters ) {
        var arr = this.points.slice(0)
        for (var j = 0, len = this.length; j < len; j++ ) {
            my_function( arr[ j ] , parameters , j )
        }
    },
    getNearestPointWith: function( track_name , n ) {

        if (this.length < 2) { return 0; }
        if (this.getPoint(n).hasOwnProperty( track_name ) === false ) { return 0; }

        var track = this.getTrack( track_name ),
            len = track.length,
            before_me, b, after_me, a, result;

        before_me = after_me = false;
        
        result = {
            before: 0, 
            before_distance: Infinity, 
            after: 0, 
            after_distance: Infinity
        }
        
        for (b = n - 1; b >= 0; b--) {
            if ( track[b] != null ) {
                before_me = b;
                break;
            }
        }
        
        for (a = n; a < len; a++) {
            if ( track[a] != null ) {
                after_me = a;
                break;
            }
        }

        if (before_me != false) {
            result.before = this.getPoint( before_me )
            result.before_distance = n - before_me
        }
        if (after_me != false) {
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

// Point
URNDR.Point = function( input ) {

    this.parent = undefined;

    // Size
    this.X = -100;
    this.Y = -100;
    this.S = 0;
    
    // Color
    this.R = 0;
    this.G = 0;
    this.B = 0;
    this.A = 0;

    // 3D Binding Related
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
URNDR.Point.prototype = {

    get ndc() {

        var w, h;
        if (this.parent && this.parent.parent) {
            w = this.parent.parent.canvas.width;
            h = this.parent.parent.canvas.height;
        } else {
            w = window.innerWidth;
            h = window.innerHeight;
        }

        var a = URNDR.Math.pixelToCoordinate( this.X , this.Y , w , h )
        return new THREE.Vector2(a.x,a.y)
    },
    get binded() {
        return (this.OBJECT && this.FACE) ? true : false;
    },
    set binded( input ) {
        if (input === false) {
            this.OBJECT = null;
            this.FACE = null;
            this.BU = 0;
            this.BV = 0;
            this.BW = 0;
            this.PX = 0;
            this.PY = 0;
        } else {
            // do nothing because that doesn't make sense.
        }
    },
    // For compatibility with THREE... etc
    get x() { return this.X; },
    get y() { return this.Y; },
    set x(v) { this.X = v; },
    set y(v) { this.Y = v; },
    distanceToSquared: function( pnt ) {

        var dx = this.X - pnt.X, dy = this.Y - pnt.Y;
        return dx * dx + dy * dy;

    },
    distanceTo: function( pnt ) {

        return Math.sqrt( this.distanceToSquared( pnt ) );

    },
    updatePoint: function( input ) {

        for (var key in input) {
            if ( this.hasOwnProperty( key ) ) {
                this[key] = input[key];
            }
        }

    },
    refreshBinding: function( threeManager ) {

        U3.raycaster.setFromCamera( new THREE.Vector2( this.ndc.x , this.ndc.y ) , threeManager.camera )

        var intersects_raw = threeManager.raycaster.intersectObjects( threeManager.scene.children )
        var intersects = [];
        intersects_raw.forEach(function(o){
            if (o.object.visible) {
                intersects.push(o);
            }
        })
        if (intersects.length > 0) {

            var obj = intersects[0].object, face = intersects[0].face;

            var a = obj.localToWorld( obj.getMorphedVertex( face.a ) ).project( threeManager.camera ),
                b = obj.localToWorld( obj.getMorphedVertex( face.b ) ).project( threeManager.camera ),
                c = obj.localToWorld( obj.getMorphedVertex( face.c ) ).project( threeManager.camera ),
                bary = URNDR.Math.getBarycentricCoordinate( this.ndc , a , b , c );

            this.OBJECT = obj;
            this.FACE = face;
            this.BU = bary[0]
            this.BV = bary[1]
            this.BW = bary[2]

        } else {

            this.binded = false;
            
        }

    }
}

// Pen
URNDR.Pen = function( canvas_draw , canvas_hud , wacom ) {
    
    // spatial data
    this.x = 0
    this.y = 0
    this.pressure = 0
    
    // state data
    this.isDown = 0
    this.active_tool = 0

    // tool data
    this.tools = {}
    this.canvas = canvas_draw
    this.canvas_hud = canvas_hud
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

        // update data
        var rect = this.canvas.getBoundingClientRect();
        this.x = evt.clientX - rect.left;
        this.y = evt.clientY - rect.top;
        this.pressure = pen.wacom.pressure;

        // call tool
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
    canvas_hud.addEventListener("mousedown", function(evt){
        this_pen.onmousedown( this_pen, evt);
    } );
    canvas_hud.addEventListener("mouseup", function(evt){
        this_pen.onmouseup( this_pen, evt);
    } );
    canvas_hud.addEventListener("mousemove", function(evt){
        this_pen.onmousemove( this_pen, evt);
    } );
    canvas_hud.addEventListener("mouseout", function(evt){
        this_pen.onmouseout( this_pen, evt);
    } );
}
URNDR.Pen.prototype = {
    get ndc_x() {
        return THREE.Math.mapLinear( this.x , 0 , this.canvas.width , -1 , 1 );
    },
    get ndc_y() {
        return THREE.Math.mapLinear( this.y , 0 , this.canvas.height , 1 , -1 );
    },
    get ndc() {
        return [ this.ndc_x, this.ndc_y ];
    },
    set ndc( input ) {
        var o = URNDR.Math.coordinateToPixel( input[0], input[1] , this.canvas.width , this.canvas.height )
        this.x = o.x; this.y = o.y;
    },
    selectToolByID: function( id ) {

        if (this.tools.hasOwnProperty(id)) {
            
            if (this.active_tool instanceof URNDR.PenTool) {
                this.active_tool.disengage();
            }
            
            this.active_tool = this.tools[id]
            this.active_tool.engage();

        }

    },
    selectToolByName: function( name ) {

        for ( var l in this.tools ) {
            if ( this.tools[l].name === name ) {

                if (this.active_tool instanceof URNDR.PenTool) {
                    this.active_tool.disengage();
                }
                
                this.active_tool = this.tools[l]
                this.active_tool.engage();
                return true;
            
            }
        }

        return false;

    },
    addTool: function( tool , activate ) {

        this.tools[tool.id] = tool
        if (activate) { this.selectToolByID( tool.id ) }

    }
}

// PenTool
URNDR.PenTool = function(parameters) {
    this.id = "T-" + THREE.Math.generateUUID();
    this.name = parameters.name || "Untitled Tool";
    this.onmousedown = parameters.onmousedown || function(){};
    this.onmouseup = parameters.onmouseup || function(){};
    this.onmousemove = parameters.onmousemove || function(){};
    this.onmouseout = parameters.onmouseout || function(){};
    this.engage = parameters.engage || function(){};
    this.disengage = parameters.disengage || function(){};
    this.size = parameters.size || 5;

    // this is a very weird hack to put parameters in...
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

// Hud
URNDR.Hud = function(box) {
    this.box = box;
    this.style = {
        prefix : '<div class="argument">',
        suffix : '</div>',
        space : ''
    }
}
URNDR.Hud.prototype = {
    display: function() {

        this.box.innerHTML = this.wrap( arguments[0] );

        for (var i=1;i<arguments.length;i++) {
            this.box.innerHTML += this.style.space + this.wrap( arguments[i] );
        }

    },
    appendToDisplay: function() {
        
        for (var i=0;i<arguments.length;i++) {
            this.box.innerHTML += this.style.space + this.wrap( arguments[i] );
        }

    },
    wrap: function(msg) {

        return this.style.prefix + msg + this.style.suffix;

    },
    clear: function() {

        this.box.innerHTML = null;

    },
    position: function(left,top) {
        
        var style = this.box.style
        style.left = left || style.left;
        style.top = top || style.top;

    }
}

// StrokeStyle
URNDR.StrokeStyle = function() {
    this.cap = "round";
    this.join = "round";
    this.composit = "source-over";
    this.brush_size = 40;
    this.color = [0,0,255,1];
}
URNDR.StrokeStyle.prototype = {
    gradientMaker: function(ctx,p1,p2,factor) {
        var grad = ctx.createLinearGradient( p1.X , p1.Y , p2.X , p2.Y );
        grad.addColorStop(0,'rgba('+p1.R+','+p1.G+','+p1.B+','+p1.A * factor+')')
        grad.addColorStop(1,'rgba('+p2.R+','+p2.G+','+p2.B+','+p2.A * factor+')')
        return grad
    }
}

// Model
URNDR.Model = function( args ) {

    this.id = "MODEL-" + THREE.Math.generateUUID();
    this.name = "";

    // Animation Attributes
    this.tags = {};

    // THREE JSONLoader related attributes
    this.file_path = "";
    this.loader = new THREE.JSONLoader();
    this.loaded = false;

    // THREE.js Objects
    this.mesh = undefined;
    this.geometry = undefined;
    this.material = args.material;
    this.animation = undefined;

    // Behaviours
    this.init = args.init || function(){};
    this.onfocus = args.onfocus || function(){};
    this.onblur = args.onblur || function(){};
    this.onframe = args.onframe || function(){};

}
URNDR.Model.prototype = {
    get active () {
        if (this.mesh) {
            return this.mesh.visible;
        } else {
            return false;
        }
    },
    set active (value) {
        var original = 0;
        if (this.mesh) {
            original = this.mesh.visible;
            this.mesh.visible = value;
        }
        if (original !== value) {
            if (value) {
                this.onfocus();
            } else {
                this.onblur();
            }
        }
    },
    loadModel: function( file_path, callback ){

        this.file_path = file_path

        var model = this;
        this.loader.load( this.file_path, function( _geometry, _material ) {

            model.geometry = _geometry;
            if (_material) { model.material = _material; }

            model.mesh = new THREE.Mesh( model.geometry, model.material )

            // UNLOCK
            model.loaded = true;
            model.active = true;

            // Init Function
            model.init( model );

            // CALLBACK
            callback( model );

        });

    },
    update: function( speed ) {

        if (this.active) {
            if (this.animation) {
                this.animation.update( speed )
            }
        }

    },
}

// ThreeManager -- to manage all things regards Three.js
URNDR.ThreeManager = function( arg ) {

    // Storage
    this.models = {}
    this.models_array = []
    this.activeModel = 0;
    
    // THREE
    this.renderer = new THREE.WebGLRenderer({
        canvas: arg.canvas,
        precision: "lowp",
        alpha: true,
        // preserveDrawingBuffer: true
    })
    this.camera = new THREE.PerspectiveCamera( 75, 1, 1, 500)
    this.scene = new THREE.Scene();
    if (arg.fog) { this.scene.fog = arg.fog; }
    this.raycaster = new THREE.Raycaster();
    
    this.material = arg.material || new THREE.MeshBasicMaterial({
        morphTargets: true,color: 0x0000CC
    })
    this.material.index0AttributeName = "position";
    
    // controls
    this.rig = {
        radius: 5,
        target_radius: 5,
        theta : 0,
        target_theta : 0,
        pitch : 0,
        target_pitch : 0,
        speed : 0.1,
        focus : new THREE.Vector3(0,0,0)
    }
    this.speed = 15;

    this.camera.position.set( 0 , 0 , 5 )

}
URNDR.ThreeManager.prototype = {

    get count() {
        return this.models_array.length;
    },
    createModelFromFile: function( file_path, args ) {

        args.material = args.material || this.material;

        var model = new URNDR.Model( args );

        // Add
        this.addModel( model )

        // Load
        var manager = this;
        model.loadModel( file_path , function(){

            manager.scene.add( model.mesh );

        } );

    },
    addModel: function( model ) {

        model.parent = this;
        this.models[ model.id ] = model;
        this.models_array.push( model.id );

    },
    getModel: function( input ) {

        if (typeof input === "string") {
            // search by id
            if ( this.models.hasOwnProperty( input ) ) {
                return this.models[ input ];
            } else {
                return -1;
            }
        } else if (typeof input === "number") {
            // search by index
            if (input >= 0 && input < this.models_array.length) {
                return this.getModel( this.models_array[input] );
            } else {
                return -1;
            }
        } else {
            // return latest one
            return this.getModel( this.count - 1 );
        }

    },
    eachModel: function( my_function , parameters ) {

        for( var i in this.models ){
            my_function( this.getModel(i) , parameters, i)
        }

    },
    solo: function( n ){
        var manager = this;
        manager.models_array.forEach( function(o,i){
            manager.models[o].active = (i === n) ? true : false
        } )
    },
    update: function() {

        var manager = this;

        // Model

        manager.eachModel( function( model , manager ){

            if (model.loaded && model.active) {

                model.update( manager.speed );

            }

        }, manager )

        // Camera

        var rig = this.rig;
        
        var circle = 6.283185247;
        if (rig.theta >= circle) {
             rig.theta -= circle;
             rig.target_theta -= circle;
        } else if (rig.theta < -circle) {
             rig.theta += circle;
             rig.target_theta += circle;
        }
        
        rig.theta += ( rig.target_theta - rig.theta ) * rig.speed;
        rig.pitch += ( rig.target_pitch - rig.pitch ) * rig.speed;
        rig.radius += ( rig.target_radius - rig.radius ) * rig.speed;

        U3.camera.position.z = Math.sin( rig.theta ) * rig.radius;
        U3.camera.position.x = Math.cos( rig.theta ) * rig.radius;
        U3.camera.position.y = THREE.Math.mapLinear( rig.pitch , -1 , 1 , -2 , 2 )
        U3.camera.lookAt(rig.focus)

        // Renderer
        
        manager.renderer.render( this.scene , this.camera )

    }
}

// Math
URNDR.Math = {

    pixelToCoordinate: function( x , y , w , h ) {
        return {
            x : THREE.Math.mapLinear( x , 0 , w , -1 , 1 ),
            y : THREE.Math.mapLinear( y , 0 , h , 1 ,-1 )
        };
    },
    
    coordinateToPixel : function( x , y , w , h ) {
        return {
            x :  ( x / 2 + 0.5) * w, 
            y : -( y / 2 - 0.5) * h
        };
    },

    // Compute barycentric coordinates (u,v,w) for point p with respect to triangle (a,b,c)
    getBarycentricCoordinate : function( p , a , b , c ) {
        var v0,v1,v2,d00,d01,d11,d20,d21,denom,u,v,w;
            v0 = new THREE.Vector2(b.x-a.x,b.y-a.y);
            v1 = new THREE.Vector2(c.x-a.x,c.y-a.y);
            v2 = new THREE.Vector2(p.x-a.x,p.y-a.y);
        d00 = v0.dot(v0);
        d01 = v0.dot(v1);
        d11 = v1.dot(v1);
        d20 = v2.dot(v0);
        d21 = v2.dot(v1);
        denom = 1 / (d00 * d11 - d01 * d01);
        v = (d11 * d20 - d01 * d21) * denom;
        w = (d00 * d21 - d01 * d20) * denom;
        u = 1 - v - w;
        return [u,v,w];
    },

    random : function(number,params) {

        if (!number) { number = 1; }
        
        var result = number * Math.random();
        
        if (params) {
            if (params.round) result = Math.round(result);
        }

        return result
    
    }

}

// Helper
URNDR.Helpers = {

    randomizeArray : function(arr , amp) {
        if (!amp) {amp = 10;}
        var half = amp * 0.5;
        for ( var i = 0, l = arr.length; i < l; i ++ ) {
            arr[i] += half - Math.random() * amp
        }
        return arr
    }

}

// EXTEND THREE.JS for connecting my custom objects.
THREE.Object3D.prototype.getMorphedVertex = function( vertex_index ) {

    var geo = this.geometry,
        flu = this.morphTargetInfluences;

    if ( flu && geo.morphTargets ) {
        
        if (geo.morphTargets.length > 0) {
            
            var result = new THREE.Vector3(),
                sum = 0;
            
            for ( var i = 0, max = geo.morphTargets.length; i < max; i ++ ) {
                var vert = geo.morphTargets[ i ].vertices[ vertex_index ];
                result.x += vert.x * flu[ i ]
                result.y += vert.y * flu[ i ]
                result.z += vert.z * flu[ i ]
                sum += flu[ i ]
            }
            
            if ( sum != 0 ) {
                return result
            }

        }

    }

    return geo.vertices[ vertex_index ].clone();

}
THREE.Camera.prototype.checkVisibility = function( obj, face ) {

    if (obj.visible === false) { return 0; }

    var map = THREE.Math.mapLinear, clamp = THREE.Math.clamp;

    var normalMatrix = new THREE.Matrix3().getNormalMatrix( obj.matrixWorld ),
        N = face.normal.clone().applyMatrix3( normalMatrix ).negate(), 
        lookAtVector = new THREE.Vector3(0,0,-1).applyQuaternion(this.quaternion);

    return clamp( map( lookAtVector.angleTo(N), 1.2, 1.4, 1, 0 ), 0, 1 );

}

THREE.MorphAnimation.prototype.stop = function() {
    this.pause();
    this.currentFrame = 1;
    this.currentTime = 0;
    for ( var a = 0; a < this.frames; a ++ ) {
        this.mesh.morphTargetInfluences[a] = 0;
    }
    this.mesh.morphTargetInfluences[0] = 1;
}