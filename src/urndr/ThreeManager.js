import THREE from './three.js'
import Model from './Model.js'

const PI2 = Math.PI * 2

export default class ThreeManager {
    constructor ( arg = {} ) {

        // Storage
        this.models = []
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
            radius: 5, target_radius: 5,
            theta : 0, target_theta : 0,
            pitch : 0, target_pitch : 0,
            speed : 0.1,
            focus : new THREE.Vector3(0,0,0),
            _focus : new THREE.Vector3(0,0,0)
        }
        this.speed = 15;

        this.camera.position.set( 0 , 0 , 5 )

    }

    get count() {
        return this.models.length;
    }
    setColor({material,renderer,fog}) {
        this.material.color.set(material)
        this.renderer.setClearColor(renderer)
        this.scene.fog.color.set(fog)
    }
    createModelFromFile ( file_path, args ) {

        // Arguments
        args.material = args.material || this.material;

        var model = new Model( args )
        this.addModel( model )
        // Load
        model.loadModel( file_path , () => {
            this.scene.add( model.mesh );
        } );

    }
    addModel ( model ) {

        model.parent = this;
        this.models.push( model );

    }
    eachModel ( my_function , parameters ) {

        this.models.forEach((model, index) => {
            my_function( model , parameters , index)
        })

    }
    solo ( input ){
        var manager = this;
        if (typeof input === "number") {
            manager.models.forEach( function(model,index){
                if (index === input) {
                    manager.activeModel = index;
                    model.active = true;
                } else {
                    model.active = false;
                }
            })
        } else if (input instanceof Model) {
            this.solo( this.models.indexOf(input) )
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
    createUI (ui) {

        ui.build.startSection()

        ui.build.header({title:`3D`})

        ui.build.slider({
            icon : 'fa fa-cube',
            title : '',
            target : this,
            property : 'activeModel',
            min : 0,
            max : this.models.length - 1,
            onInput : () => {
                this.solo(this.activeModel)
            }
        })

        ui.build.slider({
            icon : 'fa fa-car',
            title : '',
            target : this,
            property : 'speed',
            min : 0,
            max : 30,
            step : 0.5
        })

        ui.watch( ui.build.slider({
            icon : 'fa fa-arrows-h',
            title : '',
            target : this.rig,
            property : 'target_theta',
            min : 0,
            max : 6.2831,
            step : 6.2 / 100
        }))

        ui.watch( ui.build.slider({
            icon : 'fa fa-search-plus',
            title : '',
            target : this.rig,
            property : 'target_radius',
            min : -6,
            max : 6,
            step : 0.1
        }))

        ui.watch( ui.build.slider({
            icon : 'fa fa-arrows-v',
            title : '',
            target : this.rig,
            property : 'target_pitch',
            min : -6,
            max : 6,
            step : 0.1
        }))

        ui.build.endSection()


    }
}
