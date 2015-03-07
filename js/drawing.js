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
		point.Z = 0
		point.S = STYLE.brush_size,
		point.R = STYLE.color.r
		point.G = STYLE.color.g
		point.B = STYLE.color.b
		point.A = STYLE.color.a
	//// EXPERIMENTAL
	RAYCASTER.setFromCamera( new THREE.Vector2( PEN.ndc_x , PEN.ndc_y ) , CAMERA );
	var intersects = RAYCASTER.intersectObjects( SCENE.children );
	if (intersects.length > 0) {
		var target = intersects[0],
			obj = target.object,
			geo = obj.geometry,
			a = target.face.a;
		target.face.color.setRGB(1,0,0)
		// console.log(geo.faces[target.faceIndex].color)
		// geo.faces[target.faceIndex].color.setRGB(0,0,1)
		// geo.dynamic = true;
		// geo.elementsNeedUpdate = true;
		geo.colorsNeedUpdate = true;
		// console.log(geo.colors[a])
	}
	MODULES.runEnabledModulesInList( "point_data_modules", point )
	// WRITE POINT INTO STROKE
	STROKES.addNewPointInStroke( STROKES.active_stroke , point );
}

// iterate through strokes and draw everything
// this is going to be a constant running function.
function draw() {
	
	clear();

	// cube test
	MESH.rotation.y += 0.001;
	MESH.updateMatrixWorld();
	// MESH.rotation.x = PEN.ndc_x

	// RENDER
	RENDERER.render(SCENE,CAMERA)

	// RUN DRAW MODULES
	MODULES.runEnabledModulesInList("draw_modules", STROKES.data )

}