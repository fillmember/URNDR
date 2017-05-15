import THREE from './three.js'
import MathUtil from './math/math'

export default class Model {
    constructor ( args ) {

        this.id = "MODEL-" + MathUtil.uuid();
        this.name = "";

        // Animation Attributes
        this.tags = {};

        // THREE JSONLoader related attributes
        this.file_path = "";
        this.loader = new THREE.JSONLoader();

        // THREE.js Objects
        this.mesh = undefined;
        this.geometry = undefined;
        this.material = args.material;
        this.animation = {play:function(){},stop:function(){},pause:function(){},update:function(){}};

        // Behaviours
        this.init = args.init || function(){};
        this.onfocus = args.onfocus || function(){};
        this.onblur = args.onblur || function(){};
        this.onframe = args.onframe || function(){};

    }

    get active () {
        if (this.mesh) {
            return this.mesh.visible;
        } else {
            return false;
        }
    }
    set active (value) {
        var original = null;
        if (this.mesh) {
            original = this.mesh.visible;
            this.mesh.visible = value;
        } else {
            this._active = value;
        }
        if (original !== null && original !== value) {
            if (value) {
                this.onfocus(this);
            } else {
                this.onblur(this);
            }
        }
    }
    loadModel ( file_path, callback ){

        this.file_path = file_path
        this.loader.load( this.file_path, ( _geometry, _material ) => {

            // Loaded
            this.geometry = _geometry;
            if (_material) { this.material = _material; }

            this.mesh = new THREE.Mesh( this.geometry, this.material )

            // UNLOCK
            if (this._active !== undefined) {
                this.active = this._active;
                delete this._active;
            } else {
                this.active = true;
            }

            this.init( this );

            this.onfocus( this );

            // CALLBACK
            callback( this );

        });

    }
    update ( speed ) {

        if (this.active) {
            if (this.animation) {
                this.animation.update( speed )
            }
        }

    }
}
