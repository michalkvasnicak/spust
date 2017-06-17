#!/usr/bin/env node
// @flow

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

import { resolve as resolvePath } from 'path';
import { stat } from 'mz/fs';
import clearConsole from 'react-dev-utils/clearConsole';
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages';
import chalk from 'chalk';
import rimraf from 'rimraf';
import Progress from './Progress';
import webpack from 'webpack';

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

async function build(dir: string, sourceDir: string) {
  const useBabili = !!parseInt(process.env.SPUST_USE_BABILI || '0', 10);
  let config = await configure({ workDir: dir, srcDir: sourceDir, env: 'production', useBabili });

  // override configuration using own configure
  const configPath = resolvePath(workDir, './spust.config.js');

  try {
    // dost spust.config.js file exist?
    await stat(configPath);

    delete require.cache[require.resolve(configPath)];
    let customConfigure = require(configPath);

    config = customConfigure(config, { workDir: dir, srcDir: sourceDir, env: 'production' });
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

  return await new Promise((resolve, reject) => {
    const compiler = webpack([config.client, config.server]);
    const progress = new Progress(compiler.compilers);
    progress.start();

    compiler.run((err, stats) => {
      progress.stop();

      if (isInteractive) {
        clearConsole();
      }

      if (err) {
        reject(err.stack || err);
        return;
      }

      const [clientStats, serverStats] = stats.stats;

      const clientMessages = formatWebpackMessages(clientStats.toJson({}, true));
      const serverMessages = formatWebpackMessages(serverStats.toJson({}, true));

      if (clientMessages.errors.length || serverMessages.errors.length) {
        console.log(chalk.red('Failed to compile.\n'));
        console.log([...clientMessages.errors, ...serverMessages.errors].join('\n'));
        reject();
        return;
      }

      if (clientMessages.warnings.length || serverMessages.warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'));
        console.log([...clientMessages.warnings, ...serverMessages.warnings].join('\n\n'));
      }

      resolve();
    });
  });
}

build(workDir, srcDir)
  .then(() => {
    console.log(chalk.green('Successfully built. See bundle directory.'));

    process.exit(0);
  })
  .catch(e => {
    if (e) {
      console.log(e);
    }

    process.exit(1);
  });
