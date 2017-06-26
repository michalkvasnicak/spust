#!/usr/bin/env node
// @flow
/* eslint-disable import/first */

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

import { resolve as resolvePath } from 'path';
import { writeFile, stat } from 'mz/fs';
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

const isInteractive = (process.stdout: any).isTTY;
const srcDir = process.argv.slice(3).find(arg => !arg.startsWith('--')) || 'src';
const workDir: ?string = process.argv[2];
const args = new Set(process.argv);
const outputStats = args.has('--stats');

if (workDir == null) {
  throw new Error('Please provide workDir path as the first argument');
}

async function build(dir: string, sourceDir: string, { outputStats }: { outputStats: boolean }) {
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

    compiler.run(async (err, stats) => {
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
      } else {
        console.log(chalk.green('Successfully built. See bundle directory.'));
      }

      // write stats.json if is enabled
      if (outputStats) {
        const clientStatsFile = resolvePath(dir, 'client.stats.json');
        const serverStatsFile = resolvePath(dir, 'server.stats.json');

        await Promise.all([
          writeFile(clientStatsFile, JSON.stringify(clientStats.toJson('verbose'), null, 2)),
          writeFile(serverStatsFile, JSON.stringify(serverStats.toJson('verbose'), null, 2)),
        ]);

        console.log(
          chalk.cyan('\nYou can analyze your webpack bundles. See following json files:\n'),
        );
        console.log(` client bundle stats: ${clientStatsFile}`);
        console.log(` server bundle stats: ${serverStatsFile}`);
        console.log();
        console.log(
          chalk.cyan(
            'Visit https://webpack.github.io/analyse/ and use one of the files mentioned above.',
          ),
        );
      }

      resolve();
    });
  });
}

build(workDir, srcDir, { outputStats })
  .then(() => {
    process.exit(0);
  })
  .catch(e => {
    if (e) {
      console.log(e);
    }

    process.exit(1);
  });
