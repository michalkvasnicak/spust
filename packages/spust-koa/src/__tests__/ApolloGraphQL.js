// @flow

import React from 'react';
import test from 'supertest';
import { makeExecutableSchema } from 'graphql-tools';
import { stringify } from 'querystring';

import ApolloGraphQL from '../ApolloGraphQL';
import BodyParser from '../BodyParser';
import Server from '../Server';
import serve from '../';

const schema = makeExecutableSchema({
  typeDefs: `
    type Query {
      hello: Int!
    }

    schema {
      query: Query
    }
  `,
  resolvers: {
    Query: {
      hello: (parent, args, context) => context.hello || 1,
    },
  },
});

describe('ApolloGraphQL', () => {
  it('by default accepts GET and POST request to /grapqhl endpoint', async () => {
    const server = serve(
      <Server port={3000}>
        <BodyParser />
        <ApolloGraphQL schema={schema} />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .get('/graphql?' + stringify({ operationName: null, query: `{ hello }` }))
      .expect(200)
      .expect({ data: { hello: 1 } });

    await test(server.app.callback())
      .post('/graphql')
      .send({ operationName: null, query: `{ hello }` })
      .expect(200)
      .expect({ data: { hello: 1 } });
  });

  it('accepts only requests fulfilling conditions', async () => {
    let server = serve(
      <Server port={3000}>
        <BodyParser />
        <ApolloGraphQL methods="POST" schema={schema} />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .get('/graphql?' + stringify({ operationName: null, query: `{ hello }` }))
      .expect(405);

    await test(server.app.callback())
      .post('/graphql')
      .send({ operationName: null, query: `{ hello }` })
      .expect(200)
      .expect({ data: { hello: 1 } });

    server = serve(
      <Server port={3000}>
        <BodyParser />
        <ApolloGraphQL methods="GET" schema={schema} />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .get('/graphql?' + stringify({ operationName: null, query: `{ hello }` }))
      .expect(200)
      .expect({ data: { hello: 1 } });

    await test(server.app.callback())
      .post('/graphql')
      .send({ operationName: null, query: `{ hello }` })
      .expect(405);

    server = serve(
      <Server port={3000}>
        <BodyParser />
        <ApolloGraphQL path="/gql" schema={schema} />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .get('/graphql?' + stringify({ operationName: null, query: `{ hello }` }))
      .expect(404);

    await test(server.app.callback())
      .post('/graphql')
      .send({ operationName: null, query: `{ hello }` })
      .expect(404);

    await test(server.app.callback())
      .get('/gql?' + stringify({ operationName: null, query: `{ hello }` }))
      .expect(200)
      .expect({ data: { hello: 1 } });

    await test(server.app.callback())
      .post('/gql')
      .send({ operationName: null, query: `{ hello }` })
      .expect(200)
      .expect({ data: { hello: 1 } });
  });

  it('passes options to graphql middleware', async () => {
    const server = serve(
      <Server port={3000}>
        <BodyParser />
        <ApolloGraphQL options={() => ({ context: { hello: 2 } })} schema={schema} />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .get('/graphql?' + stringify({ operationName: null, query: `{ hello }` }))
      .expect(200)
      .expect({ data: { hello: 2 } });

    await test(server.app.callback())
      .post('/graphql')
      .send({ operationName: null, query: `{ hello }` })
      .expect(200)
      .expect({ data: { hello: 2 } });
  });
});
