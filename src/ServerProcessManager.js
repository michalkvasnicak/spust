// @flow

import mkdirp from 'mkdirp';
import { fork } from 'child_process';
import { resolve as resolvePath } from 'path';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import terminate from 'terminate';

export default class ServerProcessManager {
  currentServer: ?child_process$ChildProcess;
  currentServerCodeFile: ?string;
  spawnErrors: Array<Error> = [];
  port: number;
  serverProcessTemplate: string = readFileSync(
    resolvePath(__dirname, './serverProcessTemplate.js'),
    { encoding: 'utf8' },
  );
  workingDirectory: string;

  constructor(port?: number = 3000, workingDirectory: string) {
    this.port = port;
    this.workingDirectory = workingDirectory;
  }

  async spawnServer(serverFile: string): Promise<child_process$ChildProcess> {
    // reset spawn errors
    this.spawnErrors = [];

    try {
      const proc = await new Promise((resolve, reject) => {
        try {
          const serverProcess = fork(serverFile, [], {
            cwd: this.workingDirectory,
            env: process.env,
            // ignore stdout because we don't want output of console.log
            stdio: [null, 'ignore', null, 'ipc'],
          });

          serverProcess.on('exit', code => {
            serverProcess.removeAllListeners('error');
            serverProcess.removeAllListeners('exit');
            serverProcess.removeAllListeners('message');

            if (code !== 0) {
              reject(new Error(`Server exited with the error code ${code}`));
            } else {
              reject(new Error('Unexpected server termination'));
            }
          });

          serverProcess.on('error', e => {
            serverProcess.removeAllListeners('error');
            serverProcess.removeAllListeners('exit');
            serverProcess.removeAllListeners('message');

            reject(e);
          });

          serverProcess.on('message', msg => {
            if (msg === 'Spust: server listening') {
              serverProcess.removeAllListeners('error');
              serverProcess.removeAllListeners('exit');
              serverProcess.removeAllListeners('message');

              resolve(serverProcess);
            } else {
              reject(new Error(`Unknown message ${JSON.stringify(msg, null, '\t')}`));
            }
          });
        } catch (e) {
          reject(e);
        }
      });

      return proc;
    } catch (e) {
      this.spawnErrors.push(e);

      throw e;
    }
  }

  isRunning() {
    return this.currentServer != null;
  }

  async killServer(): Promise<void> {
    const server = this.currentServer;

    return new Promise((resolve, reject) => {
      if (server == null) {
        return resolve();
      }

      terminate(server.pid, { timeout: 30000 }, err => (err ? reject(err) : resolve()));
    });
  }

  lastSpawnErrors() {
    return this.spawnErrors;
  }

  async manage(newServerCode: string, bundleDirectory: string) {
    // create a new file with
    const serverCode = this.serverProcessTemplate.replace(
      // hack, I don't want to waste time trying which combination works for interpolation
      '"__SERVER_CODE__"',
      JSON.stringify(newServerCode.toString()),
    );

    // now save it to the bundle dir
    const serverCodeFile = resolvePath(bundleDirectory, `./server.${Date.now()}.js`);

    try {
      mkdirp.sync(bundleDirectory);
      writeFileSync(serverCodeFile, serverCode);

      // now kill previous server
      await this.killServer();

      this.currentServer = null;

      const serverProc = await this.spawnServer(serverCodeFile);

      // remove previous server code file
      if (this.currentServerCodeFile) {
        unlinkSync(this.currentServerCodeFile);
        this.currentServerCodeFile = null;
      }

      this.currentServerCodeFile = serverCodeFile;
      this.currentServer = serverProc;
    } catch (e) {
      // remove new server code
      if (existsSync(serverCodeFile)) {
        unlinkSync(serverCodeFile);
      }

      // respawn previous instance
      if (this.currentServerCodeFile) {
        const serverProc = await this.spawnServer(this.currentServerCodeFile);

        this.currentServer = serverProc;
      } else {
        throw e;
      }
    }
  }

  async close() {
    await this.killServer();

    this.currentServer = null;

    // remove server code
    if (this.currentServerCodeFile) {
      unlinkSync(this.currentServerCodeFile);
      this.currentServerCodeFile = null;
    }
  }
}
