// @flow

import AssetsPlugin from 'assets-webpack-plugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import chalk from 'chalk';
import OfflinePlugin from 'offline-plugin';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import ServerManager from '../ServerManager';
import ServerListenerPlugin from '../ServerListenerPlugin';
import WatchMissingNodeModulesPlugin from 'react-dev-utils/WatchMissingNodeModulesPlugin';
import webpack from 'webpack';

export default function createWebpackPlugins(
  {
    isDev,
    isServer,
    serverBundlePath,
    serverManager,
  }: { serverBundlePath: string, isDev: boolean, isServer: boolean, serverManager: ?ServerManager },
  envVariables: Object,
): Array<any> {
  let serverListenerPlugin;

  if (isDev && isServer) {
    if (serverManager == null) {
      throw new Error('Server manager must be provided during development');
    }

    serverListenerPlugin = new ServerListenerPlugin(serverManager);
  }

  return [
    // client side and server side
    new ProgressBarPlugin({
      format: ` ${isServer ? 'server' : 'client'} build [:bar] ${chalk.green.bold(
        ':percent',
      )} (:elapsed seconds)`,
      clear: false,
    }),

    // define variables client side and server side
    new webpack.DefinePlugin(envVariables),

    // hot module replacement, only client side and dev
    isDev && !isServer ? new webpack.HotModuleReplacementPlugin() : null,

    // case sensitive paths plugin, only dev, both sides
    isDev ? new CaseSensitivePathsPlugin() : null,

    // watch missing node modules plugin, only dev, both sides
    isDev ? new WatchMissingNodeModulesPlugin() : null,

    // uglify js, only client side and prod mode
    !isDev && !isServer
      ? new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false,
            comparisons: false,
          },
          output: {
            comments: false,
          },
          sourceMap: true,
        })
      : null,

    // ignore locales imported by momentjs, both sides, requires you to require them explicitly
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

    // extract css, only client side and prod
    !isDev && !isServer
      ? new ExtractTextPlugin({
          filename: '[name]-[contenthash:8].css',
          allChunks: true,
        })
      : null,

    // compress to gz, only client side assets and prod
    !isDev && !isServer
      ? new CompressionPlugin({
          asset: '[path].gz',
          algorithm: 'gzip',
        })
      : null,

    // offline plugin , only client side assets and prod mode
    !isDev && !isServer
      ? new OfflinePlugin({
          AppCache: {
            events: true,
          },
          autoUpdate: true,
          caches: {
            // main: ['**/vendor-*.{css,js}', '**/main-*.{css,js}'],
            // additional: ['**/*.{css,js,jpg,jpeg,png,ogg,svg,woff,woff2,ttf}'],
            // additional: [':rest:'],
          },
          excludes: ['**/*.map', '**/*.map.gz'],
          publicPath: '/',
          safeToUseOptionalCaches: true,
          ServiceWorker: {
            // emit events so we can react to them in client/index.js
            events: true,
          },
        })
      : null,

    // limit chunks to only one file on server side (useful for react-loadable)
    isServer ? new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }) : null,

    // assets plugin, only client side and prod mode
    !isServer
      ? new AssetsPlugin({ path: serverBundlePath, fullPath: true, prettyPrint: true })
      : null,

    // server listener plugin to manage exported server instance
    serverListenerPlugin,
  ].filter(Boolean);
}
