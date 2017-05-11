import Module from './BaseModule'

export default class ModuleManager {
    constructor () {
        this.modules = {};
        this[ Module.COMMAND_MODULE ] = {};
        this[ Module.STYLE_MODULE ] = {};
        this[ Module.POINT_MODULE ] = {};
        this[ Module.STROKE_MODULE ] = {};
        this[ Module.DRAW_MODULE ] = {};

        this.KEY_PREFIX = "key";
        this.key_map = {};

        this.counter = 0;
    }

    setKeyMap ( keyCode , id ) {

        this.key_map[ this.KEY_PREFIX + keyCode ] = id;

    }

    getModuleIDbyKey ( keyCode ) {

        const result = this.key_map[ this.KEY_PREFIX + keyCode ];
        return result ? result : false

    }

    loadModule ( module ) {

        if ((module instanceof Module) === false) {

            if (typeof module === "function") {
                module = module();
            }

        }

        // put in general modules list
        this.modules[ module.id ] = module;

        if (this.hasOwnProperty( module.type )) {
            this[ module.type ][ module.id ] = this.modules[ module.id ]
        }

        if (typeof module.keyCode === "number") {
            this.setKeyMap( module.keyCode , module.id )
        }

    }

    loadModules ( list ) {

        for ( var l in list ) {
            this.loadModule( list[l] )
        }

    }

    getModule (id){ return this.modules[id] }

    getModuleByName ( query ){
        for( var m in this.modules ) {
            if ( query === this.modules[m].name ) {
                return this.modules[m]
            }
        }
        return false
    }

    trigger (evt) {
        const keyCode = evt.keyCode || evt.charCode
        let module = this.getModuleIDbyKey(keyCode)

        if ( module ) {

            module = this.getModule( module );

            var response = {module: module};

            switch( module.type ) {

                case Module.COMMAND_MODULE:
                    response.message = module.func( evt );
                    break;

                case Module.DRAW_MODULE:
                    this.soloModule( module )
                    response.message = "Activated";
                    break;

                // every other kind of modules (realtime modules & such...)
                default:
                    module.enabled = ! module.enabled;
                    const _msg = module.receive( evt );
                    response.message = module.enabled ? "ON" : "OFF";
                    if (_msg) {
                        response.message += " : " + _msg;
                    }
                    break;

            }

            return response

        } else {

            return 0;

        }
    }

    soloModule ( mod ) {

        var list = this[mod.type];

        for( var m in list ) {

            list[m].enabled = (list[m].id === mod.id) ? true : false

        }

    }

    runEnabledModulesInList (list_name, params) {

        var list = this[list_name];
        var m,mod;

        for ( m in list ) {
            mod = list[m];
            if (mod.enabled) {
                if (mod.timeControl) {
                    mod.func(params);
                }
            }
        }

    }

    getEnabledModulesCount ( list_name ) {

        var list = this[list_name], enabled_count = 0;
        for (m in list) { if (list[m].enabled) { enabled_count ++; } }

        return enabled_count;

    }

}
