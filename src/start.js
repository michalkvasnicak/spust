#!/usr/bin/env node
// @flow

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

import { resolve as resolvePath } from 'path';
import { stat } from 'mz/fs';
import { choosePort } from 'react-dev-utils/WebpackDevServerUtils';
import chalk from 'chalk';
import clearConsole from 'react-dev-utils/clearConsole';
import openBrowser from 'react-dev-utils/openBrowser';
import rimraf from 'rimraf';
import ServerManager from './ServerManager';
import url from 'url';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import configure from './configure';

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

    config = customConfigure(config);
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

  console.log('Started build process');

  const compiler = webpack([config.client, config.server]);
  const target = `http://localhost:${serverPort}`;

  const devServer = new WebpackDevServer(compiler, {
    clientLogLevel: 'none',
    noInfo: true,
    proxy: {
      '!(/__webpack_hmr|**/*.*)': {
        target,
        // logLevel: 'silent',
        onProxyReq: proxyReq => {
          if (proxyReq.getHeader('origin')) {
            proxyReq.setHeader('origin', target);
          }
        },
        onProxyError: (err, req, res) => {
          const host = req.headers && req.headers.host;
          console.log(
            chalk.red('Proxy error:') +
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
          res.end('Proxy error: Could not proxy request');
        },
        secure: false,
        changeOrigin: true,
        ws: true,
        xfwd: true,
      },
    },
  });

  devServer.listen(webpackPort, HOST, err => {
    if (err) {
      return console.log(err);
    }
    if (isInteractive) {
      clearConsole();
    }
    console.log(chalk.cyan('Starting the development server...\n'));
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
