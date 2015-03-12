// change styling before store style into lines
// only called when pen is down and drawing.
function style() {
	PAPER.lineCap = STYLE.cap
	PAPER.lineJoin = STYLE.join
	MODULES.runEnabledModulesInList("style_modules", STYLE)
}

// add data & play with data in the strokes.
// this is going to be a constant running function.
function update() {
	// ## When pen is not active and bae still run this function...
	if ( ! PEN.isDown || arguments[0] === 0) {
		MODULES.runEnabledModulesInList("stroke_data_modules", STROKES.data)
		return 0;
	}
	var point = new Object();
		point.X = PEN.x
		point.Y = PEN.y
		point.S = STYLE.brush_size,
		point.R = STYLE.color.r
		point.G = STYLE.color.g
		point.B = STYLE.color.b
		point.A = STYLE.color.a
	//// EXPERIMENTAL
	var penNDC = new THREE.Vector2( PEN.ndc_x , PEN.ndc_y )
	RAYCASTER.setFromCamera( penNDC , CAMERA )
	var intersects = RAYCASTER.intersectObjects( SCENE.children );
	if (intersects.length > 0) {
		var i0, a, b, c
			i0 = intersects[0]
		point.BindedObject = i0.object
		point.BindedFace = i0.face
		a = i0.object.localToWorld( i0.object.geometry.vertices[i0.face.a].clone() ).project(CAMERA)
		b = i0.object.localToWorld( i0.object.geometry.vertices[i0.face.b].clone() ).project(CAMERA)
		c = i0.object.localToWorld( i0.object.geometry.vertices[i0.face.c].clone() ).project(CAMERA)
		point.Barycentric = Barycentric( penNDC , a, b, c )
	}
	MODULES.runEnabledModulesInList( "point_data_modules", point )
	// WRITE POINT INTO STROKE
	STROKES.addNewPointInStroke( STROKES.active_stroke , point );
}

// iterate through strokes and draw everything
// this is going to be a constant running function.
function draw() {
	// RENDER
	RENDERER.render(SCENE,CAMERA)

	// RUN DRAW MODULES
	MODULES.runEnabledModulesInList("draw_modules", STROKES.data )

}