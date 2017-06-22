// @flow

// adds opening property to server, so we can detect if server is trying to bind
const http = require('http');
const https = require('https');

export type ShutdownableServer = net$Server & {
  isOpening(): boolean,
  forceShutdown(): Promise<void>,
};

function wrap(server: Class<net$Server>) {
  if (server.$$wrapped) {
    return;
  }

  const originalListen = server.prototype.listen;

  (server.prototype: any).onConnection = function onConnection(socket) {
    const socketId = this.socketId++;
    this.sockets[socketId] = socket;

    socket.once('close', () => {
      delete this.sockets[socketId];
    });
  };

  (server.prototype: any).isOpening = function isOpening() {
    return !!this.opening;
  };

  (server.prototype: any).setAsOpening = function setAsOpening() {
    this.opening = true;
  };

  (server.prototype: any).setAsNotOpening = function setAsNotOpening() {
    this.opening = false;

    this.removeListener('listening', setAsNotOpening);
    this.removeListener('error', setAsNotOpening);
  };

  (server.prototype: any).forceShutdown = async function shutdown() {
    return new Promise(resolve => {
      this.removeListener('connection', this.onConnection);
      this.removeListener('secureConnection', this.onConnection);

      Object.keys(this.sockets || {}).forEach(socketId => {
        this.sockets[socketId].destroy();
      });

      this.close(resolve);
    });
  };

  (server.prototype: any).listen = function listen() {
    this.setAsOpening();
    this.sockets = {};
    this.socketId = 0;

    this.on('connection', this.onConnection);
    this.on('secureConnection', this.onConnection);
    this.once('listening', this.setAsNotOpening);
    this.once('error', this.setAsNotOpening);

    return originalListen.apply(this, arguments);
  };

  (server: any).$$wrapped = true;
}

wrap(http.Server);
wrap(https.Server);
