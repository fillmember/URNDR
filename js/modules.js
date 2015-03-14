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
URNDR.Module.prototype.getFunction = function ( f ) { return this.func }
URNDR.Module.prototype.setConfiguration = function ( s ) {
    this.configuration = s
    this.initialConfiguration = Object.create(s)
}
URNDR.Module.prototype.getConfiguration = function () { return this.configuration }

MODULES.loadModules( {

// COMMANDS
// this part is the only exception that probably can't possibly conviniently pass parameters in.
// They will use global parameters from main.js. 

reload_web_page : function() {
    var module = new URNDR.Module("Reload Web Page",URNDR.COMMAND_MODULE,13)
    module.setFunction(function() {window.location.reload(); return ""})
    return module
},

clear_canvas : function() {
    var module = new URNDR.Module("Clear Canvas",URNDR.COMMAND_MODULE,32)
    module.setFunction(function(){ clear(1); STROKES = new URNDR.Strokes(); return ""; })
    return module
},

brush_size_up : function() {
    var module = new URNDR.Module("Increase Brush Size",URNDR.COMMAND_MODULE,221)
    module.setFunction(function(){ STYLE.brush_size += 5; return STYLE.brush_size; })
    return module
},

brush_size_down : function() {
    var module = new URNDR.Module("Reduce brush size",URNDR.COMMAND_MODULE,219)
    module.setFunction(function(){ if (STYLE.brush_size > 5) {STYLE.brush_size -= 5;} return STYLE.brush_size;})
    return module
},

simplified_all_strokes : function() {
    var module = new URNDR.Module("Simplfy Strokes",URNDR.COMMAND_MODULE,81)
    module.setFunction(function() {
        var simp_count = 0, s;
        for( var k = 0 ; k < STROKES.getStrokesCount() ; k ++ ) { s = STROKES.getStroke(k); }
        return "Points deleted: " + simp_count;
    })
    return module
},

// STYLE MODULES
// none at the moment

random_stroke_color : function() {
    var module = new URNDR.Module("Random Stroke Color",URNDR.STYLE_MODULE,65);
    module.setFunction(function() {
        STYLE.color.r = RANDOM_NUMBER(255,{round: true});
        STYLE.color.g = RANDOM_NUMBER(255,{round: true});
        STYLE.color.b = RANDOM_NUMBER(255,{round: true});
    })
    return module
},

// POINT DATA MODULES


random_point_position : function() {
    var module = new URNDR.Module("Random Point",URNDR.POINT_MODULE,68);
    // 
    module.setConfiguration({amp : 60})
    module.setFunction(function( point ) {
        var amp = this.getConfiguration().amp;
        var half = amp/2
        point.X += half - RANDOM_NUMBER(amp);
        point.Y += half - RANDOM_NUMBER(amp);
        // also mess with barycentric coordinate.
        if (point.Barycentric) {
            point.Barycentric.u += 0.2 - 0.4 * RANDOM_NUMBER(1)
            point.Barycentric.v += 0.2 - 0.4 * RANDOM_NUMBER(1)
            point.Barycentric.w += 0.2 - 0.4 * RANDOM_NUMBER(1)
        }
    })
    return module
},

pressure_sensitivity : function() {
    var module = new URNDR.Module("Pressure Sensitivity",URNDR.POINT_MODULE,false,true);
    module.setFunction(function(point) {
        point.S *= PEN.pressure;
        if (point.S < 10) point.S = 10;
        if (point.s > 100) point.S = 100;
    })
    return module
},

// STROKE DATA MODULES

smooth_stroke : function() {
    var module = new URNDR.Module("Smooth Stroke",URNDR.STROKE_MODULE,83,false) //s
    module.setConfiguration({ length: 300, factor: 10 , all : true })
    module.setFunction(function(STROKES) {
        var data = STROKES.data,
            settings = module.getConfiguration()
        if (settings.all) {
            var len = STROKES.getStrokesCount();
            for (var k = 0 ; k < len ; k ++) { smoothie( k , data , settings ) }
        } else {
            smoothie( STROKES.getActiveStroke() , data , settings )
        }
        function smoothie( a , data , settings ) {
            var eX, eY, eS;
                eX = getLastNElements( data.X[a] , settings.length)
                eY = getLastNElements( data.Y[a] , settings.length)
                eS = getLastNElements( data.S[a] , settings.length)
            SMOOTH_ARRAY( eX , {factor:settings.factor} );
            SMOOTH_ARRAY( eY , {factor:settings.factor} );
            SMOOTH_ARRAY( eS , {factor:settings.factor} );
            data.X[a] = replaceLastElements( data.X[a] , eX )
            data.Y[a] = replaceLastElements( data.Y[a] , eY )
            data.S[a] = replaceLastElements( data.S[a] , eS )
        }
    })
    return module
},

move_drawing_with_3d_model : function() {
    var module = new URNDR.Module("MAGIC 001: 3D MAGIC",URNDR.STROKE_MODULE,85,true);
    module.setFunction(function(STROKES) {
        var data,obj,face,p3d,newp,delta,len;
            data = STROKES.data;
            len = STROKES.getStrokesCount();
        // get camera's lookat vector
        var cameraVector = new THREE.Vector3(0,0, -1).applyQuaternion( CAMERA.quaternion ).normalize();
        // iterate time
        for (var this_stroke = 0 ; this_stroke < len ; this_stroke ++) {
            // to stable current stroke
            // if (STROKES.getActiveStroke() === this_stroke) {break;}
            len_p = STROKES.getStrokeLength(this_stroke);
            for (var this_point = 0 ; this_point < len_p ; this_point++) {
                obj = data.BindedObject[this_stroke][this_point];
                face = data.BindedFace[this_stroke][this_point];
                if (!obj || !face) continue;
                // check if a face is turning away from camera
                var faceVector = obj.localToWorld(face.normal.clone()).normalize();
                if (Math.abs( cameraVector.dot(faceVector) ) <= 0.1) {
                    // if so, hide the point binded to the face.
                    hidePoint(this_stroke, this_point)
                } else {
                    var a,b,c,bary
                        a = obj.localToWorld(obj.geometry.vertices[face.a].clone()).project( CAMERA )
                        b = obj.localToWorld(obj.geometry.vertices[face.b].clone()).project( CAMERA )
                        c = obj.localToWorld(obj.geometry.vertices[face.c].clone()).project( CAMERA )
                        bary = data.Barycentric[this_stroke][this_point]
                    p_now = URNDR.Math.coordinateToPixel(
                        a.x * bary.u + b.x * bary.v + c.x * bary.w, 
                        a.y * bary.u + b.y * bary.v + c.y * bary.w
                    )
                    data.X[this_stroke][this_point] += (p_now.x - data.X[this_stroke][this_point]) * 0.1
                    data.Y[this_stroke][this_point] += (p_now.y - data.Y[this_stroke][this_point]) * 0.1
                }
            }
        }
        function hidePoint(this_stroke,this_point) {
            data.A[this_stroke][this_point] = 0;
            try { data.A[this_stroke][this_point+1] = 0; } catch (err) {}
            try { data.A[this_stroke][this_point-1] = 0; } catch (err) {}
        }
    })
    return module
},

smooth_color : function() {
    var module = new URNDR.Module("Smooth Color",URNDR.STROKE_MODULE,87,false);
    // 
    module.setConfiguration({ length: 50, factor: 30 , step: 1 })
    module.setFunction(function(STROKES) {
        var data = STROKES.data,
            settings = module.getConfiguration()
            a = STROKES.getActiveStroke(),
            eR = getLastNElements( data.R[a] , settings.length ),
            eG = getLastNElements( data.G[a] , settings.length ),
            eB = getLastNElements( data.B[a] , settings.length );
        // RGB mode
        SMOOTH_ARRAY( eR , { factor: settings.factor , step: settings.step , round : true });
        SMOOTH_ARRAY( eG , { factor: settings.factor , step: settings.step , round : true });
        SMOOTH_ARRAY( eB , { factor: settings.factor , step: settings.step , round : true });
        SMOOTH_ARRAY( data.A[STROKES.getActiveStroke()],settings.factor , { factor: settings.factor , step: settings.step });
        // Write
        data.R[a] = replaceLastElements( data.R[a] , eR )
        data.G[a] = replaceLastElements( data.G[a] , eG )
        data.B[a] = replaceLastElements( data.B[a] , eB )
        //
    })
    return module
},

fade_strokes : function() {
    var module = new URNDR.Module("",URNDR.STROKE_MODULE);
    // 
    module.name = "Strokes Fade";
    module.keyCode = 70; // f
    module.setConfiguration({
        all : true,
        length : 300,
        alpha_fade_length : 10,
        alpha_fade_step : 1
    })
    module.setFunction(function(STROKES) {
        var data = STROKES.data,
            settings = this.getConfiguration();
        if (counter % 2 !== 0 ) return false;
        if (settings.all) {
            var len = STROKES.getStrokesCount();
            for (var k = 0 ; k < len ; k ++) { fade( k , data , settings ) }
        } else {
            fade( STROKES.getActiveStroke() , data , settings )
        }
        function fade( k , data , settings ){
            for ( i in data ) {
                if ( data[i][k].length >= settings.length || k != STROKES.getActiveStroke() ) {
                    data[i][k].shift();
                    if (settings.alpha_fade_step && settings.alpha_fade_length) {
                        for (var j = 0 ; j < settings.alpha_fade_length ; j += settings.alpha_fade_step ) {
                            if (data.A[k][j] > 0.01) {data.A[k][j] *= 0.99; data.S[k][j] *= 0.999; } else {data.A[k][j] = 0;}
                        }
                    }
                }
            }
        }
    })
    return module
},

randomise_strokes : function() {
    var module = new URNDR.Module("Randomise Strokes",URNDR.STROKE_MODULE,90) // z
    module.setConfiguration({ amp : 5, all : true })
    module.setFunction(function(STROKES) {
        var data = STROKES.data,
            settings = module.getConfiguration()
        if (settings.all) {
            var len = STROKES.getStrokesCount();
            for (var k = 0 ; k < len ; k ++) {
                rnd_stroke( data.X[k] , settings.amp )
                rnd_stroke( data.Y[k] , settings.amp )
            }
        } else {
            var a = STROKES.getActiveStroke();
            rnd_stroke(data.X[a] , settings.amp );
            rnd_stroke(data.Y[a] , settings.amp );
            rnd_stroke(data.Z[a] , settings.amp );
            rnd_stroke(data.S[a] , settings.amp );
            // also randomise barycentric here -> -> -> -> -> -> -> -> ///
        }
        function rnd_stroke(arr , amp) {
            var l = arr.length;
            if (!amp) {amp = 10;}
            for ( i = 0 ; i < l ; i ++ ) {
                arr[i] += amp/2 - Math.random() * amp
            }
        }
    })
    return module
},

delete_strokes_out_of_boundary : function() {
    var module = new URNDR.Module("",URNDR.STROKE_MODULE);
    // 
    module.name = "Remove invisible points from strokes"
    module.enabled = true
    module.setFunction(function(STROKES) {
        var data = STROKES.data
        for (var stroke_n = 0 ; stroke_n < STROKES.getStrokesCount() ; stroke_n ++) {
            if ( STROKES.getStrokeLength(stroke_n) === 0) break;
            var this_stroke = STROKES.getStroke(stroke_n), condition = true;
            for ( var i = 0 ; i < STROKES.getStrokeLength(stroke_n) ; i++ ) {
                condition = condition && (this_stroke.X[i] < 0 || this_stroke.X[i] > CANVAS.width || this_stroke.Y[i] < 0 || this_stroke.Y[i] > CANVAS.height);
            }
            if (condition) { STROKES.deleteStroke(stroke_n); }
        }
    })
    return module
},

blow_strokes : function() {
    var module = new URNDR.Module("",URNDR.STROKE_MODULE);
    // 
    module.name = "Blow Strokes";
    module.keyCode = 71;
    module.setFunction(function(STROKES) {
        var data = STROKES.data;
        var max = data.X.length;
        for ( var i = 0 ; i < max ; i++ ) {
            blow(data.X[i]);
            blow(data.Y[i]);
        }
        function blow(arr,center,force) {
            var l = arr.length;
            if (!center) {
                center = 0;
                for ( var i = 0 ; i < l ; i ++ ) { center += arr[i]; }
                center /= l;
            }
            if (!force) {force = 0.01;}
            for ( i = 0 ; i < l ; i ++ ) {
                arr[i] += (arr[i] - center) * force
            }
        }
    })
    return module
},

// DRAW MODULES

connection_network : function(){
    var module = new URNDR.Module("",URNDR.DRAW_MODULE);
    // 
    module.name = "NETWORK";
    module.keyCode = 49; // 1
    module.setFunction(function(params){
        var data = params.strokes.data
        var ctx = params.context
        clear(1);
        var l,o,all;
            l = data.X.length;
            all = {X:new Array(),Y:new Array(),Z:new Array(),S:new Array(),R:new Array(),G:new Array(),B:new Array(),A:new Array()};
        for ( var k = 0 ; k < l ; k ++ ) {
            o = data.X[k].length;
            for ( var i = 1 ; i < o - 1 ; i += 1 ) {
                all.X.push( data.X[k][i] )
                all.Y.push( data.Y[k][i] )
                all.R.push( data.R[k][i] )
                all.G.push( data.G[k][i] )
                all.B.push( data.B[k][i] )
                all.A.push( data.A[k][i] )
            }
        }
        var all_length = all.X.length;
        ctx.lineWidth = 2;
        for ( var e = 0 ; e < all_length ; e+= 1 ) {
            for ( var f = 0 ; f < all_length ; f+= 1 ) {
                if (Math.abs(e-f) <= 1) continue;
                var max = all.S[e] * 1, 
                    min = all.S[e] / 7
                if ( Math.abs(all.X[e] - all.X[f]) < max && Math.abs(all.Y[e] - all.Y[f]) < max && Math.abs(all.X[e] - all.X[f]) > min && Math.abs(all.Y[e] - all.Y[f]) > min ) {
                    ctx.strokeStyle = 'rgba('+all.R[e]+','+all.G[e]+','+all.B[e]+','+all.A[e] +')'
                    ctx.beginPath();
                    ctx.moveTo(all.X[e],all.Y[e])
                    ctx.lineTo(all.X[f],all.Y[f])
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }

    })
    return module
},

fillmember_style : function() {
    var module = new URNDR.Module("",URNDR.DRAW_MODULE);
    // 
    module.name = "fillmember style"
    module.keyCode = 50; // 2
    module.setFunction(function(params){
        var data = params.strokes.data
        var ctx = params.context

        clear(1);
        
        var l,o;
            l = STROKES.getStrokesCount() - 1;
        for ( var k = 0 ; k <= l ; k++ ) {
            o = STROKES.getStrokeLength(k);
                ctx.strokeStyle= '#FFF';
            for ( var i = 1 ; i < o-1 ; i++ ) {
                if (data.A[k][i] !== 0) {
                    ctx.beginPath();
                    ctx.lineWidth = data.S[k][i] * 2;
                    ctx.moveTo(data.X[k][i-1],data.Y[k][i-1]);
                    ctx.lineTo(data.X[k][i],data.Y[k][i]);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
            for ( var i = 1 ; i < o-1 ; i++ ) {
                ctx.beginPath();
                    ctx.lineWidth = data.S[k][i];
                    ctx.strokeStyle= 'rgba('+data.R[k][i]+','+data.G[k][i]+','+data.B[k][i]+','+data.A[k][i]+')';
                ctx.moveTo(data.X[k][i-1],data.Y[k][i-1]);
                ctx.lineTo(data.X[k][i],data.Y[k][i]);
                    ctx.stroke();
                ctx.closePath();
            }
        }
    })
    return module
},

dot_debug_style : function() {
    var module = new URNDR.Module("",URNDR.DRAW_MODULE);
    // 
    module.name = "debug draw mode"
    module.keyCode = 51
    module.setFunction(function(params){
        var data = params.strokes.data
        var ctx = params.context
        clear(.8);

        MESH.rotation.y += PEN.ndc_x * 0.05;
        MESH.rotation.x -= PEN.ndc_y * 0.05;
        var l,o;
            l = STROKES.getStrokesCount() - 1;
                ctx.lineWidth = 2;
        for ( var k = 0 ; k <= l ; k++ ) {
            o = STROKES.getStrokeLength(k);
            for ( var i = 1 ; i < o-1 ; i++ ) {
                ctx.strokeStyle= 'rgba('+data.R[k][i]+','+data.G[k][i]+','+data.B[k][i]+','+data.A[k][i]+')';
                ctx.beginPath();
                ctx.moveTo(data.X[k][i]-0.001,data.Y[k][i]-0.001);
                ctx.lineTo(data.X[k][i],data.Y[k][i]);
                ctx.stroke();
                ctx.closePath();
            }
        }
    })
    return module
},

default_draw_style : function() {
    var module = new URNDR.Module("Default Draw Style",URNDR.DRAW_MODULE,48,true);
    module.setFunction(function(params){
        var data = params.strokes.data
        var ctx = params.context
        // default drawing style
        clear(1);
        MESH.rotation.y += 0.000;
        var l,o;
            l = STROKES.getStrokesCount() - 1;
        for ( var k = 0 ; k <= l ; k++ ) {
            o = STROKES.getStrokeLength(k);
            for ( var i = 1 ; i < o-1 ; i++ ) {
                ctx.lineWidth = data.S[k][i];
                ctx.strokeStyle= 'rgba('+data.R[k][i]+','+data.G[k][i]+','+data.B[k][i]+','+data.A[k][i]+')';
                ctx.beginPath();
                ctx.moveTo(data.X[k][i-1],data.Y[k][i-1]);
                ctx.lineTo(data.X[k][i],data.Y[k][i]);
                ctx.stroke();
                ctx.closePath();
            }
        }
    })
    return module
}

} );

//
// HELPER FUNCTIONS
//

function replaceLastElements(arr,rep) {
    var l = arr.length, n = rep.length;
    if ( l <= n ) {
        arr = rep.slice( 0 , l );
    } else {
        arr = arr.slice( 0 , l - n ).concat(rep);
    }
    return arr;
}

function getLastNElements(arr,n) {
    if (n > arr.length) {return Object.create(arr);}
    return arr.slice( - n );
}

function SMOOTH_ARRAY(arr,params) {
    var l = arr.length;
    if (!params.factor) {params.factor = 8}
    if (!params.step) {params.step = 1}
    for ( var i = 1 ; i < l - 1 ; i += params.step ) {
        arr[i] = (arr[i-1] + arr[i] * params.factor + arr[i+1]) / (params.factor + 2);
        if (params.round) { arr[i] = Math.round(arr[i]); }
    }
}

function RANDOM_NUMBER(number,params) {
    var result;
        result = number * Math.random();
    if (params) {
        if (params.round) result = Math.round(result);
    }
    return result
}