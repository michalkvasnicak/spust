// @flow

import { spawnSync } from 'child_process';
import rimraf from 'rimraf';
import { resolve as resolvePath } from 'path';

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

  it('works correctly', () => {
    const workDir = resolvePath(__dirname, '../');
    const srcDir = 'fixtures/test';

    // make sure we have compiled sources
    const proc = spawnSync(resolvePath(__dirname, '../bin/spust'), ['build', srcDir], {
      cwd: workDir,
    });

    expect(proc.status).toBe(0);
    expect(Buffer.from(proc.stdout).toString('utf8').trim()).toMatchSnapshot();
    expect(Buffer.from(proc.stderr).toString('utf8').trim()).toMatchSnapshot();
  });
});
