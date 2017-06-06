// @flow

import rimraf from 'rimraf';
import { resolve as resolvePath } from 'path';
import { spawn } from 'mz/child_process';

describe('build script', () => {
  afterEach(() =>
    Promise.all([
      new Promise((resolve, reject) =>
        rimraf(
          resolvePath(__dirname, './fixtures/valid/bundle'),
          err => (err ? reject(err) : resolve()),
        ),
      ),
      new Promise((resolve, reject) =>
        rimraf(
          resolvePath(__dirname, './fixtures/invalid/bundle'),
          err => (err ? reject(err) : resolve()),
        ),
      ),
    ]),
  );

  it('works correctly', async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
    const workDir = resolvePath(__dirname, '../');
    const srcDir = 'fixtures/test';

    // make sure we have compiled sources
    const proc: child_process$ChildProcess = await spawn(
      resolvePath(__dirname, '../bin/spust'),
      ['build', srcDir],
      {
        cwd: workDir,
      },
    );

    const output = [];
    const errorOutput = [];

    proc.stdout.on('data', data => output.push(data));
    proc.stderr.on('data', data => errorOutput.push(data));

    const code = await new Promise(resolve => {
      proc.on('exit', resolve);
    });

    expect(output.join('')).toMatchSnapshot();
    expect(errorOutput.join('')).toMatchSnapshot();
    expect(code).toBe(0);
  });
});
