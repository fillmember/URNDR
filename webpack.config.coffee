path = require('path')
webpack = require('webpack')
argv = require('yargs').argv

config = 
	
	entry:
		Main: './src/js/main.js'
	
	output:
		path: path.join __dirname , 'dist' , 'js'
		filename: '[name].js'
		chunkFilename: '[chunkhash].js'
	
	resolve: extensions: [
		''
		'.js'
		'.json'
		'.coffee'
		'.jade'
	]

	module:
		loaders: [
			{
				test: /\.css/ , loader: 'style-loader!css-loader'
			}
			{
				test: /\.jade/ , loader: 'jade-loader'
			}
			{
				test: /\.gif/ , loader: 'url-loader?limit=10000&minetype=image/gif'
			}
			{
				test: /\.jpg/ , loader: 'url-loader?limit=10000&minetype=image/jpg'
			}
			{
				test: /\.png/ , loader: 'url-loader?limit=10000&minetype=image/png'
			}
			{
				test: /\.js$/
				exclude: /(node_modules|vendor)/
				loader: 'babel-loader'
				query: presets: [ 'es2015' ]
			}
			{
				test: /\.coffee$/ , loader: 'coffee-loader'
			}
			{
				test: /\.glsl$/ , loader: 'shader-loader'
			}
		]
		noParse: /\.min\.js/

	plugins: [
		new webpack.DefinePlugin
			__DEV__: JSON.stringify( JSON.parse( argv.dev or !argv.nodev and argv._[0] == 'watch' ) )
	]


module.exports = config