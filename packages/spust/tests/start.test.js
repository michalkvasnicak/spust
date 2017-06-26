// @flow

import rimraf from 'rimraf';
import terminate from 'terminate';
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
    // eslint-disable-next-line
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
    const workDir = resolvePath(__dirname, '../');
    const srcDir = 'fixtures/test';

    // make sure we have compiled sources
    const proc: child_process$ChildProcess = await spawn(
      resolvePath(__dirname, '../bin/spust'),
      ['start', srcDir],
      {
        env: {
          ...process.env,
          HOST: 'localhost',
        },
        cwd: workDir,
      },
    );

    const output = [];
    const errorOutput = [];

    proc.stderr.on('data', data => errorOutput.push(data));

    await new Promise(resolve => {
      proc.stdout.on('data', data => {
        output.push(data);

        if (output.join('').indexOf('Compiled successfully!') !== -1) {
          resolve();
        }
      });
    });

    // now kill process
    await new Promise((resolve, reject) =>
      terminate(proc.pid, err => (err ? reject(err) : resolve())),
    );

    expect(output.join('').trim()).toMatchSnapshot();
    expect(errorOutput.join('').trim()).toMatchSnapshot();
  });
});
