var reaction = function(obj, type){
	
	var $obj = $(obj);

	var needAction = !obj.oninput && !obj.onclick && !obj.onchange,
		name = $obj.attr("id") || $obj.attr("name"),
		args = $obj.data("args"),
		help = $obj.data("help") || "",
		inputFn = undefined;
	
	$obj.on("hover",function(evt) {
		// TODO
		console.log( name, help )
	})

	// if (args != undefined) {
	// 	args = args.split(",");
	// } else {
	// 	args = null;
	// }

	// switch (type) {
	// 	case "button":
	// 		inputFn = function(evt) {
	// 			var mod = MODULES.getModuleByName(name);
	// 			mod.func.apply( mod , args )
	// 		}
	// 		break;
	// 	case "checkbox":
	// 		inputFn = function(evt) {
	// 			var mod = MODULES.getModuleByName(name);
	// 			mod.enabled = obj.checked;
	// 		}
	// 		break;
	// 	case "range":
	// 		inputFn = function(evt) {
	// 			var mod = MODULES.getModuleByName(name);
	// 			mod.listener.apply( module , obj.value );
	// 		}
	// 		break;
	// 	default:
	// 		break;
	// }

	// if (needAction) {
	// 	var eventTo = {
	// 		button: "click",
	// 		checkbox: "input",
	// 		range: "change"
	// 	}
	// 	$this.on(eventTo[type],inputFn)
	// }

}

var $controllers = $("#controllers");
$controllers.find("button").each(function(){
	reaction(this,"button")
});
$controllers.find("input").each(function(){
	var type = $(this).attr("type");
	reaction(this,type)
})