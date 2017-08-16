// @flow

import ExtractTextPlugin from 'extract-text-webpack-plugin';
import eslintFormatter from 'react-dev-utils/eslintFormatter';

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
            eslintPath: require.resolve('eslint'),
            baseConfig: {
              extends: [require.resolve('eslint-config-react-app')],
            },
            // by default we will accept custom .eslintrc
            ignore: false,
          },
        },
      ],
    },
    {
      // "oneOf" will traverse all following loaders until one will
      // match the requirements. When no loader matches it will fall
      // back to the "file" loader at the end of the loader list.
      oneOf: [
        // "url" loader works like "file" loader except that it embeds assets
        // smaller than specified limit in bytes as data URLs to avoid requests.
        // A missing `test` is equivalent to a match.
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: require.resolve('url-loader'),
          options: {
            limit: 10000,
            name: 'static/media/[name].[hash:8].[ext]',
          },
        },
        // json
        {
          test: /\.json$/,
          use: [{ loader: require.resolve('json-loader') }],
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
                compact: !isDev,
                presets: [
                  isServer
                    ? require.resolve('babel-preset-spust/server')
                    : require.resolve('babel-preset-spust/client'),
                ],
              },
            },
          ],
        },
        // css
        Object.assign(
          { test: /\.css$/, use: [] },
          // server side css compilation
          isServer
            ? {
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
                    loader: require.resolve('postcss-loader'),
                    options: {
                      ident: 'postcss',
                      plugins: loader => [
                        require('postcss-flexbugs-fixes')(),
                        require('postcss-import')(),
                        require('postcss-cssnext')({
                          browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 10'],
                          flexbox: 'no-2009',
                        }),
                        require('postcss-nested')(),
                      ],
                    },
                  },
                ],
              }
            : {},
          // client side production css compilation
          !isServer && !isDev
            ? {
                use: ExtractTextPlugin.extract({
                  fallback: require.resolve('style-loader'),
                  use: [
                    {
                      loader: require.resolve('css-loader'),
                      options: {
                        autoprefixer: false,
                        importLoaders: 1,
                        localIdentName: '[hash:base64]',
                        minimize: !isDev,
                        modules: true,
                        sourceMap: !isDev,
                      },
                    },
                    {
                      loader: require.resolve('postcss-loader'),
                      options: {
                        ident: 'postcss',
                        plugins: loader => [
                          require('postcss-flexbugs-fixes')(),
                          require('postcss-import')(),
                          require('postcss-cssnext')({
                            browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 10'],
                            flexbox: 'no-2009',
                          }),
                          require('postcss-nested')(),
                        ],
                      },
                    },
                  ],
                }),
              }
            : {},
          // client side development css compilation
          !isServer && isDev
            ? {
                use: [
                  require.resolve('style-loader'),
                  {
                    loader: require.resolve('css-loader'),
                    options: {
                      autoprefixer: false,
                      importLoaders: 1,
                      localIdentName: '[name]__[local]__[hash:base64:5]',
                      minimize: !isDev,
                      modules: true,
                      sourceMap: !isDev,
                    },
                  },
                  {
                    loader: require.resolve('postcss-loader'),
                    options: {
                      ident: 'postcss',
                      plugins: loader => [
                        require('postcss-flexbugs-fixes')(),
                        require('postcss-import')(),
                        require('postcss-cssnext')({
                          browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 10'],
                          flexbox: 'no-2009',
                        }),
                        require('postcss-nested')(),
                      ],
                    },
                  },
                ],
              }
            : {},
        ),
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
              loader: require.resolve('file-loader'),
              options: { emitFile: !isServer, name: 'static/media/[name].[hash:8].[ext]' },
            },
          ],
        },
      ].filter(Boolean),
    },
  ].filter(Boolean);
}
