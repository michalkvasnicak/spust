// @flow

import React from 'react';
import test from 'supertest';

import Session from '../Session';
import Server from '../Server';
import Middleware from '../Middleware';
import serve from '../';

describe('Session', () => {
  it('provides session to middleware context', async () => {
    const server = serve(
      <Server port={3000}>
        <Session store={{}} />
        <Middleware use={ctx => expect(ctx.session).toEqual({})} />
      </Server>,
      false,
    );

    await test(server.app.callback()).get('/').expect(404);
  });
});
