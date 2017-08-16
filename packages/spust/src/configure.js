// @flow

import { dirname, relative as relativePath, resolve as resolvePath } from 'path';
import nodeExternals from 'webpack-node-externals';

import { createWebpackLoaders, createWebpackPlugins, loadEnvVariables } from './helpers';
import type { ServerManagerInterface } from './types';

export type WebpackConfig = {
  devtool: string,
  entry:
    | string
    | Array<string>
    | {
        [key: string]: string | Array<string>,
      },
  output: {
    filename: string,
    libraryTarget: string,
    path: string,
    publicPath: string,
  },
  module: {
    strictExportPresence: boolean,
    rules: Array<{
      enforce?: string,
      test:
        | string
        | RegExp
        | ((path: string) => boolean | Array<string | RegExp | (() => boolean)>),
      use?: Array<
        | string
        | {
          loader: string,
          options?: { [key: string]: any },
        },
      >,
      include?: string | Array<string> | RegExp | ((path: string) => boolean),
    }>,
  },
  plugins: Array<any>,
  target: string,
};

export type Configuration = {
  client: WebpackConfig,
  server: WebpackConfig,
};

type Args = {
  env: 'development' | 'production',
  serverManager?: ?ServerManagerInterface,
  srcDir: string,
  useBabili: boolean,
  workDir: string,
};

async function configure({
  env,
  serverManager,
  srcDir,
  useBabili,
  workDir,
}: Args): Promise<Configuration> {
  const isDev = env === 'development';
  const appDir = resolvePath(workDir, srcDir);
  const clientBundlePath = resolvePath(workDir, './bundle/client');
  const serverBundlePath = resolvePath(workDir, './bundle/server');

  const variables = {
    // provide full path to webpack-assets.json so you can easily load it server side
    ASSETS_JSON_PATH: resolvePath(serverBundlePath, 'webpack-assets.json'),
    ASSETS_PATH: clientBundlePath,
    CLIENT_BUNDLE_PATH: clientBundlePath,
    SERVER_BUNDLE_PATH: serverBundlePath,
    NODE_ENV: env,
    // for build.js this is not specified because we want user to have option to change it
    // PORT: process.env.PORT,
    ...(await loadEnvVariables(workDir)),
    // force port from start.js during development
    // because of proxying requests
    ...(isDev ? { PORT: process.env.PORT } : {}),
  };

  const envVariables = Object.keys(variables).reduce(
    (res, key) => ({ ...res, [`process.env.${key}`]: JSON.stringify(variables[key]) }),
    {},
  );

  return {
    client: {
      bail: !isDev,
      devtool: isDev ? 'cheap-module-source-map' : 'source-map',
      entry: [
        isDev ? require.resolve('react-dev-utils/webpackHotDevClient') : null,
        require.resolve('./polyfills/client'),
        isDev ? require.resolve('react-error-overlay') : null,
        resolvePath(appDir, './client/index.js'),
      ].filter(Boolean),
      output: {
        filename: isDev ? 'static/js/[name].js' : 'static/js/[name].[chunkhash:8].js',
        chunkFilename: 'static/js/[name].[chunkhash:8].js',
        libraryTarget: 'var',
        path: clientBundlePath,
        pathinfo: isDev,
        publicPath: '/',
        devtoolModuleFilenameTemplate: isDev
          ? info => resolvePath(info.absoluteResourcePath)
          : info => relativePath(appDir, info.absoluteResourcePath),
      },
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        modules: ['node_modules', resolvePath(workDir, './node_modules')],
        alias: {
          'babel-runtime': dirname(require.resolve('babel-runtime/package.json')),
        },
      },
      module: {
        strictExportPresence: true,
        rules: createWebpackLoaders({ appDir, isDev, isServer: false, useBabili }, envVariables),
      },
      node: {
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
      },
      performance: isDev
        ? false
        : {
            hints: 'warning',
          },
      plugins: createWebpackPlugins(
        { isDev, isServer: false, clientBundlePath, serverBundlePath, serverManager, useBabili },
        envVariables,
      ),
      target: 'web',
    },
    server: {
      bail: !isDev,
      devtool: isDev ? 'inline-source-map' : 'source-map',
      entry: [
        isDev ? require.resolve('source-map-support/register') : null,
        require.resolve('./polyfills/server'),
        require.resolve('./helpers/provideVariables'),
        resolvePath(appDir, './server/index.js'),
      ].filter(Boolean),
      externals: [
        nodeExternals({
          whitelist: [
            /\.(eot|woff|woff2|ttf|otf)$/,
            /\.(svg|png|jpg|jpeg|gif|ico)$/,
            /\.(mp4|mp3|ogg|swf|webp)$/,
            /\.(css|scss|sass|sss|less)$/,
          ],
        }),
      ],
      output: {
        filename: 'server.js',
        libraryTarget: 'commonjs2',
        path: serverBundlePath,
        publicPath: '/',
        devtoolModuleFilenameTemplate: info => relativePath(appDir, info.absoluteResourcePath),
      },
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
        modules: ['node_modules', resolvePath(workDir, './node_modules')],
      },
      module: {
        strictExportPresence: true,
        rules: createWebpackLoaders({ appDir, isDev, isServer: true, useBabili }, envVariables),
      },
      node: {
        __dirname: true,
        __filename: true,
      },
      plugins: createWebpackPlugins(
        { isDev, isServer: true, clientBundlePath, serverBundlePath, serverManager, useBabili },
        envVariables,
      ),
      performance: false,
      target: 'node',
    },
  };
}

export default configure;
