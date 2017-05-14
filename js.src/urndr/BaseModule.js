import {EventEmitter} from 'events'
import MathUtil from './math/math'

class BaseModule {
    constructor (_name,_type) {
        // Properties that will always be
        this.manager = null
        this.enabled = true;
        this.type = _type
        this.name = _name
        this.timeControlObject = {
            then: Date.now(),
            interval: 25
        }
        this.emitter = new EventEmitter()
        this.func = function(){};

    }
    setFunction ( f ) { this.func = f }

    //
    // Interval Control
    //

    set interval (v) {
        this.timeControlObject.interval = v;
    }
    get interval () {
        return this.timeControlObject.interval
    }
    get cool () {
        var obj = this.timeControlObject,
            now = Date.now(),
            delta = now - obj.then;
        if (delta < obj.interval) {
            return false;
        } else {
            obj.then = now - (delta % obj.interval);
            return true;
        }
    }

    execute (args) {
        if (this.enabled && this.cool) {
            this.func(args)
        }
    }

    setActive (input) {
        this.enabled = input
        return this
    }

    //
    // Configurations
    //

    setConfiguration ( s ) {
        this.configuration = s;
        this.initialConfiguration = Object.create( this.configuration )
    }
    getConfiguration () { return this.configuration }
    get settings () { return this.configuration; }

    //
    // UI System
    //

    createUI (ui) {

        ui.build.startSection()

        if (this.type === BaseModule.COMMAND_MODULE) {
            ui.build.button({
                title: this.name,
                click: ()=>{this.func()}
            })
            return
        }

        ui.build.checkbox({
            target : this,
            property : 'enabled',
            title : this.name,
            class : 'header'
        })

        for (var item in this.settings) {
            switch (typeof this.settings[item]) {
                case 'number':
                ui.build.slider({
                    target : this.settings,
                    property : item,
                    title : item
                })
                break;
                case 'boolean':
                ui.build.checkbox({
                    target : this.settings,
                    property : item,
                    title : item
                })
                // console.log( item , this.settings[item] , 'boolean')
                break;
                case 'string':
                console.log( item , this.settings[item] , 'string (color or string)')
                break;
            }
        }

        ui.build.endSection()

    }

}

BaseModule.COMMAND_MODULE = "COMMAND_MODULES"
BaseModule.STYLE_MODULE = "STYLE_MODULES"
BaseModule.POINT_MODULE = "POINT_MODULES"
BaseModule.STROKE_MODULE = "STROKE_MODULES"
BaseModule.DRAW_MODULE = "DRAW_MODULES"
BaseModule.ALL_MODULES = "ALL_MODULES"

BaseModule.UI_MESSAGE = 'uimessage'

export default BaseModule
