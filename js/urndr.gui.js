var GUI = new dat.GUI();

var gp;

gp = GUI.addFolder("Basic");

gp.add(STYLE, "brush_size", 5, 80).listen();
gp.add(STYLE.color, "0", 0, 255).step(1).name("R").listen();
gp.add(STYLE.color, "1", 0, 255).step(1).name("G").listen();
gp.add(STYLE.color, "2", 0, 255).step(1).name("B").listen();
gp.add(STYLE.color, "3", 0, 1).name("A").listen();

gp = GUI.addFolder("Tools")

gp.add( MODULES.getModuleByName("Draw") , "func").name("Draw")
gp.add( MODULES.getModuleByName("Eraser") , "func").name("Eraser")
gp.add( MODULES.getModuleByName("Mover") , "func").name("Mover")
gp.add( MODULES.getModuleByName("Selector") , "func").name("Selector")
gp.add( MODULES.getModuleByName("Clear Canvas") , "func").name("Clear")

gp = GUI.addFolder("Modules")

gp.add( MODULES.getModuleByName("Pressure Sensitivity") , "enabled").name("Pressure").listen()
gp.add( MODULES.getModuleByName("Random Stroke Color") , "enabled").name("Random Color").listen()
gp.add( MODULES.getModuleByName("Random Point") , "enabled").name("Random").listen()
gp.add( MODULES.getModuleByName("Wiggle") , "enabled").name("Wiggle").listen()
gp.add( MODULES.getModuleByName("Smooth") , "enabled").name("Smooth").listen()
gp.add( MODULES.getModuleByName("Fade Strokes") , "enabled").name("Fade Strokes").listen();
    gp = gp.addFolder( "settings" )
    gp.add( MODULES.getModuleByName("Fade Strokes").getConfiguration() , "all");
    gp.add( MODULES.getModuleByName("Fade Strokes").getConfiguration() , "speed", 1, 5);

gp = GUI.addFolder("Render")

gp.add( MODULES.getModuleByName("VANILLA DRAW").configuration , "fillmember" ).name("Comic")

// Active Stroke

watch(STROKES, "active_stroke", function(){

    var str = "Stroke",
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
    asf.add( stk, "deleteStroke").name("DeleteStroke")

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