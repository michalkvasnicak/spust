// @flow

import AssetsPlugin from 'assets-webpack-plugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import chalk from 'chalk';
import OfflinePlugin from 'offline-plugin';
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
    // add module names to factory functions so they appear in browser profiler
    !isServer && isDev ? new webpack.NamedModulesPlugin() : null,

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
          filename: 'static/css/[name].[hash:8].[ext]',
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
