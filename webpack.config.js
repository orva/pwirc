module.exports = {
  debug: true,
  entry: './client/client.js',
  output: {
    path: __dirname  + '/dist',
    filename: 'bundle.js'
  },
  loaders: [
    {
       test: /\.js$/,
       loader: 'babel-loader'
     },
     {
       test: /\.css$/,
       loader: 'style!css'
     }
   ]
}
