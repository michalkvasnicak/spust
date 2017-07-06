// @flow

import find from 'port-pid';
import { fork } from 'child_process';

function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export default function spawnServer(
  filepath: string,
  cwd: string,
  port?: number = 3000,
  retryLimit?: number = 10,
) {
  return new Promise(async (resolve, reject) => {
    try {
      const proc = fork(filepath, {
        cwd,
        stdio: [null, null, null, 'ipc'],
      });

      function finish(error: ?Error) {
        proc.removeAllListeners('error');
        proc.removeAllListeners('exit');

        if (error != null) {
          reject(error);
        } else {
          resolve(proc);
        }
      }

      proc.once('error', e => {
        finish(e);
      });

      proc.once('exit', code => {
        if (code !== 0) {
          finish(new Error(`Server exited with the error code ${code}`));
        } else {
          finish(new Error('Unexpected server termination'));
        }
      });

      let retries = 0;

      do {
        const pids = await find(port);

        if (pids.all.length === 0) {
          // nothing is listening , or there is an error
        } else if (!(pids.all.includes(proc.pid) || pids.all.includes(String(proc.pid)))) {
          throw new Error(`Unknown process is listening on port ${port}`);
        } else {
          return finish();
        }

        retries += 1;
        await sleep(1000);
      } while (retries < retryLimit);

      throw new Error(`Your server is not listening on port ${port}`);
    } catch (e) {
      reject(e);
    }
  });
}
