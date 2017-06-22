// @flow

import type { ShutdownableServer } from '../serverWrapper';

describe('serverWrapper', () => {
  let server: ?ShutdownableServer;

  beforeEach(() => jest.resetModules());

  afterEach(() => {
    if (server) {
      return server.forceShutdown();
    }
  });

  it('wraps http server', async () => {
    require('../serverWrapper');
    const http = require('http');

    server = (http.createServer((req, res) => res.end('ok')): any);

    expect(server.isOpening()).toBe(false);
    expect(server.listening).toBe(false);

    const promise = new Promise(resolve => {
      // $FlowExpectError
      server.listen(12345, resolve);
    });

    expect(server.isOpening()).toBe(true);
    expect(server.listening).toBe(true);

    await promise;

    expect(server.isOpening()).toBe(false);
    expect(server.listening).toBe(true);
  });

  it('wraps https server', async () => {
    require('../serverWrapper');
    const https = require('https');

    server = (https.createServer((req, res) => res.end('ok')): any);

    expect(server.isOpening()).toBe(false);
    expect(server.listening).toBe(false);

    const promise = new Promise(resolve => {
      // $FlowExpectError
      server.listen(12345, resolve);
    });

    expect(server.isOpening()).toBe(true);
    expect(server.listening).toBe(true);

    await promise;

    expect(server.isOpening()).toBe(false);
    expect(server.listening).toBe(true);
  });
});
