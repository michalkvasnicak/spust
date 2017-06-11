// @flow

import { createServer, get } from 'http';
import ServerManager from '../ServerManager';

describe('ServerManager', () => {
  let manager: ?ServerManager;

  afterEach(async () => {
    if (manager) {
      await manager.close();
    }
  });

  it('throws if we are trying to manage not a server instance', async () => {
    manager = new ServerManager();

    await expect(manager.manage('')).rejects.toMatchSnapshot();
  });

  it('starts to listen on server if is not listening', async () => {
    manager = new ServerManager(3334);

    const code = `
      require('../helpers/serverWrapper');
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      });
      exports = server;
    `;

    await manager.manage(code);

    await new Promise((resolve, reject) => {
      const req = get({ protocol: 'http:', host: '127.0.0.1', port: 3334 }, res => {
        if (res.statusCode !== 200) {
          return reject(new Error('Response is not OK'));
        }

        resolve();
      });

      req.on('error', reject);

      req.end();
    });
  });

  it('forces managed server to listen on given port', async () => {
    manager = new ServerManager(3334);

    const code = `
      require('../helpers/serverWrapper');
      const http = require('http');
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      });
      server.listen(3333, '127.0.0.1');
      exports = server;
    `;

    await manager.manage(code);

    await new Promise((resolve, reject) => {
      const req = get({ protocol: 'http:', host: '127.0.0.1', port: 3334 }, res => {
        if (res.statusCode !== 200) {
          return reject(new Error('Response is not OK'));
        }

        resolve();
      });

      req.on('error', reject);

      req.end();
    });
  });
});
