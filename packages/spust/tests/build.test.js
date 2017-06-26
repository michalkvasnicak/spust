// @flow

import { spawnSync } from 'child_process';
import rimraf from 'rimraf';
import { resolve as resolvePath } from 'path';

describe('build script', () => {
  it('works correctly', () => {
    const workDir = resolvePath(__dirname, '../');
    const srcDir = 'fixtures/test';

    // make sure we have compiled sources
    const proc = spawnSync(resolvePath(__dirname, '../bin/spust'), ['build', srcDir], {
      cwd: workDir,
    });

    expect(Buffer.from(proc.stdout).toString('utf8').trim()).toMatchSnapshot();
    expect(Buffer.from(proc.stderr).toString('utf8').trim()).toMatchSnapshot();
    expect(proc.status).toBe(0);
  });
});
