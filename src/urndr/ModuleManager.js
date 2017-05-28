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
    }

    runModules (type='all',args) {
        const run = (module) => {module.execute(args)}
        if (type === 'all') {
            this.modules.forEach(run)
        } else {
            this[type].forEach(run)
        }
    }

    createUI (ui) {

        ui.build.startSection()

        const build = (m)=>{m.createUI(ui)}

        ui.build.startSection()
        ui.build.header({title:'Commands'})
        this[ Module.COMMAND_MODULE ].forEach(build)
        ui.build.endSection()
        ui.build.startSection()
        ui.build.header({title:'Style Modules'})
        this[ Module.STYLE_MODULE ].forEach(build)
        ui.build.endSection()
        ui.build.startSection()
        ui.build.header({title:'Point Modules'})
        this[ Module.POINT_MODULE ].forEach(build)
        ui.build.endSection()
        ui.build.startSection()
        ui.build.header({title:'Stroke Modules'})
        this[ Module.STROKE_MODULE ].forEach(build)
        ui.build.endSection()
        ui.build.startSection()
        ui.build.header({title:'Draw Modules'})
        this[ Module.DRAW_MODULE ].forEach(build)
        ui.build.endSection()

        ui.build.endSection()

    }

}
