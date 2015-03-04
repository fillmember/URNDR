// change styling before store style into lines
// only called when pen is down and drawing.
function style() {
	PAPER.lineCap = STYLE.cap;
	PAPER.lineJoin = STYLE.join;
	MODULES.runEnabledModulesInList("style_modules", STYLE)
}

// add data & play with data in the strokes.
// this is going to be a constant running function.
function update() {
	// ## When pen is not active and bae still run this function...
	if ( ! PEN.active || arguments[0] === 0) {
		MODULES.runEnabledModulesInList("stroke_data_modules", STROKES.data)
		return 0;
	}
	// ## When yo draw and this function will do this:
	var point = {
		X : PEN.x,
		Y : PEN.y,
		Z : 0,
		S : STYLE.brush_size,
		//
		R : STYLE.color.r,
		G : STYLE.color.g,
		B : STYLE.color.b,
		A : STYLE.color.a
	}
	MODULES.runEnabledModulesInList( "point_data_modules", point )
	// WRITE POINT INTO STROKE
	STROKES.addNewPointInStroke( STROKES.active_stroke , point );
}

// iterate through strokes and draw everything
// this is going to be a constant running function.
function draw() {
	// RUN DRAW MODULES
	MODULES.runEnabledModulesInList("draw_modules", STROKES.data )
}