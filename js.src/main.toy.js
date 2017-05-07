window.$ = $
window.THREE = require('./three.js')
require('./GIFEncoder/LZWEncoder.min.js')
require('./GIFEncoder/NeuQuant.min.js')
require('./GIFEncoder/GIFEncoder.min.js')
require('./GIFEncoder/b64.js')
window.WatchJS = require('./watch.js')
window.watch = window.WatchJS.watch;
window.unwatch = window.WatchJS.unwatch;
window.callWatchers = window.WatchJS.callWatchers;

window.URNDR = require('./urndr.js')

window.addEventListener('touchstart', function(e) {
   // Iterate through the list of touch points and log each touch
   // point's force.
   for (var i=0; i < e.targetTouches.length; i++) {
     // Add code to "switch" based on the force value. For example
     // minimum pressure versus maximum pressure could result in
     // different handling of the user's input.
     console.log("targetTouches[" + i + "].force = " + e.targetTouches[i].force);
   }
}, false);





require('./toy.js')

require('./modules_toy.js')

