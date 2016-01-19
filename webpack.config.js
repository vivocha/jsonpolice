module.exports = {
  context: __dirname + '/lib',
  entry: {
    jsonpolice: './index.js',
  },
  output: {
    path: __dirname,
    filename: './index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', query: { cacheDirectory: true, presets: [ 'es2015' ] } }
    ]
  }
}
