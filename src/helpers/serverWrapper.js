// @flow

// adds opening property to server, so we can detect if server is trying to bind
const shutdownable = require('http-shutdown');
const http = require('http');
const https = require('https');
const originalHttpCreateServer = http.createServer;
const originalHttpsCreateServer = https.createServer;

function wrap(server: net$Server) {
  const newServer = shutdownable(server);
  const originalListen = newServer.listen;

  newServer.opening = false;

  // if server is already listening, then just return it
  if (newServer.address() !== null) {
    return newServer;
  }

  newServer.listen = (...args) => {
    newServer.opening = true;
    return originalListen.apply(newServer, args);
  };

  function listening() {
    newServer.opening = false;

    newServer.removeListener('error', error);
  }

  function error() {
    if (newServer.opening) {
      newServer.opening = false;
    }

    newServer.removeListener('listening', listening);
  }

  newServer.on('listening', listening);
  newServer.on('error', error);

  return newServer;
}

function httpCreateServer(...args) {
  return wrap(originalHttpCreateServer(...args));
}

function httpsCreateServer(...args) {
  return wrap(originalHttpsCreateServer(...args));
}

if (http.createServer.name !== httpCreateServer.name) {
  http.createServer = httpCreateServer;
  https.createServer = httpsCreateServer;
}
