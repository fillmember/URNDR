export default class Model {
    constructor ( args ) {

        this.id = "MODEL-" + THREE.Math.generateUUID();
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
                this.onfocus();
            } else {
                this.onblur();
            }
        }
    }
    loadModel ( file_path, callback ){

        this.file_path = file_path

        var model = this;
        this.loader.load( this.file_path, function( _geometry, _material ) {

            // Loaded
            model.geometry = _geometry;
            if (_material) { model.material = _material; }

            model.mesh = new THREE.Mesh( model.geometry, model.material )

            // UNLOCK
            if (model._active !== undefined) {
                model.active = model._active;
                delete model._active;
            } else {
                model.active = true;
            }

            model.init( model );

            model.onfocus();

            // CALLBACK
            callback( model );

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
