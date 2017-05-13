import THREE from 'three.js'
import Model from './Model.js'

const PI2 = Math.PI * 2

export default class ThreeManager {
    constructor ( arg ) {

        // Storage
        this.models = {}
        this.models_array = []
        this.activeModel = 0;

        // THREE
        this.renderer = new THREE.WebGLRenderer({
            canvas: arg.canvas,
            precision: "lowp",
            alpha: true
        })
        this.renderer.setPixelRatio(2)
        this.camera = new THREE.PerspectiveCamera( 75, 1, 1, 500)
        this.scene = new THREE.Scene();
        if (arg.fog) { this.scene.fog = arg.fog }
        this.raycaster = new THREE.Raycaster();

        this.material = arg.material || new THREE.MeshBasicMaterial({
            morphTargets: true,color: 0x0000CC
        })
        this.material.index0AttributeName = "position";

        // controls
        this.rig = {
            radius: 5,
            target_radius: 5,
            theta : 0,
            target_theta : 0,
            pitch : 0,
            target_pitch : 0,
            speed : 0.1,
            focus : new THREE.Vector3(0,0,0),
            _focus : new THREE.Vector3(0,0,0)
        }
        this.speed = 15;

        this.camera.position.set( 0 , 0 , 5 )

    }

    get count() {
        return this.models_array.length;
    }
    createModelFromFile ( file_path, args ) {

        // Arguments
        args.material = args.material || this.material;

        var model = new Model( args );
        this.addModel( model )
        // Load
        model.loadModel( file_path , () => {
            this.scene.add( model.mesh );
        } );

    }
    addModel ( model ) {

        model.parent = this;
        this.models[ model.id ] = model;
        this.models_array.push( model.id );

    }
    getModel ( input ) {

        if (typeof input === "string") {
            // search by id
            if ( this.models.hasOwnProperty( input ) ) {
                return this.models[ input ];
            } else {
                return -1;
            }
        } else if (typeof input === "number") {
            // search by index
            if (input >= 0 && input < this.models_array.length) {
                return this.getModel( this.models_array[input] );
            } else {
                return -1;
            }
        } else {
            // return latest one
            return this.getModel( this.count - 1 );
        }

    }
    eachModel ( my_function , parameters ) {

        for( var i in this.models ){
            my_function( this.getModel(i) , parameters, i)
        }

    }
    solo ( n ){
        var manager = this;
        if (typeof n === "number") {
            manager.models_array.forEach( function(o,i){
                if (i === n) {
                    manager.activeModel = n;
                    manager.models[o].active = true;
                } else {
                    manager.models[o].active = false;
                }
            } )
        } else if (typeof n === "string") {
            var pos = manager.models_array.indexOf(n);
            if (pos !== -1) {
                this.solo( pos );
            }
        } else if (n instanceof Model) {
            this.solo( n.id )
        }
    }
    update () {

        // Model

        this.eachModel( function( model , manager ){

            if (model.active) {

                model.update( manager.speed );

            }

        }, this )

        // Camera

        if (this.rig.theta >= PI2) {
             this.rig.theta -= PI2;
             this.rig.target_theta -= PI2;
        } else if (this.rig.theta < 0) {
             this.rig.theta += PI2;
             this.rig.target_theta += PI2;
        }

        this.rig.theta += ( this.rig.target_theta - this.rig.theta ) * this.rig.speed;
        this.rig.pitch += ( this.rig.target_pitch - this.rig.pitch ) * this.rig.speed;
        this.rig.radius += ( this.rig.target_radius - this.rig.radius ) * this.rig.speed;
        this.rig._focus.lerp( this.rig.focus , this.rig.speed );

        this.camera.position.z = Math.sin( this.rig.theta ) * this.rig.radius;
        this.camera.position.x = Math.cos( this.rig.theta ) * this.rig.radius;
        this.camera.position.y = this.rig.pitch
        this.camera.lookAt(this.rig._focus)

        // Renderer

        this.renderer.render( this.scene , this.camera )

    }
}
