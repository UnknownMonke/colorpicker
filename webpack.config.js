const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

// Webpacks doesn't requires a configuration file by default.
module.exports = {
  mode: 'development', // Automatically sets <process.env.NODE_ENV> to the mode.
  entry: './src/index.js', // Root module.
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    // Uses a template html to generate an index file in the output folder.
    new HtmlWebpackPlugin({
        hash: true,
        template: './src/index.html',
        filename: 'index.html'
    })
]
};