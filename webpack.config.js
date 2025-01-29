const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.js', // Entry point of the app
    output: {
      path: path.resolve(__dirname, 'dist'), // Output directory
      filename: 'bundle.js', // Output file name
      clean: true, // Cleans the output directory before every build
    },
    resolve: {
      extensions: ['.js', '.jsx'], // Resolve these extensions
      fallback: {
        fs: false,
        tls: false,
        net: false,
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        assert: require.resolve('assert/'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/, // Process JS and JSX files
          exclude: /node_modules/, // Exclude node_modules
          use: 'babel-loader', // Use Babel for transpiling
        },
        {
          test: /\.css$/, // Process CSS files
          use: ['style-loader', 'css-loader'], // Loaders for CSS
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/, // Process images
          type: 'asset/resource', // Use Webpack 5 asset module
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html', // Template for the HTML
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode), // Pass environment variables
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'), // Serve files from the public directory
      },
      compress: true, // Enable Gzip compression
      port: 3000, // Development server port
      hot: true, // Enable Hot Module Replacement
      open: true, // Automatically open the browser
    },
    devtool: isProduction ? 'source-map' : 'inline-source-map', // Use source maps
    mode: isProduction ? 'production' : 'development', // Mode (production or development)
  };
};
