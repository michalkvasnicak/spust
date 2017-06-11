// @flow

import { Server } from 'net';

export type ShutdownableServer = net$Server & {
  opening: boolean,
  forceShutdown(cb: Function): void,
  shutdown(cb: Function): void,
};

async function listen(server: ShutdownableServer, port: number) {
  return new Promise((resolve, reject) => {
    function _error(e: Error) {
      reject(e);
    }

    function _listen() {
      resolve();
      server.removeListener('error', _error);
    }

    server.on('error', _error);
    // $FlowExpectError
    server.listen(port, _listen);
  });
}

async function shutdown(server: ShutdownableServer) {
  return new Promise(resolve => server.forceShutdown(resolve));
}

async function waitForListen(server: ShutdownableServer, timeout: number = 5000) {
  return new Promise((resolve, reject) => {
    let tmt = setTimeout(() => {
      clearTimeout(tmt);
      tmt = null;

      server.removeListener('error', error);
      server.removeListener('listening', listening);

      resolve();
    }, timeout);

    function error(e: Error) {
      server.removeListener('listening', listening);

      if (tmt === null) {
        return;
      }
      clearTimeout(tmt);
      tmt = null;

      reject(e);
    }

    function listening() {
      server.removeListener('error', error);

      if (tmt == null) {
        return;
      }

      clearTimeout(tmt);
      tmt = null;

      resolve();
    }

    server.on('error', error);
    server.on('listening', listening);
  });
}

export default async function serverReplacer(
  previousServer: ?ShutdownableServer,
  nextServerCode: string,
  port: number,
): Promise<ShutdownableServer> {
  // shutdown previous server
  if (previousServer != null) {
    await shutdown(previousServer);
  }

  // now instantiate next server
  let compiledServer: any;
  const originalConsoleLog = console.log;
  // $FlowExpectError
  console.log = () => {};

  try {
    compiledServer = eval(nextServerCode);

    if (compiledServer == null || !((compiledServer.default || compiledServer) instanceof Server)) {
      throw new Error(
        `
  Server bundle did not export a server listener.
  Server listener must be an instance of net.Server or http.Server.
  Please export a http listener using export default syntax.
      `.trim(),
      );
    }

    const nextServer: ShutdownableServer = compiledServer.default || compiledServer;

    // wait for nextServer to listen
    if (nextServer.opening) {
      // wait until is listening
      await waitForListen(nextServer);

      // now shutdown server
      await shutdown(nextServer);

      // now open new server again with our port
      try {
        await listen(nextServer, port);
      } catch (e) {
        // if it fails, relisten previous server
        console.log(e);

        if (previousServer != null) {
          await listen(previousServer, port);

          return previousServer;
        } else {
          throw e;
        }
      }
    } else {
      // server is not opening, so we can easily listen
      await listen(nextServer, port);
    }

    return nextServer;
  } catch (e) {
    if (previousServer != null) {
      await listen(previousServer, port);

      return previousServer;
    } else {
      throw e;
    }
  } finally {
    // $FlowExpectError
    console.log = originalConsoleLog;
  }
}
