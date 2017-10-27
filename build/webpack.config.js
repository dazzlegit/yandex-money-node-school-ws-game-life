const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

// Naming and path settings
const indexEntryPoint = './src/client/index.js';
const appEntryPoint = './src/client/main.js';
const exportPath = path.resolve(__dirname, '../dist');

// Enviroment flag
const plugins = [
	new ExtractTextPlugin('style.css')
];
const env = process.env.WEBPACK_ENV;

// Differ settings based on production flag
if (env === 'production') {
	const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

	plugins.push(new UglifyJsPlugin());
	plugins.push(new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			}
		}
	));
}

// Main Settings config
module.exports = {
	entry: {
		index: indexEntryPoint,
		app: appEntryPoint,
	},
	output: {
		path: exportPath,
		filename: '[name].js',
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				query: {
					presets: ['es2015']
				}
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					extractCSS: true
				}
			}
		]
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.esm.js'
		}
	},
	plugins
};
