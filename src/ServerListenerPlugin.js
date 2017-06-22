// @flow

import path from 'path';

import type { ServerManagerInterface } from './types';

module.exports = class ServerListenerPlugin {
  serverManager: Object;

  constructor(serverManager: ServerManagerInterface) {
    this.serverManager = serverManager;

    ['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => this.serverManager.close()));
  }

  apply(compiler: Object): void {
    // probably this isn't a right place to do server management
    // but done does not care about async
    // and we have to wait on our server to listen
    // so when done is called in start.js we can be sure that when browser opens, it won't result in
    // error 504
    compiler.plugin('after-emit', async (compilation: any, cb: Function) => {
      const serverBundle = compilation.compiler.outputPath;
      const serverBuildPath = path.resolve(serverBundle, compiler.options.output.filename);

      const serverSource = Buffer.from(
        compilation.compiler.outputFileSystem.readFileSync(serverBuildPath),
      ).toString('utf8');

      try {
        await this.serverManager.manage(serverSource, serverBundle);
      } catch (e) {
        // we don't care about errors, they are stored in internal state of ServerManager
      } finally {
        cb();
      }
    });
  }
};
