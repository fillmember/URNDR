(function(){

    var GUI = new dat.GUI();

    var folderBasic = GUI.addFolder("Basic");
        folderBasic.add(STYLE, "brush_size", 5, 80).listen();
        folderBasic.add(STYLE.color, "0", 0, 255).step(1).name("R").listen();
        folderBasic.add(STYLE.color, "1", 0, 255).step(1).name("G").listen();
        folderBasic.add(STYLE.color, "2", 0, 255).step(1).name("B").listen();
        folderBasic.add(STYLE.color, "3", 0, 1).name("A").listen();

    var folderTools = GUI.addFolder("Tools")
        folderTools.add( MODULES.getModuleByName("Draw") , "func").name("Draw")
        folderTools.add( MODULES.getModuleByName("Eraser") , "func").name("Eraser")
        folderTools.add( MODULES.getModuleByName("Mover") , "func").name("Mover")
        folderTools.add( MODULES.getModuleByName("Selector") , "func").name("Selector")
        folderTools.add( MODULES.getModuleByName("Clear Canvas") , "func").name("Clear")

    var folderModules = GUI.addFolder("Modules")
        folderModules.add( MODULES.getModuleByName("Pressure Sensitivity") , "enabled").name("Pressure").listen()
        folderModules.add( MODULES.getModuleByName("Random Stroke Color") , "enabled").name("Random Color").listen()
        folderModules.add( MODULES.getModuleByName("Random Point") , "enabled").name("Random").listen()
        folderModules.add( MODULES.getModuleByName("Wiggle") , "enabled").name("Wiggle").listen()
        folderModules.add( MODULES.getModuleByName("Smooth") , "enabled").name("Smooth").listen()
        folderModules.add( MODULES.getModuleByName("Fade Strokes") , "enabled").name("Fade Strokes").listen(); //.onChange(function( bool ){ console.log( bool );});

            var folderModuleFade = folderModules.addFolder( "fade settings" )
                folderModuleFade.add( MODULES.getModuleByName("Fade Strokes").getConfiguration() , "all");
                folderModuleFade.add( MODULES.getModuleByName("Fade Strokes").getConfiguration() , "speed", 1, 5);
        
        folderModules.add( MODULES.getModuleByName("Expand") , "enabled").name("Expand").listen()
        
            var folderModuleExpand = folderModules.addFolder( "expand settings" )
                folderModuleExpand.add( MODULES.getModuleByName("Expand").getConfiguration() , "speed", 1, 5);

    var folderRender = GUI.addFolder("Render")
        // folderRender.add( $("#canvas_three").get(0).style , "opacity" ).name("Model")
        folderRender.add( MODULES.getModuleByName("VANILLA DRAW").configuration , "fillmember" ).name("Comic")

    // Active Stroke
    watch(STROKES, "active_stroke", function(){

        var str = "Stroke",
            closed = true,
            stk = STROKES.getActiveStroke();
        
        if ( GUI.__folders.hasOwnProperty( str ) ){
            closed = GUI.__folders[ str ].closed
            GUI.removeFolder( str )
        }

        var folderActiveStroke = GUI.addFolder( str )
            // folderActiveStroke.add( stk, "id" );
            folderActiveStroke.add( stk, "closed" ).listen()
            folderActiveStroke.add( stk, "simplify_more").name("Simplify")
            folderActiveStroke.add( stk, "deleteStroke").name("DeleteStroke")

        if (closed === false) {
            folderActiveStroke.open()
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

})();