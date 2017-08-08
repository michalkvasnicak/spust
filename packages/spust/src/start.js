#!/usr/bin/env node
// @flow
/* eslint-disable import/first */

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

import { resolve as resolvePath } from 'path';
import { stat } from 'mz/fs';
import { choosePort, prepareUrls } from 'react-dev-utils/WebpackDevServerUtils';
import chalk from 'chalk';
import clearConsole from 'react-dev-utils/clearConsole';
import errorOverlayMiddleware from 'react-error-overlay/middleware';
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages';
import ms from 'ms';
import openBrowser from 'react-dev-utils/openBrowser';
import rimraf from 'rimraf';
import url from 'url';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import configure from './configure';
import printInstructions from './printInstructions';
import Progress from './Progress';
import ServerManager from './ServerProcessManager';
import { UnexpectedServerTerminationError, ServerSpawnFailureError } from './spawnServer';
import type { ServerManagerInterface } from './types';

// crash on unhandledRejection
process.on('unhandledRejection', (err: Error) => {
  throw err;
});

const isInteractive = (process.stdout: any).isTTY;
const srcDir = process.argv.slice(3).find(arg => !arg.startsWith('--')) || 'src';
const workDir: ?string = process.argv[2];

if (workDir == null) {
  throw new Error('Please provide workDir path as the first argument');
}

