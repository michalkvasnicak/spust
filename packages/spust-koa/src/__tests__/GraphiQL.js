// @flow

import React from 'react';
import test from 'supertest';

import GraphiQL from '../GraphiQL';
import Server from '../Server';
import serve from '../';

describe('GraphiQL', () => {
  it('accepts only GET requests to /graphiql endpoint by default', async () => {
    const server = serve(
      <Server port={3000}>
        <GraphiQL />
      </Server>,
      false,
    );

    await test(server.app.callback()).get('/graphiql').expect(200);
    await test(server.app.callback()).post('/graphiql').expect(405);
  });

  it('accepts GET requests to custom /graphiql endpoint', async () => {
    const server = serve(
      <Server port={3000}>
        <GraphiQL path="/gqil" />
      </Server>,
      false,
    );

    await test(server.app.callback()).get('/graphiql').expect(404);
    await test(server.app.callback()).get('/gqil').expect(200);
    await test(server.app.callback()).post('/gqil').expect(405);
  });
});
