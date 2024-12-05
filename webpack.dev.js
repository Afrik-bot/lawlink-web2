const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "https": require.resolve("https-browserify"),
      "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/")
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    host: '127.0.0.1',
    port: 8080,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
  ],
};
