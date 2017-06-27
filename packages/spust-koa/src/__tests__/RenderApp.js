// @flow

import React from 'react';
import test from 'supertest';

import RenderApp from '../RenderApp';
import Server from '../Server';
import serve from '../';

describe('RenderApp', () => {
  it('works correctly', async () => {
    const server = serve(
      <Server port={3000}>
        <RenderApp
          render={ctx => ({
            head: {
              links: [{ crossOrigin: 'same-origin', href: 'test', rel: 'stylesheet' }],
              meta: [{ content: 'test-value', name: 'test' }],
              stylesheets: [{ href: 'test2' }],
            },
          })}
        />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .options('/')
      .expect(200)
      .expect(res => expect(res.text).toMatchSnapshot());
  });
});
