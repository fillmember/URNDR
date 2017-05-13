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

    //
    // Configurations
    //

    setConfiguration ( s ) {
        this.configuration = s;
        this.initialConfiguration = Object.create( this.configuration )
    }
    getConfiguration () { return this.configuration }
    set settings ( s ) { this.setConfiguration( s ) }
    get settings () { return this.configuration; }

    //
    // UI System
    //

    makeUI (uiManager) {

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
