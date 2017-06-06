// @flow

import { createServer, get } from 'http';
import ServerManager from '../ServerManager';

describe('ServerManager', () => {
  let server: ?net$Server;

  afterEach(async () => {
    await new Promise((resolve, reject) => {
      if (server != null) {
        server.on('error', reject);
        server.close(resolve);
      } else {
        resolve();
      }
    });
  });

  it('throws if we are trying to manage not a server instance', async () => {
    const manager = new ServerManager();

    await expect(manager.manage(({}: any))).rejects.toMatchSnapshot();
  });

  it('keeps running http server instance if port is not set', async () => {
    const manager = new ServerManager();

    server = await new Promise((resolve, reject) => {
      const srv = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      });

      srv.on('error', reject);
      srv.listen(3333, '127.0.0.1', undefined, () => resolve(srv));
    });

    await manager.manage(server);

    await new Promise((resolve, reject) => {
      const req = get({ protocol: 'http:', host: '127.0.0.1', port: 3333 }, res => {
        if (res.statusCode !== 200) {
          return reject(new Error('Response is not OK'));
        }

        resolve();
      });

      req.on('error', reject);

      req.end();
    });
  });

  it('throws if port is not provided and the managed server is not listening', async () => {
    const manager = new ServerManager();

    server = await new Promise((resolve, reject) => {
      const srv = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      });

      srv.on('error', reject);
      resolve(srv);
    });

    await expect(manager.manage(server)).rejects.toMatchSnapshot();
  });

  it('forces managed server to listen on given port', async () => {
    const manager = new ServerManager(3334);

    server = await new Promise((resolve, reject) => {
      const srv = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      });

      srv.on('error', reject);
      srv.listen(3333, '127.0.0.1', undefined, () => resolve(srv));
    });

    await manager.manage(server);

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
