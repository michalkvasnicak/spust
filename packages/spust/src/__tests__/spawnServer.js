// @flow

import { type ChildProcess } from 'child_process';
import { resolve } from 'path';
import terminate from '../terminate';
import spawnServer, {
  PortIsOccupiedError,
  ServerSpawnFailureError,
  UnexpectedServerTerminationError,
} from '../spawnServer';

describe('spawnServer', () => {
  let proc: ?ChildProcess;

  afterEach(async () => {
    if (proc) {
      await terminate(proc.pid, 10000, 'SIGKILL');
      proc = null;
    }
  });

  it('throws if server terminates unexpectedly with code !== 0', async () => {
    try {
      await spawnServer(resolve(__dirname, '../__fixtures__/not-a-server.js'), __dirname);
      throw new Error('Did not throw');
    } catch (e) {
      expect(e).toBeInstanceOf(UnexpectedServerTerminationError);
      expect(e.stderr).toBe('');
      expect(e.stdout).toBe('');
    }
  });

  it('throws if server terminates unexpectedly with code === 0', async () => {
    try {
      await spawnServer(resolve(__dirname, '../__fixtures__/spawn-failure.js'), __dirname);
      throw new Error('Did not throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ServerSpawnFailureError);
      expect(e.stderr).not.toBe('');
      expect(e.stdout).toBe('');
    }
  });

  it('throws if there is another process listening on that port', async () => {
    proc = await spawnServer(resolve(__dirname, '../__fixtures__/test-server.js'), __dirname);

    await expect(
      spawnServer(resolve(__dirname, '../__fixtures__/test-server.js'), __dirname),
    ).rejects.toEqual(new PortIsOccupiedError(proc.pid, 3000));
  });

  it('spawns server correctly', async () => {
    proc = await spawnServer(resolve(__dirname, '../__fixtures__/test-server.js'), __dirname);

    expect(proc).toBeDefined();
  });

  it('spawns server (slow, with retries)', async () => {
    proc = await spawnServer(resolve(__dirname, '../__fixtures__/slow-server.js'), __dirname, 3001);

    expect(proc).toBeDefined();
  });
});
