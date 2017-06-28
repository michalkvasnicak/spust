// @flow

import React from 'react';
import test from 'supertest';

import Secure from '../Secure';
import Server from '../Server';
import serve from '../';

describe('Secure', () => {
  it('provides session to middleware context', async () => {
    const server = serve(
      <Server port={3000}>
        <Secure />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .options('/')
      .expect(404)
      .expect('X-XSS-Protection', '1; mode=block');
  });
});
