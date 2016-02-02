module.exports = {
  context: __dirname + '/src',
  entry: {
    test: './test.js',
  },
  output: {
    path: __dirname,
    filename: './[name].js',
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', query: { cacheDirectory: true, presets: [ 'es2015' ] } }
    ]
  }
}
