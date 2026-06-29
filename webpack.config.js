const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/app.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/bundle.[contenthash:8].js' : 'js/bundle.js',
      clean: true,
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        favicon: './public/icons/icon-192.png',
        inject: 'body',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public',
            to: '.',
            globOptions: {
              ignore: ['**/.gitkeep'],
            },
          },
        ],
      }),
      ...(isProduction
        ? [
            new InjectManifest({
              swSrc: './src/sw.js',
              swDest: 'sw.js',
              maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
            }),
          ]
        : []),
    ],
    devServer: {
      port: 3000,
      hot: true,
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
      historyApiFallback: true,
      client: {
        overlay: {
          warnings: false,
          errors: true,
        },
      },
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};
