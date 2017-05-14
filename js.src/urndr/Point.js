import THREE from 'three.js'
import _Math from './math/math'

export default class Point {

    constructor ( input ) {

        this.parent = undefined;

        // Size
        this.X = -100;
        this.Y = -100;
        this.S = 0;

        // Color
        this.R = 0;
        this.G = 0;
        this.B = 0;
        this.A = 0;

        // 3D Binding Related
        this.OBJECT = null;
        this.FACE = null;
        this.BU = 1;
        this.BV = 0;
        this.BW = 0;

        // Potential movement
        this.PX = 0;
        this.PY = 0;

        this.updatePoint(input);
    }

    get ndc() {

        var w, h;
        //  Stroke         Strokes
        if (this.parent && this.parent.parent) {
            w = this.parent.parent.bound.width;
            h = this.parent.parent.bound.height;
        } else {
            w = window.innerWidth;
            h = window.innerHeight;
        }

        var a = _Math.pixelToCoordinate( this.X , this.Y , w , h )
        return new THREE.Vector2(a.x,a.y)
    }
    get bound() {
        return (this.OBJECT && this.FACE) ? true : false;
    }
    set bound( input ) {
        if (input === false) {
            this.OBJECT = null;
            this.FACE = null;
            this.BU = 0;
            this.BV = 0;
            this.BW = 0;
            this.PX = 0;
            this.PY = 0;
        } else {
            // do nothing because that doesn't make sense.
        }
    }
    // For compatibility with THREE... etc
    get x() { return this.X }
    get y() { return this.Y }
    set x(v) { this.X = v }
    set y(v) { this.Y = v }
    distanceToSquared ( pnt ) {

        var dx = this.X - pnt.X, dy = this.Y - pnt.Y;
        return dx * dx + dy * dy;

    }
    distanceTo ( pnt ) {

        return Math.sqrt( this.distanceToSquared( pnt ) );

    }
    updatePoint ( input ) {

        for (var key in input) {
            if ( this.hasOwnProperty( key ) ) {
                this[key] = input[key];
            }
        }

    }
    refreshBinding ( threeManager ) {

        threeManager.raycaster.setFromCamera( new THREE.Vector2( this.ndc.x , this.ndc.y ) , threeManager.camera )

        var intersects_raw = threeManager.raycaster.intersectObjects( threeManager.scene.children )
        var intersects = [];
        intersects_raw.forEach(function(o){
            if (o.object.visible) {
                intersects.push(o);
            }
        })
        if (intersects.length > 0) {

            var obj = intersects[0].object, face = intersects[0].face;

            var a = obj.localToWorld( obj.getMorphedVertex( face.a ) ).project( threeManager.camera ),
                b = obj.localToWorld( obj.getMorphedVertex( face.b ) ).project( threeManager.camera ),
                c = obj.localToWorld( obj.getMorphedVertex( face.c ) ).project( threeManager.camera ),
                bary = _Math.getBarycentricCoordinate( this.ndc , a , b , c );

            this.OBJECT = obj;
            this.FACE = face;
            this.BU = bary[0]
            this.BV = bary[1]
            this.BW = bary[2]

        } else {

            this.bound = false;

        }

    }
    destroy() {
        this.parent = null
        this.X = null
        this.Y = null
        this.S = null
        this.R = null
        this.G = null
        this.B = null
        this.A = null
        this.OBJECT = null
        this.FACE = null
        this.BU = null
        this.BV = null
        this.BW = null
        this.PX = null
        this.PY = null
    }
}
