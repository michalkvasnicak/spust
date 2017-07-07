// @flow

import path from 'path';
import React from 'react';
import test from 'supertest';

import ClientSideRender from '../ClientSideRender';
import Server from '../../Server';
import serve from '../../';

// assets function from Spust is working with this internally
// provide valid path, in your case see assets.json
process.env.__ASSETS_JSON_PATH = path.resolve(__dirname, './assets.json');

describe('RenderApp', () => {
  it('works correctly', async () => {
    const server = serve(
      <Server port={3000}>
        <ClientSideRender containerId="root" title="Test title" />
      </Server>,
      false,
    );

    await test(server.app.callback())
      .options('/')
      .expect(200)
      .expect(res => expect(res.text).toMatchSnapshot());
  });
});
