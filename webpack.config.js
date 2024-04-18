/**
 * Any Changes to this config file will require a restart of the server
 * If you are running the server with the 'npm run start-serv' command, you will need to stop the server and restart it
 * 
 */

const path = require('path') // import the path module from Node.js

module.exports = {
  entry: './docs/js/functions.js', // the entry point of of the webapp
  output: {
    filename: 'functions.js', // the name of the bundled file
    path: path.resolve(__dirname, 'docs')
  },
  devServer: {
    client: {
      overlay: false, // show a full-screen overlay in the browser when there are compiler errors or warnings (turn this to true for troubleshooting)
    },
    proxy: [{
      context: ['/api'], // requests to '/api' will be proxied
      target: 'https://pub-9d70620f0c724e4595b80ff107d19f59.r2.dev/', // proxy to the hosted json bucket
      secure: true,
      changeOrigin: true,
      pathRewrite: {'^/api' : ''} // remove the '/api' path from the request
    }],
    static: path.resolve(__dirname, 'docs'), // serve the files from the 'dist' directory
    port: 8080, // listen on port 8080
    hot: true, // enable hot module replacement
    open: true, // open the browser when the server starts
  },
module: {
  rules: [
    {
      test: /\.(scss)$/,
      use: [
        {
          loader: 'style-loader'
        },
        {
          loader: 'css-loader'
        },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: () => [
                require('autoprefixer')
              ]
            }
          }
        },
        {
          loader: 'sass-loader'
        }
      ]
    }
  ]
}
}