var GUI = new dat.GUI();

var basic_folder = GUI.addFolder("Basic");

basic_folder.add(STYLE, "brush_size", 5, 80).listen();
basic_folder.add(STYLE.color, "0", 0, 255).step(1).name("R").listen();
basic_folder.add(STYLE.color, "1", 0, 255).step(1).name("G").listen();
basic_folder.add(STYLE.color, "2", 0, 255).step(1).name("B").listen();
basic_folder.add(STYLE.color, "3", 0, 1).name("A").listen();

var tool_f = GUI.addFolder("Tools")

tool_f.add( MODULES.getModuleByName("Draw") , "func").name("Draw")
tool_f.add( MODULES.getModuleByName("Eraser") , "func").name("Eraser")
tool_f.add( MODULES.getModuleByName("Mover") , "func").name("Mover")
tool_f.add( MODULES.getModuleByName("Selector") , "func").name("Selector")
tool_f.add( MODULES.getModuleByName("Clear Canvas") , "func").name("Clear")

var mod_f = GUI.addFolder("Modules")

mod_f.add( MODULES.getModuleByName("Pressure Sensitivity") , "enabled").name("Pressure").listen()
mod_f.add( MODULES.getModuleByName("Random Stroke Color") , "enabled").name("Random Color").listen()
mod_f.add( MODULES.getModuleByName("Random Point") , "enabled").name("Random").listen()
mod_f.add( MODULES.getModuleByName("Wiggle") , "enabled").name("Wiggle").listen()
mod_f.add( MODULES.getModuleByName("Smooth") , "enabled").name("Smooth").listen()

var render_f = GUI.addFolder("Render")

render_f.add( MODULES.getModuleByName("VANILLA DRAW").configuration , "fillmember" ).name("Comic")

// Active Stroke

watch(STROKES, "active_stroke", function(){

    var str = "Selected Stroke",
        closed = true;
    
    if ( GUI.__folders.hasOwnProperty( str ) ){
        closed = GUI.__folders[str].closed
        GUI.removeFolder( str )
    }

    var stk = STROKES.getActiveStroke();

    var asf = GUI.addFolder( str )

    // asf.add( stk, "id" )
    asf.add( stk, "closed" )
    asf.add( stk, "simplify_more").name("Simplify")

    if (closed === false) {
        asf.open()
    }

});

// HELPERS

//removeFolder

GUI.removeFolder = function(name) {
    this.__folders[name].close();
    this.__folders[name].domElement.parentNode.parentNode.removeChild(this.__folders[name].domElement.parentNode);
    this.__folders[name] = undefined;
    this.onResize();
}