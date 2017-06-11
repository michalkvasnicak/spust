#!/usr/bin/env node
// @flow

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

import { resolve as resolvePath } from 'path';
import { stat } from 'mz/fs';
import { choosePort } from 'react-dev-utils/WebpackDevServerUtils';
import chalk from 'chalk';
import clearConsole from 'react-dev-utils/clearConsole';
import errorOverlayMiddleware from 'react-error-overlay/middleware';
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages';
import openBrowser from 'react-dev-utils/openBrowser';
import Progress from './Progress';
import proxy from 'http-proxy-middleware';
import rimraf from 'rimraf';
import ServerManager from './ServerManager';
import url from 'url';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import configure from './configure';

// crash on unhandledRejection
process.on('unhandledRejection', err => {
  throw err;
});

// $FlowExpectError
const isInteractive = process.stdout.isTTY;
const srcDir = process.argv[3] || 'src';
const workDir: ?string = process.argv[2];

if (workDir == null) {
  throw new Error('Please provide workDir path as the first argument');
}

async function start(dir: string, sourceDir: string) {
  const DEFAULT_PORT = parseInt(process.env.WEBPACK_PORT) || 2999;
  const DEFAULT_SERVER_PORT = parseInt(process.env.PORT, 10) || 3000;
  const HOST = process.env.HOST || 'localhost';
  const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
  let isCompiled = false;

  const webpackPort: number = await choosePort(HOST, DEFAULT_PORT);
  const serverPort: number = await choosePort(HOST, DEFAULT_SERVER_PORT);

  // set server port to env so we can use it in env variables for webpack
  process.env.PORT = String(serverPort);

  const serverManager = new ServerManager(serverPort);

  let config = await configure({
    workDir: dir,
    srcDir: sourceDir,
    env: 'development',
    serverManager,
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

  await new Promise((resolve, reject) =>
    rimraf(resolvePath(workDir, 'bundle'), err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }),
  );

  // because ServerListenerPlugin is overriding console.log so your server script can't output
  // anything using console.log until the management of server is done by ServerManager
  const log = console.log;

  const compiler = webpack([config.client, config.server]);
  const target = `http://localhost:${serverPort}`;

  const progress = new Progress(compiler.compilers);

  compiler.plugin('invalid', () => {
    if (isInteractive) {
      clearConsole();
    }

    progress.start();
  });

  compiler.plugin('done', stats => {
    isCompiled = true;
    progress.stop();

    if (isInteractive) {
      clearConsole();
    }

    const [clientStats, serverStats] = stats.stats;

    const clientMessages = formatWebpackMessages(clientStats.toJson({}, true));
    const serverMessages = formatWebpackMessages(serverStats.toJson({}, true));

    if (clientMessages.errors.length || serverMessages.errors.length) {
      log(chalk.red('Failed to compile.\n'));
      log([...clientMessages.errors, ...serverMessages.errors].join('\n'));
      return;
    }

    if (clientMessages.warnings.length || serverMessages.warnings.length) {
      log(chalk.yellow('Compiled with warnings.\n'));
      log([...clientMessages.warnings, ...serverMessages.warnings].join('\n\n'));
    }

    if (
      !clientMessages.errors.length &&
      !serverMessages.errors.length &&
      !clientMessages.warnings.length &&
      !serverMessages.warnings.length
    ) {
      if (isCompiled) {
        log(chalk.green('Compiled successfully!'));
      } else {
        log(chalk.green('Updated successfully!'));
      }
    }
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
          pathname.indexOf('sockjs-node') === -1 && pathname.indexOf('hot-update.json') === -1,
        target,
        logLevel: 'silent',
        onProxyReq: proxyReq => {
          if (proxyReq.getHeader('origin')) {
            proxyReq.setHeader('origin', target);
          }
        },
        onProxyError: (err, req, res) => {
          const host = req.headers && req.headers.host;
          log(
            chalk.red('Proxy error:') +
              ' Could not proxy request ' +
              chalk.cyan(req.url) +
              ' from ' +
              chalk.cyan(host) +
              ' to ' +
              chalk.cyan(target) +
              '.',
          );
          log(
            'See https://nodejs.org/api/errors.html#errors_common_system_errors for more information (' +
              chalk.cyan(err.code) +
              ').',
          );
          log();

          // And immediately send the proper error response to the client.
          // Otherwise, the request will eventually timeout with ERR_EMPTY_RESPONSE on the client side.
          if (res.writeHead && !res.headersSent) {
            res.writeHead(500);
          }
          res.end('Proxy error: Could not proxy request');
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
      ignored: /node_modules/,
    },
  });

  devServer.listen(webpackPort, HOST, err => {
    if (err) {
      return log(err);
    }

    if (isInteractive) {
      clearConsole();
    }

    log(chalk.cyan('Starting the development server...\n'));

    if (process.env.SPUST_DO_NOT_OPEN_BROWSER) {
      return;
    }

    openBrowser(
      url.format({
        protocol,
        hostname: 'localhost',
        port: webpackPort,
      }),
    );
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
