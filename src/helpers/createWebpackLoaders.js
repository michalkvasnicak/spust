// @flow

import ExtractTextPlugin from 'extract-text-webpack-plugin';
import eslintFormatter from 'react-dev-utils/eslintFormatter';
import { resolve as resolvePath } from 'path';

export default function createWebpackLoaders(
  { appDir, isDev, isServer }: { appDir: string, isDev: boolean, isServer: boolean },
  envVariables: Object,
): Array<any> {
  return [
    {
      enforce: 'pre',
      test: /\.(js|jsx)$/,
      include: appDir,
      use: [
        {
          loader: require.resolve('eslint-loader'),
          options: {
            formatter: eslintFormatter,
            baseConfig: {
              extends: [require.resolve('eslint-config-react-app')],
            },
            // by default we will accept custom .eslintrc
            ignore: false,
          },
        },
      ],
    },
    // js, jsx
    {
      test: /\.(js|jsx)$/,
      include: appDir,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            cacheDirectory: isDev,
            presets: [
              isServer ? require.resolve('../babel/server') : require.resolve('../babel/client'),
            ],
          },
        },
      ],
    },

    // json
    {
      test: /\.json$/,
      use: [{ loader: 'json-loader' }],
    },

    // css
    Object.assign(
      { test: /\.css$/, use: [] },
      // server side css compilation
      !isServer
        ? {}
        : {
            use: [
              {
                loader: require.resolve('css-loader/locals'),
                options: {
                  autoprefixer: false,
                  importLoaders: 1,
                  localIdentName: isDev ? '[name]__[local]__[hash:base64:5]' : '[hash:base64]',
                  minimize: !isDev,
                  modules: true,
                  sourceMap: !isDev,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  plugins: loader => [
                    require('postcss-flexbugs-fixes'),
                    require('postcss-import')({ root: loader.resourcePath }),
                    require('postcss-cssnext')({
                      browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 10'],
                      flexbox: 'no-2009',
                    }),
                    require('postcss-apply')(),
                  ],
                },
              },
            ],
          },
      // client side css compilation
      isServer
        ? {}
        : {
            use: ExtractTextPlugin.extract({
              fallback: require.resolve('style-loader'),
              use: [
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    autoprefixer: false,
                    importLoaders: 1,
                    localIdentName: isDev ? '[name]__[local]__[hash:base64:5]' : '[hash:base64]',
                    minimize: !isDev,
                    modules: true,
                    sourceMap: !isDev,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    ident: 'postcss',
                    plugins: loader => [
                      require('postcss-flexbugs-fixes'),
                      require('postcss-import')({ root: loader.resourcePath }),
                      require('postcss-cssnext')({
                        browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 10'],
                        flexbox: 'no-2009',
                      }),
                      require('postcss-apply')(),
                    ],
                  },
                },
              ],
            }),
          },
    ),

    // url
    {
      test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
      use: [
        {
          loader: 'url-loader',
          options: {
            emitFile: !isServer,
            limit: 10000,
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
      ],
    },

    // file
    {
      exclude: [
        /\.html$/,
        /\.(js|jsx)$/,
        /\.css$/,
        /\.json$/,
        /\.bmp$/,
        /\.gif$/,
        /\.jpe?g$/,
        /\.png$/,
      ],
      use: [
        {
          loader: 'file-loader',
          options: { emitFile: !isServer, name: 'static/media/[name].[hash:8].[ext]' },
        },
      ],
    },
  ].filter(Boolean);
}
