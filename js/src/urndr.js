var URNDR = {REVISION:'2'}

URNDR.Math = {
	generateUUID: function () {

		// http://www.broofa.com/Tools/Math.uuid.htm

		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split( '' );
		var uuid = new Array( 36 );
		var rnd = 0, r;

		return function () {

			for ( var i = 0; i < 36; i ++ ) {

				if ( i == 8 || i == 13 || i == 18 || i == 23 ) {

					uuid[ i ] = '-';

				} else if ( i == 14 ) {

					uuid[ i ] = '4';

				} else {

					if ( rnd <= 0x02 ) rnd = 0x2000000 + ( Math.random() * 0x1000000 ) | 0;
					r = rnd & 0xf;
					rnd = rnd >> 4;
					uuid[ i ] = chars[ ( i == 19 ) ? ( r & 0x3 ) | 0x8 : r ];

				}
			}

			return uuid.join( '' );

		};

	}(),

	coordinateToPixel: function() {
		
		return function( x , y ) {

			return {

				x:  ( x / 2 + 0.5 ) * window.innerWidth
				y: -( y / 2 - 0.5 ) * window.innerHeight

			}

		}

	}
}

URNDR.Strokes = function(){

	this.strokes = new Array();

}

URNDR.Stroke = function(){

	this.points = new Array();
	// Methods
	this.getPoint = function( point_n ) { return this.points[point_n] }
	this.addPoint = function( point ) {
		if (point instanceof Point) {
			throw("the point added must be a Point Object")
		}
		this.points.push(point)
	}

}

URNDR.Stroke.prototype = {

	constructor: URNDR.Stroke,

	getPoint: function ( point_n ) {

		return this.points[point_n]

	},

	setPoint: function ( point ) {

		if (point instanceof URNDR.Point) {

			this.points.push(point)

		} else {

			throw("the point added must be a Point object. ")

		}

	}

}

URNDR.Point = function(){
	// dot position
	this.X = new Array();
	this.Y = new Array();
	// size
	this.S = new Array();
	// color
	this.R = new Array();
	this.G = new Array();
	this.B = new Array();
	this.A = new Array();
	// binding
	this.BindedObject = new Array();
	this.BindedFace = new Array();
	this.Barycentric = new Array();
	// Effect
	this.EffectData = new Array();
}