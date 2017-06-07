// @flow

import { relative as relativePath, resolve as resolvePath } from 'path';
import { stat, readFile } from 'mz/fs';
import dotenv from 'dotenv';
import chalk from 'chalk';
import nodeExternals from 'webpack-node-externals';
import ServerManager from './ServerManager';
import webpack from 'webpack';

import { createWebpackLoaders, createWebpackPlugins, loadEnvVariables } from './helpers';

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
  serverManager?: ?ServerManager,
  srcDir: string,
  workDir: string,
};

async function configure({ env, serverManager, srcDir, workDir }: Args): Promise<Configuration> {
  const isDev = env === 'development';
  const appDir = resolvePath(workDir, srcDir);
  const clientBundlePath = resolvePath(workDir, './bundle/client');
  const serverBundlePath = resolvePath(workDir, './bundle/server');

  const envVariables = {
    'process.env': JSON.stringify({
      // provide full path to webpack-assets.json so you can easily load it server side
      ASSETS_JSON_PATH: resolvePath(serverBundlePath, 'webpack-assets.json'),
      NODE_ENV: env,
      // this is set in build.js or start.js, you can override it using env variables
      // but we will force this PORT during development to ensure
      // that your backend is running on the given port so we can proxy requests easily
      PORT: process.env.PORT,
      ...loadEnvVariables(workDir),
      // force port from start.js during development
      // because of proxying requests
      ...(isDev ? { PORT: process.env.PORT } : {}),
    }),
  };

  return {
    client: {
      bail: !isDev,
      devtool: isDev ? 'eval' : 'source-map',
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
        devtoolModuleFilenameTemplate: info => relativePath(appDir, info.absoluteResourcePath),
      },
      resolve: {
        extensions: ['.js', '.json', '.jsx'],
      },
      module: {
        strictExportPresence: true,
        rules: createWebpackLoaders({ appDir, isDev, isServer: false }, envVariables),
      },
      node: {
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
        { isDev, isServer: false, serverBundlePath, serverManager },
        envVariables,
      ),
      target: 'web',
    },
    server: {
      bail: !isDev,
      devtool: isDev ? 'eval' : 'source-map',
      entry: [
        isDev ? require.resolve('source-map-support/register') : null,
        require.resolve('./polyfills/server'),
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
      },
      module: {
        strictExportPresence: true,
        rules: createWebpackLoaders({ appDir, isDev, isServer: true }, envVariables),
      },
      node: {
        __dirname: true,
        __filename: true,
      },
      plugins: createWebpackPlugins(
        { isDev, isServer: true, serverBundlePath, serverManager },
        envVariables,
      ),
      performance: false,
      target: 'node',
    },
  };
}

export default configure;
