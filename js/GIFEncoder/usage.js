// <script type="text/javascript" src="js/GIFEncoder/LZWEncoder.js"></script>
// <script type="text/javascript" src="js/GIFEncoder/NeuQuant.js"></script>
// <script type="text/javascript" src="js/GIFEncoder/GIFEncoder.js"></script>
// <script type="text/javascript" src="js/GIFEncoder/b64.js"></script>

var getGif = function( delay , duration , context , background ){

	// INIT
	var encoder = new GIFEncoder();

	encoder.setRepeat( 0 );
	encoder.setDelay( delay );
	encoder.setTransparent( background ? background : null )
	
	encoder.start();

	// WRITE
	var counter = 0;
	var timer = setInterval( function(){
	
		if (counter < duration) {
		
			encoder.addFrame( context );
			counter ++;
		
		} else {
			
			// KILL INTERVAL
			clearInterval( timer )

			// FINISH
			encoder.finish();
			var binary_gif = encoder.stream().getData();
			var data_url = 'data:image/gif;base64,' + encode64( binary_gif );

			// RETURN
			// return data_url;
			var win = window.open( data_url );

		}
	
	} , delay)

}