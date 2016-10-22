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
        include: /client/,
        loader: 'babel',
        query: {
          presets: ['es2015', 'stage-0', 'react']
        }
      },
      {
        test: /\.css$/,
        loader: 'style!css'
      }
    ]
  }
}
