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
        for (m in list) if (list[m].enabled) enabled_count ++
        return enabled_count;
    }
    this.resetModules = function( list_name ) { }
};

// Strokes

URNDR.Strokes = function(){
    this.data = {
        // Vector Data
        X:[], Y:[], S:[], 
        // Colour Data
        R:[], G:[], B:[], A:[],
        // 3D Data. BINDED_FACE is the reference to the face object, The next two are initial position. 
        BindedObject: [], BindedFace: [], Barycentric: [],
        // Additional Effect Data
        EffectData: []
    };
    this.active_stroke = 0;
    for ( var p in this.data ) { this.data[p][0] = []; }
    // functions
    this.getStroke = function(stroke_n) {
        var result = {}
        for (p in this.data) { result[p] = this.data[p][stroke_n] }
        return result;
    }
    this.deleteStroke = function(stroke_n) {
        for (p in this.data) { this.data[p].splice( stroke_n , 1 ) }
        this.active_stroke--;
    }
    this.deletePointInStroke = function( stroke_n , point_n ) { for (p in this.data ) { this.data[p][stroke_n].splice(point_n, 1)} }
    this.setPointInStroke = function( stroke_n , point_n , data_set ) {
        for ( p in data_set ) { if (this.data.hasOwnProperty(p)) { this.data[p][stroke_n][point_n] = data_set[p]; } }
    }
    this.addNewPointInStroke = function( stroke_n , point ) { for ( p in this.data ) { this.data[p][stroke_n].push(point[p]) } }
    this.getStrokesCount = function() { return this.data.X.length; }
    this.getStrokeLength = function(stroke_n) { return this.data.X[stroke_n].length; }
    this.beginNewStroke = function() {
        for ( p in this.data ) { this.data[p].push([]) }
        this.active_stroke++;
    }
    this.optimizeStroke = function( stroke_n ) {
        var stroke, stroke_length, deleted_point_count;

        deleted_point_count = 0;

        // Goals : 
        // Remove strokes points with size / alpha zero
        stroke = this.getStroke(stroke_n);
        stroke_length = this.getStrokeLength(stroke_n);
        for ( var point_n = 0 ; point_n < stroke_length ; point_n ++ ) {

            if (stroke.S[point_n] === 0 || stroke.A[point_n] === 0) {
                this.deletePointInStroke(stroke_n, point_n);
                deleted_point_count += 1;
            }

        }

        //
        // Speparate strokes into not mapped ones and mapped ones
        function checkBarycentricCoordinate( stroke , point_n ) {
            return stroke.Barycentric[ point_n ] ? true : false
        }

        var flag = {new_lines:0,state:null,cutpoints:[]}
        stroke = this.getStroke(stroke_n);
        stroke_length = this.getStrokeLength(stroke_n);
        flag.state = checkBarycentricCoordinate( stroke , 0 )
        for ( var point_n = 1 ; point_n < stroke_length ; point_n ++ ) {
            var b = checkBarycentricCoordinate(stroke, point_n);
            if (b !== flag.state) {
                console.log(point_n,b?"3D":"2D")
                flag.cutpoints.push(point_n)
                flag.state = b
                flag.new_lines ++;
            }
        }
        console.log("// CUT TIME //")
        var cut = 0;
        var newStrokes = [];
        var bufferStroke;
        while (cut < flag.cutpoints.length) {
            console.log("from",0,"to",flag.cutpoints[cut])
            newStrokes.push()
            cut += 1;
        }
        console.log("")

        //
        // check if the stroke's length is zero, if so delete it
        stroke_length = this.getStrokeLength(stroke_n);
    }
    this.cutStroke = function( stroke_n , index ) {
        //
    }
    this.getActiveStroke = function() { return this.active_stroke; }
    this.getStrokeCenter = function(stroke_n) {
        var stroke = this.getStroke(stroke_n),
            len = this.getStrokeLength(stroke_n),
            sum = [0,0,0];
        for( var p = 0 ; p < len ; p ++ ) { sum[0] += stroke.X[p]; sum[1] += stroke.Y[p]; sum[2] += stroke.Z[p]; }
        sum[0] /= len; sum[1] /= len; sum[2] /= len;
        return sum;
    }
}

// PEN

URNDR.Pen = function() {
    this.x = 0
    this.y = 0
    this.ndc_x = 0
    this.ndc_y = 0
    this.pressure = 0
    this.isDown = 0
    this.drawingMode = 1
}
URNDR.Pen.prototype.getMousePos = function (canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    var obj = {};
        obj.x = evt.clientX - rect.left;
        obj.y = evt.clientY - rect.top;
        obj.ndc_x = THREE.Math.mapLinear( obj.x , 0 , window.innerWidth , -1 , 1 )
        obj.ndc_y = THREE.Math.mapLinear( obj.y , 0 , window.innerHeight , 1 , -1 )
    return obj;
}

// DEBUG HUD

URNDR.Hud = function(box) {
    this.box = box;
    this.messageStyle = { prefix : '<div class="argument">', suffix : '</div>', seperation : '' }
    // METHODS
    this.display = function() {
        this.box.innerHTML = this.makeMessage( arguments[0] );
        for (var i=1;i<arguments.length;i++) { this.box.innerHTML += this.messageStyle.seperation + this.makeMessage( arguments[i] ); }
    }
    this.appendToDisplay = function() { for (var i=0;i<arguments.length;i++) { this.box.innerHTML += '<br />' + arguments[i]; } }
    this.makeMessage = function(msg) {
        return this.messageStyle.prefix + msg + this.messageStyle.suffix;
    }
    this.clearDisplay = function() { this.box.innerHTML = null; }
    this.setPosition = function(left,top) {
        var style = this.box.style
        style.left = left || style.left;
        style.top = top || style.top;
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

// STYLE

URNDR.StrokeStyle = function() {
    this.cap = "round";
    this.join = "round";
    this.composit = "source-over";
    this.brush_size = 50;
    this.color = {r:0,g:0,b:255,a:1};
}