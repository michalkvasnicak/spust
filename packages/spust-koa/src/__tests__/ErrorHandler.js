// @flow

import React from 'react';
import test from 'supertest';

import ErrorHandler from '../ErrorHandler';
import serve from '../';
import Server from '../Server';
import Middleware from '../Middleware';

describe('ErrorHandler', () => {
  it('goes to next middleware in case of no error', async () => {
    const onError = jest.fn();

    const ctx = serve(
      <Server port={3333}>
        <Middleware
          use={ctx => {
            ctx.status = 200;
            ctx.body = '';
          }}
        />
        <ErrorHandler onError={onError}>
          <Middleware
            use={ctx => {
              (ctx: any).body += 'a';
            }}
          />
          <Middleware
            use={ctx => {
              (ctx: any).body += 'b';
            }}
          />
        </ErrorHandler>
        <Middleware
          use={ctx => {
            (ctx: any).body += 'c';
          }}
        />
      </Server>,
      false,
    );

    await test(ctx.app.callback()).get('/').expect(200).expect(res => expect(res.text).toBe('abc'));
    expect(onError).not.toHaveBeenCalled();
  });

  it("finishes middleware and doesn't proceed to the next middleware in the level", async () => {
    const onError = jest.fn();

    const ctx = serve(
      <Server port={3333}>
        <Middleware
          use={ctx => {
            ctx.status = 200;
            ctx.body = '';
          }}
        />
        <ErrorHandler onError={onError}>
          <Middleware
            use={ctx => {
              (ctx: any).body += 'a';
            }}
          />
          <Middleware
            use={ctx => {
              throw new Error('Test error');
            }}
          />
        </ErrorHandler>
        <Middleware
          use={ctx => {
            (ctx: any).body += 'c';
          }}
        />
      </Server>,
      false,
    );

    await test(ctx.app.callback()).get('/').expect(200).expect(res => expect(res.text).toBe('a'));
    expect(onError).toHaveBeenCalledWith(new Error('Test error'));
  });
});
