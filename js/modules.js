MODULES.loadAllModules( {

// COMMANDS

reload_web_page : function() {
	this.type = "command"
	this.id = "reload"
	this.name = "Reload Web Page"
	this.keyCode = 13 //enter
	this.func = function() { window.location.reload(); return ""; }
},

clear_canvas : function() {
	this.type = "command"
	this.id   = "clear_canvas"
	this.name = "Clear Canvas"
	this.keyCode = 32 // delete
	this.func = function(){ clear(1); STROKES = new _strokes(); return ""; }
},

brush_size_up : function() {
	this.type = "command";
	this.id = "brush_size_up";
	this.name = "Increase brush size";
	this.keyCode = 221; // ]
	this.func = function(){ STYLE.brush_size += 5; return STYLE.brush_size; }
},

brush_size_down : function() {
	this.type = "command";
	this.id = "brush_size_down";
	this.name = "Reduce brush size";
	this.keyCode = 219; // [
	this.func = function(){ if (STYLE.brush_size > 5) {STYLE.brush_size -= 5;} return STYLE.brush_size;}
},

simplified_all_strokes : function() {
	this.type = "command",
	this.id   = "simplify_strokes"
	this.name = "Strokes Simplified"
	this.keyCode = 81
	this.func = function() {
		var simp_count = 0, s;
		for( var k = 0 ; k < STROKES.getStrokesCount() ; k ++ ) { s = STROKES.getStroke(k); }
		return "Points deleted: " + simp_count;
	}
},

// STYLE MODULES
// none at the moment

random_stroke_color : function() {
	this.type = "style"
	this.id = "random_stroke_color"
	this.name = "Random Stroke Color"
	this.keyCode = 65 // a
	this.func = function() {
		STYLE.color.r = RANDOM_NUMBER(255,{round: true});
		STYLE.color.g = RANDOM_NUMBER(255,{round: true});
		STYLE.color.b = RANDOM_NUMBER(255,{round: true});
	}
},

// POINT DATA MODULES


random_point_position : function() {
	this.type = "point_data"
	this.id   = "random_point_position"
	this.name = "Random Point"
	this.settings = {
		amp : 60
	}
	this.keyCode = 68
	this.func = function( p ) {
		var amp = this.settings.amp;
		p.X += amp/2 - RANDOM_NUMBER(amp);
		p.Y += amp/2 - RANDOM_NUMBER(amp);
	}
},

pressure_sensitivity : function() {
	this.type = "point_data"
	this.id   = "brush_pressure_sensitivity"
	this.name = "Brush size effected by pen pressure"
	this.enabled = false
	this.func = function(point) {
		point.S *= PEN.pressure;
	}
},

// STROKE DATA MODULES

smooth_stroke : function() {
	this.type = "stroke_data";
	this.id   = "smooth_stroke";
	this.name = "Smooth Stroke";
	this.enabled = true;
	this.settings = { length: 30000, factor: 0 , all : true }
	this.keyCode  = 83; // s
	this.func = function(data) {
		if (this.settings.all) {
			var len = STROKES.getStrokesCount();
			for (var k = 0 ; k < len ; k ++) { smoothie( k , data , this.settings ) }
		} else {
			smoothie( STROKES.getActiveStroke() , data , this.settings )
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
	}
},

translate_3d : function() {
	this.type = "stroke_data";
	this.id   = "translate_experiment_01"
	this.name = "Magic 001"
	this.enabled = true;
	this.settings = {};
	this.keyCode = 85 //u
	this.func = function(data) {
		var obj,face,p3d,newp,delta,len;
			len = STROKES.getStrokesCount();
		for (var this_stroke = 0 ; this_stroke < len ; this_stroke ++) {
			if (STROKES.getActiveStroke() === this_stroke) {break;}
			len_p = STROKES.getStrokeLength(this_stroke);
			for (var this_point = 0 ; this_point < len_p ; this_point++) {
				obj = data.BindedObject[this_stroke][this_point];
				face = data.BindedFace[this_stroke][this_point];
				p3d = data.BindedPoint[this_stroke][this_point];
				if (obj && face && p3d) {
					newp = obj.localToWorld( obj.geometry.vertices[face.a].clone() ).project(CAMERA);
					//
					opp = {
						x: ( p3d.x / 2 + 0.5 ) * window.innerWidth,
						y: -( p3d.y / 2 - 0.5 ) * window.innerHeight
					}
					npp = {
						x: ( newp.x / 2 + 0.5 ) * window.innerWidth,
						y: -( newp.y / 2 - 0.5 ) * window.innerHeight
					}
					data.X[this_stroke][this_point] += npp.x-opp.x 
					data.Y[this_stroke][this_point] += npp.y-opp.y
					// store data back to data.
					data.BindedPoint[this_stroke][this_point] = newp.clone();
				} else {
					// data.X[this_stroke][this_point]
				}
			}
		}
	}
},

smooth_color : function() {
	this.type = "stroke_data";
	this.id   = "smooth_color";
	this.name = "Smooth Color";
	this.settings = { length: 50, factor: 30 , step: 1 };
	this.keyCode = 87;
	this.func = function(data) {
		var a = STROKES.getActiveStroke(),
			eR = getLastNElements( data.R[a] , this.settings.length ),
			eG = getLastNElements( data.G[a] , this.settings.length ),
			eB = getLastNElements( data.B[a] , this.settings.length );
		// RGB mode
		SMOOTH_ARRAY( eR , { factor: this.settings.factor , step: this.settings.step , round : true });
		SMOOTH_ARRAY( eG , { factor: this.settings.factor , step: this.settings.step , round : true });
		SMOOTH_ARRAY( eB , { factor: this.settings.factor , step: this.settings.step , round : true });
		SMOOTH_ARRAY( data.A[STROKES.getActiveStroke()],this.settings.factor , { factor: this.settings.factor , step: this.settings.step });
		// Write
		data.R[a] = replaceLastElements( data.R[a] , eR )
		data.G[a] = replaceLastElements( data.G[a] , eG )
		data.B[a] = replaceLastElements( data.B[a] , eB )
		//
	};
},

fade_strokes : function() {
	this.type = "stroke_data";
	this.id = "fade_strokes";
	this.name = "Strokes Fade";
	this.keyCode = 70; // f
	this.settings = {
		all : true,
		length : 300,
		alpha_fade_length : 30,
		alpha_fade_step : 1
	}
	this.func = function(data) {
		if (this.settings.all) {
			var len = STROKES.getStrokesCount();
			for (var k = 0 ; k < len ; k ++) { fade( k , data , this.settings ) }
		} else {
			fade( STROKES.getActiveStroke() , data , this.settings )
		}
		function fade( k , data , settings ){
			for ( i in data ) {
				if ( data[i][k].length >= settings.length || k != STROKES.getActiveStroke() ) {
					data[i][k].shift();
					if (settings.alpha_fade_step && settings.alpha_fade_length) {
						for (var j = 0 ; j < settings.alpha_fade_length ; j += settings.alpha_fade_step ) {
							if (data.A[k][j] > 0.01) {data.A[k][j] *= 0.98; data.S[k][j] *= 0.999; } else {data.A[k][j] = 0;}
						}
					}
				}
			}
		}
	}
},

randomise_strokes : function() {
	this.type = "stroke_data"
	this.id = "randomise_strokes"
	this.name = "Randomise Strokes"
	this.keyCode = 90 // z
	this.settings= { amp : 5, all : true }
	this.func = function(data) {
		if (this.settings.all) {
			var len = STROKES.getStrokesCount();
			for (var k = 0 ; k < len ; k ++) {
				rnd_stroke( data.X[k] , this.settings.amp )
				rnd_stroke( data.Y[k] , this.settings.amp )
			}
		} else {
			var a = STROKES.getActiveStroke();
			rnd_stroke(data.X[a] , this.settings.amp );
			rnd_stroke(data.Y[a] , this.settings.amp );
			rnd_stroke(data.Z[a] , this.settings.amp );
			rnd_stroke(data.S[a] , this.settings.amp );
		}
		function rnd_stroke(arr , amp) {
			var l = arr.length;
			if (!amp) {amp = 10;}
			for ( i = 0 ; i < l ; i ++ ) {
				arr[i] += amp/2 - Math.random() * amp
			}
		}
	}
},

delete_strokes_out_of_boundary : function() {
	this.type = "stroke_data"
	this.id   = "delete_points_out_of_boundary"
	this.name = "Remove invisible points from strokes"
	this.enabled = true
	this.func = function(data) {
		for (var stroke_n = 0 ; stroke_n < STROKES.getStrokesCount() ; stroke_n ++) {
			if ( STROKES.getStrokeLength(stroke_n) === 0) break;
			var this_stroke = STROKES.getStroke(stroke_n), condition = true;
			for ( var i = 0 ; i < STROKES.getStrokeLength(stroke_n) ; i++ ) {
				condition = condition && (this_stroke.X[i] < 0 || this_stroke.X[i] > CANVAS.width || this_stroke.Y[i] < 0 || this_stroke.Y[i] > CANVAS.height);
			}
			if (condition) { STROKES.deleteStroke(stroke_n); }
		}
	}
},

blow_strokes : function() {
	this.type = "stroke_data";
	this.id = "blow_strokes";
	this.name = "Blow Strokes";
	this.keyCode = 71;
	this.func = function(data) {
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
	}
},

// DRAW MODULES

connection_network : function(){
	this.type = "draw";
	this.id = "network_connection";
	this.name = "NETWORK";
	this.keyCode = 49; // 1
	this.func = function(data){
		// clear(1);
		var l,o,all;
			l = data.X.length;
			all = {X:new Array(),Y:new Array(),Z:new Array(),S:new Array(),R:new Array(),G:new Array(),B:new Array(),A:new Array()};
		for ( var k = 0 ; k < l ; k ++ ) {
			o = data.X[k].length;
			for ( var i = 1 ; i < o - 1 ; i += 1 ) {
				all.X.push( data.X[k][i] )
				all.Y.push( data.Y[k][i] )
				all.Z.push( data.Z[k][i] )
				all.S.push( data.S[k][i] )
				all.R.push( data.R[k][i] )
				all.G.push( data.G[k][i] )
				all.B.push( data.B[k][i] )
				all.A.push( data.A[k][i] )
			}
		}
		var all_length = all.X.length;
		for ( var e = 0 ; e < all_length ; e+= 1 ) {
			for ( var f = 0 ; f < all_length ; f+= 1 ) {
				if (e === f) { break ; }
				if ( Math.abs(e-f) < 1 ) { break ; }
				var max = all.S[e] * 1,
					min = all.S[e] / 7
				if ( Math.abs(all.X[e] - all.X[f]) < max && Math.abs(all.Y[e] - all.Y[f]) < max && Math.abs(all.X[e] - all.X[f]) > min && Math.abs(all.Y[e] - all.Y[f]) > min ) {
					PAPER.lineWidth = Math.min( all.S[e] , 2 )
					PAPER.strokeStyle = 'rgba('+all.R[e]+','+all.G[e]+','+all.B[e]+','+all.A[e] +')'
					PAPER.beginPath();
					PAPER.moveTo(all.X[e],all.Y[e])
					PAPER.lineTo(all.X[f],all.Y[f])
					PAPER.stroke();
					PAPER.closePath();
				}
			}
		}

	}
},

fillmember_style : function() {
	this.type = "draw"
	this.id   = "fillmember_style"
	this.name = "fillmember style"
	this.keyCode = 50; // 2
	this.func = function(data) {
		// clear(1);
		var l,o;
			l = STROKES.getStrokesCount() - 1;
		for ( var k = 0 ; k <= l ; k++ ) {
			o = STROKES.getStrokeLength(k);
				PAPER.strokeStyle= '#FFF';
			for ( var i = 1 ; i < o-1 ; i++ ) {
				PAPER.beginPath();
					PAPER.lineWidth = data.S[k][i] * 2;
				PAPER.moveTo(data.X[k][i-1],data.Y[k][i-1]);
				PAPER.lineTo(data.X[k][i],data.Y[k][i]);
					PAPER.stroke();
				PAPER.closePath();
			}
			for ( var i = 1 ; i < o-1 ; i++ ) {
				PAPER.beginPath();
					PAPER.lineWidth = data.S[k][i];
					PAPER.strokeStyle= 'rgba('+data.R[k][i]+','+data.G[k][i]+','+data.B[k][i]+','+data.A[k][i]+')';
				PAPER.moveTo(data.X[k][i-1],data.Y[k][i-1]);
				PAPER.lineTo(data.X[k][i],data.Y[k][i]);
					PAPER.stroke();
				PAPER.closePath();
			}
		}
	}
},

default_draw_style : function() {
	this.type = "draw"
	this.id   = "default_draw_style"
	this.name = "default draw"
	this.keyCode = 48
	this.enabled = true
	this.func = function(data){
		// default drawing style
		// clear(1);
		var l,o;
			l = STROKES.getStrokesCount() - 1;
		for ( var k = 0 ; k <= l ; k++ ) {
			o = STROKES.getStrokeLength(k);
			for ( var i = 1 ; i < o-1 ; i++ ) {
				PAPER.lineWidth = data.S[k][i];
				PAPER.strokeStyle= 'rgba('+data.R[k][i]+','+data.G[k][i]+','+data.B[k][i]+','+data.A[k][i]+')';
				PAPER.beginPath();
				PAPER.moveTo(data.X[k][i-1],data.Y[k][i-1]);
				PAPER.lineTo(data.X[k][i],data.Y[k][i]);
				PAPER.stroke();
				PAPER.closePath();
			}
		}
	}
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
	return result;
}