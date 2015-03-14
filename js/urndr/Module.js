URNDR.Module = function(n,t,k,e) {
    this.id = "MOD"+THREE.Math.generateUUID()
    this.priority = 1
    this.type = t
    this.name = n
    if ( typeof k === "boolean" && e === undefined ) {
        // no keycode data is sent
        this.enabled = k
    } else {
        if (typeof k === "number") { this.keyCode = k }
        if (typeof e === "boolean" && t !== URNDR.COMMAND_MODULE) { this.enabled = e }
    }
}
URNDR.Module.prototype.setFunction = function ( f ) { this.func = f }
URNDR.Module.prototype.getFunction = function ( f ) { return this.func }
URNDR.Module.prototype.setConfiguration = function ( s ) {
    this.configuration = s
    this.initialConfiguration = Object.create(s)
}
URNDR.Module.prototype.getConfiguration = function () { return this.configuration }