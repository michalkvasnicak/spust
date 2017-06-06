// @flow

import ExtractTextPlugin from 'extract-text-webpack-plugin';
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
            forceEnv: isServer
              ? isDev ? 'serverDev' : 'serverProd'
              : isDev ? 'clientDev' : 'clientProd',
            presets: [require.resolve(resolvePath(__dirname, '../babel'))],
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
      test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
      use: [{ loader: 'url-loader', options: { emitFile: !isServer, limit: 10000 } }],
    },

    // file
    {
      test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
      use: [{ loader: 'file-loader', options: { emitFile: !isServer } }],
    },
  ].filter(Boolean);
}
