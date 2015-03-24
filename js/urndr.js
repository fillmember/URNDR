var URNDR = {revision:'2'};

URNDR.COMMAND_MODULE = "COMMAND_MODULES"
URNDR.STYLE_MODULE = "STYLE_MODULES"
URNDR.POINT_MODULE = "POINT_MODULES"
URNDR.STROKE_MODULE = "STROKE_MODULES"
URNDR.DRAW_MODULE = "DRAW_MODULES"

// MODULE

URNDR.Module = function(n,t,k,e) {
    this.id = "MOD"+THREE.Math.generateUUID()
    this.priority = 1
    this.type = t
    this.name = n
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
    this.initialConfiguration = Object.create(s)
}
URNDR.Module.prototype.getConfiguration = function () { return this.configuration }

// MODULE MANAGER

URNDR.ModuleManager = function() {
    this.modules = {};
    this[URNDR.COMMAND_MODULE] = {};
    this[URNDR.STYLE_MODULE] = {};
    this[URNDR.POINT_MODULE] = {};
    this[URNDR.STROKE_MODULE] = {};
    this[URNDR.DRAW_MODULE] = {};
    this.key_map = {};
    // functions
    this.KEY_PREFIX = "KEY";
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
        
        var id = module.id;

        // put in general modules list
        this.modules[id] = module
        
        try {
            // put in each categories
            this[ module.type ][id] = this.modules[id]
        } catch(err) {
            HUD.appendToDisplay("failed to load a module into category: "+module.type||"type unknown",err)
        }

        if (typeof module.keyCode === "number") this.setKeyMap( module.keyCode , id )

    }
    this.loadModules = function ( list ) {
    
        for ( var l in list ) { this.loadModule( list[l] ) }
    
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
    this.resetModules = function( list_name ) { }
};

// Strokes

