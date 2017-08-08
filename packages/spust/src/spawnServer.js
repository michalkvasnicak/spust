// @flow

import { fork, type ChildProcess } from 'child_process';
import find from './helpers/portPid';

export function sleep(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export class ServerSpawnFailureError extends Error {
  stderr: string;
  stdout: string;

  constructor(code: number, stdout: Array<string>, stderr: Array<string>) {
    super(`Server exited with the error code ${code}`);

    this.stderr = stderr.join('');
    this.stdout = stdout.join('');
  }
}

export class UnexpectedServerTerminationError extends Error {
  stderr: string;
  stdout: string;

  constructor(stdout: Array<string>, stderr: Array<string>) {
    super('Unexpected server termination, probably you forgot to call listen()?');

    this.stderr = stderr.join('');
    this.stdout = stdout.join('');
  }
}

export class PortIsOccupiedError extends Error {
  constructor(pid: number, port: number) {
    super(`Process with PID ${pid} is already listening on port ${port}`);
  }
}

export default function spawnServer(
  filepath: string,
  cwd: string,
  port?: number = 3000,
  retryLimit?: number = 10,
): Promise<ChildProcess> {
  return new Promise(async (resolve, reject) => {
    try {
      const proc = fork(filepath, {
        cwd,
        stdio: [null, null, null, 'ipc'],
      });
      let finished = false;
      let stderr: Array<string> = [];
      let stdout: Array<string> = [];

      proc.stderr.on('data', buffer => stderr.push(buffer.toString('utf8')));
      proc.stdout.on('data', buffer => stdout.push(buffer.toString('utf8')));

      function onError(e: Error) {
        finish(e);
      }

      async function onExit(code: number) {
        // detect the cause, if there is another process listening on given port
        const pids = await find(port);

        if (!pids.all.has(proc.pid) && pids.all.size > 0) {
          return finish(new PortIsOccupiedError([...pids.all][0], port));
        }

        if (code !== 0) {
          return finish(new ServerSpawnFailureError(code, stdout, stderr));
        }

        return finish(new UnexpectedServerTerminationError(stdout, stderr));
      }

      function finish(error: ?Error) {
        proc.removeListener('error', onError);
        proc.removeListener('exit', onExit);
        proc.stdout.removeAllListeners('data');
        proc.stderr.removeAllListeners('data');

        finished = true;

        if (error != null) {
          reject(error);
        } else {
          resolve(proc);
        }
      }

      proc.once('error', onError);

      proc.once('exit', onExit);

      await sleep(1000);

      // do not poll if we are finished (error)
      if (finished) {
        return;
      }

      let retries = 0;

      do {
        const pids = await find(port);

        if (pids.all.size === 0) {
          // nothing is listening (slow server) , or there is an error
        } else if (!pids.all.has(proc.pid)) {
          throw new PortIsOccupiedError([...pids.all][0], port);
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
