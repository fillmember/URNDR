import THREE from './../three.js'

export default {

	getMorphedVertex ( obj , vertex_index ) {

    const geo = obj.geometry
    const flu = obj.morphTargetInfluences

    if ( flu && geo.morphTargets ) {

        if (geo.morphTargets.length > 0) {

            let result = new THREE.Vector3(),
                sum = 0;

            for ( let i = 0, max = geo.morphTargets.length; i < max; i ++ ) {
                const vert = geo.morphTargets[ i ].vertices[ vertex_index ];
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

	},

	checkVisibility ( cam , obj , face ) {

		if (obj.visible === false) { return 0 }

		const nm = new THREE.Matrix3().getNormalMatrix( obj.matrixWorld )
		const n = face.normal.clone().applyMatrix3( nm ).negate()
		const lookAtVector = new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion)

		return THREE.Math.clamp(
			THREE.Math.mapLinear(
				lookAtVector.angleTo(n) , 1.2 , 1.4 , 1 , 0
			) , 0 , 1
		)

	},

	stopMorphAnimation (ma) {

		ma.pause()
		ma.currentFrame = 1;
        ma.currentTime = 0;
        for ( var a = 0; a < ma.frames; a ++ ) {
            ma.mesh.morphTargetInfluences[a] = 0;
        }
        ma.mesh.morphTargetInfluences[0] = 1;

	}

}
