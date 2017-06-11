// @flow

import path from 'path';
import ServerManager from './ServerManager';

module.exports = class ServerListenerPlugin {
  serverManager: Object;

  constructor(serverManager: ServerManager) {
    this.serverManager = serverManager;

    ['SIGINT', 'SIGTERM'].forEach(signal => process.on(signal, () => this.serverManager.close()));
  }

  apply(compiler: Object): void {
    compiler.plugin('done', async stats => {
      if (stats.hasErrors()) {
        console.error('Server compiled with errors, keeping previous server instance running');
        return;
      }

      // Clear out all files from this build
      Object.keys(require.cache).forEach(modulePath => {
        if (modulePath.indexOf(compiler.options.output.path) === 0) {
          delete require.cache[modulePath];
        }
      });

      const serverBuildPath = path.resolve(
        compiler.options.output.path,
        compiler.options.output.filename,
      );

      const serverSource = Buffer.from(
        stats.compilation.compiler.outputFileSystem.readFileSync(serverBuildPath),
      ).toString('utf8');

      await this.serverManager.manage(serverSource);
    });
  }
};
