lib = 

	pixelToCoordinate: (x,y,w,h) ->
		return
			x : THREE.Math.mapLinear x , 0 , w , -1 ,  1
			y : THREE.Math.mapLinear y , 0 , h ,  1 , -1

	coordinateToPixel: (x,y,w,h) ->
		return
			x : ( x * 0.5 + 0.5 ) *  w
			y : ( y * 0.5 - 0.5 ) * -h

	getBarycentricCoordinate: (p,a,b,c) ->
		v0 = new THREE.Vector2 b.x-a.x , b.y-a.y
		v1 = new THREE.Vector2 c.x-a.x , c.y-a.y
		v2 = new THREE.Vector2 p.x-a.x , p.y-a.y
		d00 = v0.dot v0
		d01 = v0.dot v1
		d11 = v1.dot v1
		d20 = v2.dot v0
		d21 = v2.dot v1
		denom = 1 / ( d00 * d11 - d01 * d01 )
		v = ( d11 * d20 - d01 * d21 ) * denom
		w = ( d00 * d21 - d01 * d20 ) * denom
		u = 1 - v - w
		return [ u , v , w ]

	random: (n=1,p) ->
		result = n * Math.random()
		if p?
			if p.round? then result = Math.round result
		return result

module.export = lib