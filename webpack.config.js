module.exports = {
  debug: true,
  entry: './client/client_entry.js',
  output: {
    path: __dirname  + '/dist',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          optional: ['es7.classProperties'],
          stage: 0
        }
      },
      {
        test: /\.css$/,
        loader: 'style!css'
      }
    ]
  }
}
