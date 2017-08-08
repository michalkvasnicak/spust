// @flow

import chalk from 'chalk';
import mkdirp from 'mkdirp';
import terminate from './terminate';
import { resolve as resolvePath } from 'path';
import { existsSync, unlinkSync, writeFileSync } from 'fs';

import spawn from './spawnServer';

export default class ServerProcessManager {
  currentServer: ?child_process$ChildProcess;
  currentServerCodeFile: ?string;
  spawnErrors: Array<Error> = [];
  port: number;
  workingDirectory: string;

  constructor(port?: number = 3000, workingDirectory: string) {
    this.port = port;
    this.workingDirectory = workingDirectory;
  }

  async spawnServer(serverFile: string): Promise<child_process$ChildProcess> {
    try {
      const spawnedServer = await spawn(serverFile, this.workingDirectory, this.port);

      // pipe all logs
      spawnedServer.stdout.pipe(process.stdout);
      spawnedServer.stderr.pipe(process.stdout);

      return spawnedServer;
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

      // remove all exit listeners so we won't log an error after spawn
      server.removeAllListeners('exit');

      terminate(server.pid, 30000).then(resolve).catch(reject);
    });
  }

  lastSpawnErrors() {
    return this.spawnErrors;
  }

  clearSpawnErrors() {
    this.spawnErrors = [];
  }

  async manage(serverCode: string, bundleDirectory: string) {
    // now save it to the bundle dir
    const serverCodeFile = resolvePath(bundleDirectory, `./server.${Date.now()}.js`);

    try {
      // reset spawn errors
      this.spawnErrors = [];
      mkdirp.sync(bundleDirectory);
      writeFileSync(serverCodeFile, serverCode);

      // now kill previous server
      await this.killServer();

      this.currentServer = null;

      const serverProc = await this.spawnServer(serverCodeFile);

      serverProc.once('exit', (code: number) => {
        console.log(chalk.red(`Server unexpectedly terminated with the code ${code}`));
      });

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
