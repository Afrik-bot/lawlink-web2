const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = {
    "stream": require.resolve("stream-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "https": require.resolve("https-browserify"),
    "http": require.resolve("stream-http"),
    "buffer": require.resolve("buffer/"),
    "url": require.resolve("url/"),
    "util": require.resolve("util/"),
    "assert": require.resolve("assert/"),
    "process": require.resolve("process/browser.js")  
  };

  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: ['process/browser.js', 'process'],  
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ]);
  
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto'
  });

  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser.js')
  };
  
  return config;
};
