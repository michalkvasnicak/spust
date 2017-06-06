// @flow

import { Server } from 'net';

export default class ServerManager {
  port: ?number;
  server: ?net$Server;
  socketId: number;
  sockets: Map<number, net$Socket>;

  constructor(forcePort?: ?number) {
    this.socketId = 0;
    this.sockets = new Map();
    this.port = forcePort;
  }

  async manage(server: ?net$Server) {
    const port = this.port;

    if (server == null || !(server instanceof Server)) {
      throw new Error(
        `
  Server bundle did not export a server listener.
  Server listener must be an instance of net.Server or http.Server.
  Please export a http listener using export default syntax.
    `,
      );
    }

    if (this.server) {
      await this.close();
    }

    this.server = server;

    await new Promise(async (resolve, reject) => {
      if (server == null) {
        return reject(new Error('Server is not set'));
      }

      // if server is already listening and we have port set, close listener and use our own port
      let address = server.address();

      // if server is not listening, then wait for it to listen and then force our port
      if (address == null) {
        // wait only 3 seconds for server to listen
        await new Promise((resolve, reject) => {
          let timeout = setTimeout(resolve, 3000);

          if (server) {
            server.on('listening', () => {
              timeout = clearTimeout(timeout);
              resolve();
            });
          } else {
            reject(new Error('Server is not set'));
          }
        });
      }

      address = server.address();

      if (address != null && port != null && address.port !== port) {
        // force our port
        let tmt = setTimeout(
          () => reject(new Error(`Forcing server to listen on the port ${port} failed.`)),
          3000,
        );

        server.on('error', reject);

        server.close(() => {
          tmt = clearTimeout(tmt);

          // $FlowExpectError
          server.listen(port, '0.0.0.0', undefined, () => {
            console.log('listening on port', port);
            resolve()
          });
        });
      } else if (port == null && address == null) {
        reject(new Error('Your backend server is not listening.'));
      } else {
        // server is listening and we don't want to force our port
        resolve();
      }
    });

    server.unref();

    // listen to all connections so we can destroy them on restart
    server.on('connection', (socket: net$Socket) => {
      socket.unref();

      const socketId = this.socketId++;
      this.sockets.set(socketId, socket);

      socket.on('close', () => this.sockets.delete(socketId));
    });
  }

  async close() {
    const server = this.server;

    if (server) {
      this.sockets.forEach(socket => socket.destroy());
      this.sockets.clear();

      await new Promise(resolve => server.close(resolve));

      this.server = null;
    }
  }
}
