// @flow

import React from 'react';
import test from 'supertest';

import Cors from '../Cors';
import Server from '../Server';
import serve from '../';

describe('Cors', () => {
  it('provides session to middleware context', async () => {
    const server = serve(
      <Server port={3000}>
        <Cors />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .options('/')
      .set('Origin', 'http://test')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204)
      .expect('Access-Control-Allow-Origin', 'http://test');
  });
});
