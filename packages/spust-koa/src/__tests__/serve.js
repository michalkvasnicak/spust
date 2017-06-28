// @flow

import React from 'react';
import supertest from 'supertest';
import { Server as NetServer } from 'http';

import Middleware from '../Middleware';
import serve from '../';
import RealServer from '../Server';

describe('serve', () => {
  it('returns an instance of Server', () => {
    const listen = jest.fn(() => ({}));

    function Server(props: any) {
      props.context.app = {};
      props.context.listen = listen;

      return <div />;
    }

    expect(serve(<Server />, false) instanceof NetServer).toBe(true);
  });

  it('calls listen by default', () => {
    const listen = jest.fn(() => ({}));

    function Server(props: any) {
      props.context.app = {};
      props.context.listen = listen;

      return <div />;
    }

    serve(<Server />);

    expect(listen).toHaveBeenCalled();
  });

  it('does not call listen if is supressed', () => {
    const listen = jest.fn();

    function Server(props: any) {
      props.context.app = {
        server: {},
      };
      props.context.listen = listen;

      return <div />;
    }

    serve(<Server />, false);

    expect(listen).not.toHaveBeenCalled();
  });

  it('works correctly with middleware', async () => {
    const context = serve(
      <RealServer port={3333}>
        <Middleware
          use={async (ctx, { finish }) => {
            if (ctx.request.url === '/1') {
              ctx.status = 200;
              ctx.body = 'abwab 1';

              finish();
            }
          }}
        />
        <Middleware
          use={async (ctx, { finish }) => {
            if (ctx.request.url === '/2') {
              ctx.status = 200;
              ctx.body = 'abwab 2';

              finish();
            }
          }}
        />
      </RealServer>,
      false,
    );

    const server = context.app.callback();

    await supertest(server).get('/1').expect(200).expect('abwab 1');
    await supertest(server).get('/2').expect(200).expect('abwab 2');
  });
});