URNDR.Strokes = function(){
    
    // Data
    this.strokes = {}; // Store actual Stroke Objects. Key = Stroke ID.
    this.strokesHistory = []; // Store stroke ID. Record order of creation.
    this.strokesZDepth = []; // Store stroke ID. The later, the closer to screen.
    // Active Stroke is selector, ref by ID. When 0, means don't continue any existing stroke. 
    this.active_stroke = 0;

}
// functions
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

    this.center = {x:0,y:0}; // for future transform function.
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

    this.points = simplify( this.points , 0.75 , false );

}
URNDR.Stroke.prototype.calculateCenterOfPoints = function() {}
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
        before: 0, after: 0, before_distance: 0, after_distance: 0
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
        }
    } else {
        if (before_me === undefined) {
            result.after = this.getPoint( after_me )
            result.after_distance = after_me - n
        } else {
            result.before = this.getPoint( before_me )
            result.before_distance = n - before_me
            result.after = this.getPoint( after_me )
            result.after_distance = after_me - n
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
    this.onmousedown = function( evt ) {
        this.isDown = 1;
        activeTool.onmousedown( this, evt );
    };
    this.onmouseup = function( evt ) {
        this.isDown = 0;
        activeTool.onmouseup( this, evt );
    };
    this.onmousemove = function( evt ) {

        var d = this.getMousePos()
        d.pressure = this.wacom.pressure
        this.update( d )

        if (this.isDown === 1) {
            activeTool.onmousemove( this, evt );
        }
    };
    this.onmouseout = function( evt ) {
        this.isDown = 0;
    };
    // event
    this.canvas.addEventListener("mousedown", this.onmousedown );
    this.canvas.addEventListener("mouseup", this.onmouseup );
    this.canvas.addEventListener("mousemove", this.onmousemove );
    this.canvas.addEventListener("mouseout"), this.onmouseout );

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
URNDR.Pen.prototype.selectTool = function ( id ) {

    if (this.tools.hasOwnProperty(id)) {
        this.active_tool = id
    }

}
URNDR.Pen.prototype.addTool = function ( tool , activate ) {

    this.tools[tool.id] = tool
    if (activate) {
        this.selectTool( tool.id )
    }

}

URNDR.PenTool = function(parameters) {
    this.id = "T-" + THREE.Math.generateUUID();
    this.name = parameters.name || "Untitled Tool";
    this.onmousedown = parameters.onmousedown || function( evt ){ console.log("tool: "+this.name+" event: mousedown", evt); };
    this.onmouseup = parameters.onmouseup || function( evt ){ console.log("tool: "+this.name+" event: mouseup", evt); };
    this.onmousemove = parameters.onmousemove || function( evt ){ console.log("tool: "+this.name+" event: mousemove", evt); };
    for (var p in parameters) {
        var flag = true
        // exclude these
        for (var no in ["id","name","onmousedown","onmouseup","onmousemove"]) {
            if (p === no) {
                flag = false
            }
        }
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
    this.getFrame = function ( frame_n ) {
        var f = this.KEY_PREFIX+frame_n;
        if ( this.data.hasOwnProperty(f) ) {
            return this.data[f];
        } else {
            return false;
        }
    }
    this.getFramesCount = function() {
        return Object.keys(this.data).length;
    }
    this.setFrame = function ( frame_n , data ) {
        var this_frame = this.getFrame(frame_n);
        if (this_frame) {
            if (data === undefined) return HUD.display("Error","Set exisiting frame "+frame_n+" but without data. ")
            for( var p in this_frame ){ if( data.hasOwnProperty(p) ) { this_frame[p] = data[p]; } }
        } else {
            this.createNewFrame(frame_n, data);
        }
    }
    this.deleteFrame = function ( frame_n ) {
        try {
            delete this.data[this.KEY_PREFIX + frame_n]
            return true;
        } catch (error) {
            console.log(error)
            return false;
        }
    }
    this.clearFrame = function ( frame_n ) {
        var f = getFrame(frame_n)
        if (f) {
            f.strokes_data = null;
        } else {
            return false;
        }
    }
    this.createNewFrame = function ( frame_n , data ) {
        this.data[this.KEY_PREFIX + frame_n] = this.createFrameInstance( data );
    }
    this.createFrameInstance = function ( data ) {
        var obj = {
            frame_name : this.DEFAULT_FRAME_NAME,
            frame_type : this.DEFAULT_FRAME_TYPE,
            frame_duration : this.DEFAULT_FRAME_DURATION,
            strokes_data : {}
        };
        if(data) { for ( var p in obj ){ if( data.hasOwnProperty(p) ){ obj[p] = data[p] } } }
        return obj;
    }
    this.getNearestFrameNumber = function ( frame_n , direction , frame_type ) {
        var keys,leng,pos;
            keys = Object.keys(this.data).sort();
            leng = keys.length;
        if (leng === 0) return false;
            pos = keys.indexOf( this.KEY_PREFIX + frame_n );
        if (pos === keys.length - 1 ) return false;
        if (pos === 0) return false;
        return pos + direction;
    }
    // TODO: to integrate this into frame manager. 
    // TODO: Make a new canvas that provide background render??
    this.requestCanvasExport = function() {
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
    this.file_path = "";
    this.tags = {};
    // three
    this.Object3D = undefined;
    this.AnimationObject = undefined;
    // this.movesPerUpdate
}
URNDR.Model.prototype.loadModel = function() {}
URNDR.Model.prototype.updateModel = function( speed ) {
    this.AnimationObject.update( speed )
}

// ThreeManager -- to manage all things regards Three.js

URNDR.ThreeManager = function( parameters ) {
    this.renderer = new THREE.WebGLRenderer({
        canvas: parameters.canvas,
        precision: "lowp",
        alpha: true
    })
    this.camera   = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 500)
    this.scene    = new THREE.Scene();
    this.scene.fog = parameters.fog || new THREE.Fog( 0xF0F0F0, 3, 5 );
    this.animationSpeed = parameters.animationSpeed || 4
    this.defaultMaterial = parameters.defaultMaterial || new THREE.MeshBasicMaterial( {
        color: 0xFFFFFF,
        vertexColors: THREE.FaceColors, 
        
        fog: true,
        
        wireframe: true, 
        wireframeLinewidth: 0.1,

        morphTargets: true,

        side: THREE.CullFaceBack
    } )
    //
    this.renderer.setSize( window.innerWidth , window.innerHeight )
    this.camera.position.set( 0 , 0 , 5 )
    //
}
URNDR.ThreeManager.prototype.addModel = function(scene,model) {}
URNDR.ThreeManager.prototype.updateScene = function() {
    for( var i = 0; i < model_count; i++ ){
        this.model_list[i].updateModel( this.global_animation_speed );
    }
    // finally, render
    this.renderer.render( this.scene , this.camera )
}
URNDR.ThreeManager.prototype.checkVisibility = function(){};


// EXTEND THREE.JS for connecting my custom objects.

THREE.Object3D.prototype.getMorphedVertex = function( vertex_index ) {
    
    var target_count = this.geometry.morphTargets.length
    var influence_sum = this.morphTargetInfluences.reduce(function(a,b){return a+b});
    if ( target_count === 0 || influence_sum === 0 ) {
        // there's no morphTarget. Return the original vertex.
        return this.geometry.vertices[ vertex_index ].clone()
    }

    // compute the vertex by morphTargets. 
    var result = new THREE.Vector3( 0, 0, 0 );
    for ( var i = 0; i < target_count; i++ ) {

        result.add( this.geometry.morphTargets[i].vertices[ vertex_index ].clone().multiplyScalar( this.morphTargetInfluences[ i ] ) )

    }

    return result

}

THREE.Object3D.prototype.getMorphedFaceNormal = function( face_index ) {

    var target_face = this.geometry.faces[ face_index ]
    if (!target_face) { return 0; }

    var a,b,c
    a = obj.getMorphedVertex( face.a )
    b = obj.getMorphedVertex( face.b )
    c = obj.getMorphedVertex( face.c )

}