async function start(dir: string, sourceDir: string) {
  const useBabili = !!parseInt(process.env.SPUST_USE_BABILI || '0', 10);
  const doNotOpenBrowser = process.env.SPUST_DO_NOT_OPEN_BROWSER ? true : false;
  const DEFAULT_PORT = parseInt(process.env.WEBPACK_PORT, 10) || 2999;
  const DEFAULT_SERVER_PORT = parseInt(process.env.PORT, 10) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';
  const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
  let isCompiled = false;

  const webpackPort: number = await choosePort(HOST, DEFAULT_PORT);
  const serverPort: number = await choosePort(HOST, DEFAULT_SERVER_PORT);
  const urls = prepareUrls(protocol, HOST, webpackPort);

  // set server port to env so we can use it in env variables for webpack
  process.env.PORT = String(serverPort);

  const serverManager: ServerManagerInterface = new ServerManager(serverPort, dir);

  // close server manager on termination
  ['SIGINT', 'SIGTERM'].forEach(signal =>
    process.on(signal, () => {
      serverManager.close();
      process.exit();
    }),
  );

  let config = await configure({
    workDir: dir,
    srcDir: sourceDir,
    env: 'development',
    serverManager,
    useBabili,
  });

  // override configuration using own configure
  const configPath = resolvePath(workDir, './spust.config.js');

  try {
    // dost spust.config.js file exist?
    await stat(configPath);

    delete require.cache[require.resolve(configPath)];
    let customConfigure = require(configPath);

    config = customConfigure(config, {
      workDir: dir,
      srcDir: sourceDir,
      env: 'development',
      serverManager,
    });
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  rimraf.sync(resolvePath(workDir, 'bundle'));

  const compiler = webpack([config.client, config.server]);
  const target = `http://localhost:${serverPort}`;

  const progress = new Progress(compiler.compilers);

  compiler.plugin('invalid', () => {
    // clear only after first done pass
    if (isInteractive && isCompiled) {
      clearConsole();
    }

    progress.start();
  });

  compiler.plugin('done', async stats => {
    let hasWarnings = false;
    let warnings = '';

    progress.stop();

    if (isInteractive) {
      clearConsole();
    }

    const [clientStats, serverStats] = stats.stats;

    const clientMessages: {
      errors: Array<string>,
      warnings: Array<string>,
    } = formatWebpackMessages(clientStats.toJson({}, true));
    const serverMessages: {
      errors: Array<string>,
      warnings: Array<string>,
    } = formatWebpackMessages(serverStats.toJson({}, true));

    if (clientMessages.errors.length || serverMessages.errors.length) {
      console.log(chalk.red('⚠️  Failed to compile.\n'));
      console.log([...clientMessages.errors, ...serverMessages.errors].join('\n'));
      console.log(chalk.cyan('ℹ️  Keeping previous server instance running'));
      return;
    }

    if (clientMessages.warnings.length || serverMessages.warnings.length) {
      hasWarnings = true;
      warnings = [...clientMessages.warnings, ...serverMessages.warnings].join('\n');
    }

    const resultColor = hasWarnings ? 'yellow' : 'green';
    const resultState = isCompiled ? 'Updated' : 'Compiled';
    const resultMessage = hasWarnings ? 'with warnings' : 'successfully';

    console.log(chalk[resultColor](`🎉  ${resultState} ${resultMessage}!`));

    if (warnings.length > 1) {
      console.log(warnings);
    }

    // now check if in ServerManager has any errors from management
    // if yes, then output readable message about it
    if (!serverManager.isRunning()) {
      if (serverManager.lastSpawnErrors().length > 0) {
        console.log(chalk.red('⚠️  Server is not running, see errors:\n'));

        serverManager.lastSpawnErrors().forEach(e => {
          console.log(e.message);
          console.log();

          if (e instanceof UnexpectedServerTerminationError) {
            console.log(e.stderr);
          } else if (e instanceof ServerSpawnFailureError) {
            console.log(e.stderr);
          }

          console.log();
        });
      } else {
        console.log(chalk.red('⚠️  Server is not running because of an unkown error!\n'));
      }
    } else {
      if (serverManager.lastSpawnErrors().length > 0) {
        console.log(chalk.red('⚠️  Failed to spawn a new server for your backend, see errors:\n'));

        serverManager.lastSpawnErrors().forEach(e => {
          console.log(e.message);
          console.log();

          if (e instanceof UnexpectedServerTerminationError) {
            console.log(e.stderr);
          } else if (e instanceof ServerSpawnFailureError) {
            console.log(e.stderr);
          }

          console.log();
        });

        console.log(chalk.cyan('ℹ️  Keeping previous server running.'));
      }

      // if apps wasn't compiled yet, open browser (if user's did not tell otherwise)
      if (!doNotOpenBrowser && !isCompiled) {
        openBrowser(
          url.format({
            protocol,
            hostname: 'localhost',
            port: webpackPort,
          }),
        );
      }

      // print nice info :)
      printInstructions(urls);
    }

    // clear last spawn errors
    serverManager.clearSpawnErrors();

    // set flag that it has been successfully compiled
    // so in next builds it will result to Updated and not Compiled
    isCompiled = true;
  });

  progress.start();

  const devServer = new WebpackDevServer(compiler, {
    contentBase: resolvePath(__dirname, '../'),
    clientLogLevel: 'none',
    compress: true,
    historyApiFallback: {
      disableDotRule: true,
    },
    hot: true,
    noInfo: true,
    overlay: false,
    proxy: [
      () => ({
        context: '/static',
        logLevel: 'silent',
        target: url.format({
          protocol,
          hostname: 'localhost',
          port: webpackPort,
        }),
        pathRewrite: path => path.replace('static', 'client/static'),
      }),
      () => ({
        context: pathname =>
          pathname.indexOf('sockjs-node') === -1 &&
          pathname.indexOf('hot-update.json') === -1 &&
          pathname.indexOf('hot-update.js') === -1,
        // wait for 10 minutes in case that server has error, so user can fix it :)
        proxyTimeout: ms('10 minutes'),
        target,
        logLevel: 'silent',
        onProxyReq: proxyReq => {
          if (proxyReq.getHeader('origin')) {
            proxyReq.setHeader('origin', target);
          }
        },
        onError: (err, req, res) => {
          const host = req.headers && req.headers.host;
          console.log(
            chalk.red('⚠️  Proxy error:') +
              ' Could not proxy request ' +
              chalk.cyan(req.url) +
              ' from ' +
              chalk.cyan(host) +
              ' to ' +
              chalk.cyan(target) +
              '.',
          );
          console.log(
            'See https://nodejs.org/api/errors.html#errors_common_system_errors for more information (' +
              chalk.cyan(err.code) +
              ').',
          );
          console.log();

          // And immediately send the proper error response to the client.
          // Otherwise, the request will eventually timeout with ERR_EMPTY_RESPONSE on the client side.
          if (res.writeHead && !res.headersSent) {
            res.writeHead(500);
          }
          res.end('⚠️  Proxy error: Could not proxy request');
        },
        secure: false,
        changeOrigin: true,
        ws: true,
        xfwd: true,
      }),
    ],
    publicPath: config.client.output.publicPath,
    quiet: true,
    setup(app) {
      // This lets us open files from the runtime error overlay.
      app.use(errorOverlayMiddleware());
    },
    watchOptions: {
      ignored: /bundle|node_modules/,
    },
  });

  devServer.listen(webpackPort, HOST, err => {
    if (err) {
      return console.log(err);
    }

    if (isInteractive) {
      clearConsole();
    }

    console.log(chalk.cyan('🚀  Starting the development server...'));

    if (!doNotOpenBrowser) {
      console.log(chalk.cyan('ℹ️  I will open the browser after successful compilation.'));
    }

    console.log();
  });

  ['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      devServer.close();
      process.exit();
    });
  });
}

start(workDir, srcDir).catch(e => {
  console.log(e);
  process.exit(1);
});
