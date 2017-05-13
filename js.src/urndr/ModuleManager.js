import {EventEmitter} from 'events'
import Module from './BaseModule'

export default class ModuleManager {
    constructor () {
        this.emitter = new EventEmitter()
        //
        this.modules = [];
        this[ Module.COMMAND_MODULE ] = [];
        this[ Module.STYLE_MODULE ] = [];
        this[ Module.POINT_MODULE ] = [];
        this[ Module.STROKE_MODULE ] = [];
        this[ Module.DRAW_MODULE ] = [];
    }

    add ( module ) {
        this.modules.push(module)
        this[module.type].push(module)
        module.manager = this
        //
        module.emitter.add(@onModuleMessage)
    }

    onModuleMessage (msgType,msgBody) {
        this.emitter.emit(msgType,msgBody)
    }

    runModules (type='all',args) {
        const run = (module) => {module.execute(args)}
        if (type === 'all') {
            this.modules.forEach(run)
        } else {
            this[type].forEach(run)
        }
    }

}
