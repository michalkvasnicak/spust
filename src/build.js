#!/usr/bin/env node
// @flow

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

import { resolve as resolvePath } from 'path';
import { stat } from 'mz/fs';
import rimraf from 'rimraf';
import webpack from 'webpack';

import configure from './configure';

const srcDir = process.argv[3] || 'src';
const workDir: ?string = process.argv[2];

if (workDir == null) {
  throw new Error('Please provide workDir path as the first argument');
}

async function build(dir: string, sourceDir: string) {
  let config = await configure({ workDir: dir, srcDir: sourceDir, env: 'production' });

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

  return await new Promise((resolve, reject) => {
    webpack([config.client, config.server], (err, stats) => {
      if (err) {
        reject(err.stack || err);
        return;
      }

      const [clientStats, serverStats] = stats.stats;

      const clientInfo = stats.toJson();
      const serverInfo = stats.toJson();

      if (clientStats.hasErrors() || serverStats.hasErrors()) {
        reject([...clientInfo.errors, ...serverInfo.errors]);
        return;
      }

      if (stats.hasWarnings()) {
        console.warn([...clientInfo.warnings, ...serverInfo.warnings]);
      }

      // log result
      resolve([clientInfo, serverInfo]);
    });
  });
}

build(workDir, srcDir)
  .then(([clientInfo, serverInfo]) => {
    process.exit(0);
  })
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
