// @flow

// crash on unhandledRejection
process.on('unhandledRejection', err => {
  throw err;
});

const net = require('net');
// prettier-ignore
const server = eval("__SERVER_CODE__");

/*::
type ShutdownableServer = net$Server & {
  isOpening(): boolean,
  forceShutdown(): Promise<void>,
};
*/

const serverInstance /*: net$Server */ = server ? server.default || server : server;

if (!(serverInstance instanceof net.Server)) {
  throw new Error(
    `
  Server bundle did not export a server listener.
  Server listener must be an instance of net.Server or http.Server.
  Please export a http listener using export default syntax.
  `.trim(),
  );
}

['SIGTERM', 'SIGINT'].forEach(signal =>
  process.on(signal, () => {
    // prettier-ignore
    ((serverInstance /*: any */) /*: ShutdownableServer */).forceShutdown();
    process.exit();
  }),
);

serverInstance.once('listening', () => {
  // check if server is listening on a port we specified in start.js
  const port = parseInt(process.env.PORT, 10);

  const address = serverInstance.address();

  if (address != null && address.port !== port) {
    // send error message that ports don't match
    process.send &&
      process.send(`Spust: server is listening on port ${address.port} and not ${port}`);
  } else {
    // send our specific message to IPC
    process.send && process.send('Spust: server listening');
  }
});
