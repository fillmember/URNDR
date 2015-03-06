document.addEventListener( 'mousemove', onDocumentMouseMove, false );
function onDocumentMouseMove( event ) {
	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


////

raycaster = new THREE.Raycaster();

/* ... */

raycaster.setFromCamera( mouse, camera );

var intersects = raycaster.intersectObjects( scene.children );

if ( intersects.length > 0 ) {

	if ( INTERSECTED != intersects[ 0 ].object ) {

		if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

		INTERSECTED = intersects[ 0 ].object;
		INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
		INTERSECTED.material.emissive.setHex( 0xff0000 );

	}

} else {

	if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

	INTERSECTED = null;

}

// raycaster.intersectObjects( target_group ) returns...
// 
// an array, the closet to camera is intersects[0]
// 
// ATTRIBUTES:
// distance – distance between the origin of the ray and the intersection
// point – point of intersection, in world coordinates
// face – intersected face
// faceIndex – index of the intersected face
// indices – indices of vertices comprising the intersected face
// object – the intersected object


if (PEN.active === true) {
	// BIND STROKE POINT latest one TO 3D MESH
}