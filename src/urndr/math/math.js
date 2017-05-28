import THREE from './../three.js'

export default {

    map: function ( x, a1, a2, b1, b2 ) {

        return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

    },

    clamp: function ( value, min, max ) {

        return Math.max( min, Math.min( max, value ) );

    },

    uuid: () => {

        const s4 = () => {

            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)

        }

        return s4() + '-' + s4() + '-' + s4() + '-' + s4()

    },

    pixelToCoordinate: function( x , y , w , h ) {
        return {
            x : THREE.Math.mapLinear( x , 0 , w , -1 , 1 ),
            y : THREE.Math.mapLinear( y , 0 , h , 1 ,-1 )
        };
    },

    coordinateToPixel : function( x , y , w , h ) {
        return {
            x :  ( x / 2 + 0.5) * w,
            y : -( y / 2 - 0.5) * h
        };
    },

    // Compute barycentric coordinates (u,v,w) for point p with respect to triangle (a,b,c)
    getBarycentricCoordinate : function( p , a , b , c ) {
        var v0,v1,v2,d00,d01,d11,d20,d21,denom,u,v,w;
            v0 = new THREE.Vector2(b.x-a.x,b.y-a.y);
            v1 = new THREE.Vector2(c.x-a.x,c.y-a.y);
            v2 = new THREE.Vector2(p.x-a.x,p.y-a.y);
        d00 = v0.dot(v0);
        d01 = v0.dot(v1);
        d11 = v1.dot(v1);
        d20 = v2.dot(v0);
        d21 = v2.dot(v1);
        denom = 1 / (d00 * d11 - d01 * d01);
        v = (d11 * d20 - d01 * d21) * denom;
        w = (d00 * d21 - d01 * d20) * denom;
        u = 1 - v - w;
        return [u,v,w];
    },

    random : function(number,params) {

        if (!number) { number = 1; }

        var result = number * Math.random();

        if (params) {
            if (params.round) result = Math.round(result);
        }

        return result

    }

}
