// @flow

import rimraf from 'rimraf';
import { resolve as resolvePath } from 'path';
import { spawn } from 'mz/child_process';

// port used for this test
process.env.PORT = '4444';
process.env.WEBPACK_PORT = '4443';
process.env.SPUST_DO_NOT_OPEN_BROWSER = '1';

describe('start script', () => {
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
      ['start', srcDir],
      {
        cwd: workDir,
      },
    );

    const output = [];
    const errorOutput = [];

    proc.stdout.on('data', data => {
      output.push(data);

      if (output.join('').indexOf('Compiled successfully!') !== -1) {
        proc.kill('SIGINT');
      }
    });

    proc.stderr.on('data', data => errorOutput.push(data));

    const code = await new Promise(resolve => {
      proc.on('exit', resolve);
    });

    expect(output.join('').trim()).toMatchSnapshot();
    expect(errorOutput.join('').trim()).toMatchSnapshot();
    expect(code).toBe(0);
  });
});
