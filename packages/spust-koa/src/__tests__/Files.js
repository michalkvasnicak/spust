// @flow

import React from 'react';
import test from 'supertest';

import Files from '../Files';
import Server from '../Server';
import serve from '../';

describe('Files', () => {
  it('continues with next middleware in order if file is not found', async () => {
    const server = serve(
      <Server port={3000}>
        <Files dir={__dirname} />
      </Server>,
      false,
    );

    await test(server.app.callback()).get('/not-existing.txt').expect(404);
  });

  it('returns a file', async () => {
    const server = serve(
      <Server port={3000}>
        <Files dir={__dirname} />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .get('/Files.js')
      .expect(200)
      .expect('Content-Type', 'application/javascript; charset=utf-8');
  });
});
