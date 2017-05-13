import {EventEmitter} from 'events'
import MathUtil from './math/math'

class BaseModule {
    constructor (n,t,k,e) {

        // Parameter Control
        var _name, _type, _keycode, _enabled;
        if (e == undefined) {
            _enabled = false
            if (typeof k == "number") {
                _keycode = k
            } else {
                // don't assign keycode
                _enabled = k
                _keycode = false;
            }
        } else {
            _enabled = e
            _keycode = k
        }
        _type = t
        _name = n

        // Properties that will always be
        this.manager = null
        this.id = "MOD-"+MathUtil.uuid()
        this.priority = 1
        this.enabled = _enabled;
        this.type = _type
        this.name = _name
        this.timeControlObject = {
            then: Date.now(),
            interval: 25
        }
        this.emitter = new EventEmitter()
        this.func = function(){};

        // Properties that could be
        if (_keycode) {
            this.keyCode = _keycode;
        }

    }

    get timeControl () {
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
    set interval (v) {
        this.timeControlObject.interval = v;
    }
    setFunction ( f ) { this.func = f }
    getFunction () { return this.func }

    //
    // Configurations
    //

    setConfiguration ( s ) {
        this.configuration = s;
        this.initialConfiguration = Object.create( this.configuration )
    }
    getConfiguration () { return this.configuration }
    // Setting = a short hand for this.configuration
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

BaseModule.UI_MESSAGE = 'uimessage'

export default BaseModule
