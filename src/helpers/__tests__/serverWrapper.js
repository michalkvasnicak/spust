// @flow

describe('serverWrapper', () => {
  let server;

  beforeEach(() => jest.resetModules());

  afterEach(
    async () =>
      new Promise(resolve => {
        if (server) {
          server.removeAllListeners('connection');
          server.removeAllListeners('request');
          server.removeAllListeners('secureConnection');
          server.removeAllListeners('listening');
          server.removeAllListeners('error');

          // $FlowExpectError
          server.forceShutdown(() => {
            server = null;
            resolve();
          });
        } else {
          resolve();
        }
      }),
  );

  it('wraps http server', async () => {
    require('../serverWrapper');
    const http = require('http');

    server = http.createServer((req, res) => res.end('ok'));

    expect(server).toHaveProperty('opening');
    // $FlowExpectError
    expect(server.opening).toBe(false);
    // $FlowExpectError
    expect(server.listening).toBe(false);

    const promise = new Promise(resolve => {
      // $FlowExpectError
      server.listen(12345, resolve);
    });

    // $FlowExpectError
    expect(server.opening).toBe(true);
    // $FlowExpectError
    expect(server.listening).toBe(true);

    await promise;

    // $FlowExpectError
    expect(server.opening).toBe(false);
    // $FlowExpectError
    expect(server.listening).toBe(true);
  });

  it('wraps https server', async () => {
    require('../serverWrapper');
    const https = require('https');

    server = https.createServer((req, res) => res.end('ok'));

    expect(server).toHaveProperty('opening');
    // $FlowExpectError
    expect(server.opening).toBe(false);
    // $FlowExpectError
    expect(server.listening).toBe(false);

    const promise = new Promise(resolve => {
      // $FlowExpectError
      server.listen(12345, resolve);
    });

    // $FlowExpectError
    expect(server.opening).toBe(true);
    // $FlowExpectError
    expect(server.listening).toBe(true);

    await promise;

    // $FlowExpectError
    expect(server.opening).toBe(false);
    // $FlowExpectError
    expect(server.listening).toBe(true);
  });
});
