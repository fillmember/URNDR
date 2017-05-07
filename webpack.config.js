const path = require('path')
const webpack = require('webpack')
const Babili = require('babili-webpack-plugin')
const config = {

  js: {

    src     : './js.src/',
    dev     : './js/',
    dist    : './js/',

  },

  css: {

    src     : './css.src/',
    dev     : './css/',
    dist    : './css/'

  }

}

module.exports = {
  entry: {
    'toy' : [ path.resolve(__dirname,config.js.src,'main.toy.js') ],
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname,config.js.dev),
    filename: '[name].js',
    chunkFilename: '[name]-chunk.js'
  },
  module: {
    rules: [
      // Code
      { test: /\.js$/,
        exclude: /node_modules|three/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              'es2015',
              {'modules':false}
            ]
          ]
        }
      },
      { test: /\.coffee$/, loader: 'coffee-loader' },
      // Assets
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.(png|jpe?g|gif|svg)(\?.*)?$/, loader: 'url-loader',
        query: {
          limit: 10000,
          name: '/assets/img/[name].[hash:7].[ext]'
        }
      }
    ]
  },
  resolve: {
    extensions:['.js','.coffee','.glsl'],
    modules:[
      path.resolve(__dirname,'node_modules'),
      path.join(__dirname,config.js.src)
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $ : 'jquery'
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
    // new Babili({removeConsole:true,removeDebugger:true})
  ]
}
