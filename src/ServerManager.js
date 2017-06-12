// @flow

import serverReplacer, { type ShutdownableServer } from './helpers/serverReplacer';

export default class ServerManager {
  port: number;
  server: ?ShutdownableServer;

  constructor(forcePort?: number = 3000) {
    this.port = forcePort;
  }

  async manage(serverCode: string) {
    const port = this.port;

    // replace previous server with next
    const runningServer = await serverReplacer(this.server, serverCode, port);

    runningServer.unref();

    this.server = runningServer;
  }

  async close() {
    const server = this.server;

    if (server) {
      await server.forceShutdown();

      this.server = null;
    }
  }
}
