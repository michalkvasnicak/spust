// @flow

import React from 'react';
import test from 'supertest';

import serve from '../';
import Server from '../Server';
import Middleware from '../Middleware';

describe('Middleware', () => {
  it('goes to next middleware', async () => {
    const ctx = serve(
      <Server port={3333}>
        <Middleware
          use={ctx => {
            ctx.status = 200;
          }}
        />
        <Middleware
          use={ctx => {
            ctx.body = 'a';
          }}
        />
      </Server>,
      false,
    );

    await test(ctx.app.callback()).get('/').expect(200).expect(res => expect(res.text).toBe('a'));
  });

  it('skips to next middleware', async () => {
    const ctx = serve(
      <Server port={3333}>
        <Middleware
          use={(ctx, { skip }) => {
            skip();

            ctx.body = 'a';
          }}
        />
        <Middleware
          use={ctx => {
            ctx.status = 200;
          }}
        />
      </Server>,
      false,
    );

    await test(ctx.app.callback())
      .get('/')
      .expect(200)
      .expect(res => expect(res.text).toEqual('OK'));
  });

  it("finishes current middleware and doesn't proceed to the next middleware", async () => {
    const ctx = serve(
      <Server port={3333}>
        <Middleware
          use={(ctx, { finish }) => {
            ctx.status = 200;
            ctx.body = 'a';

            finish();
          }}
        />
        <Middleware
          use={ctx => {
            ctx.body = 'b';
          }}
        />
      </Server>,
      false,
    );

    await test(ctx.app.callback()).get('/').expect(200).expect(res => expect(res.text).toBe('a'));
  });

  describe('complex use cases', () => {
    it('handles nested middlewares', async () => {
      const ctx = serve(
        <Server port={3333}>
          <Middleware
            use={(ctx, { finish, skip }) => {
              ctx.status = 200;
              ctx.body = 'a';

              if (ctx.url === '/skip-nested') {
                skip();
              } else if (ctx.url === '/finish-only-a') {
                finish();
              }
            }}
          >
            <Middleware
              use={(ctx, { skip, finish }) => {
                (ctx: any).body += 'b';

                if (ctx.url === '/skip-b-nested') {
                  skip();
                } else if (ctx.url === '/finish-a-b') {
                  finish();
                }
              }}
            >
              <Middleware
                use={ctx => {
                  (ctx: any).body += 'c';
                }}
              />
            </Middleware>
            <Middleware
              use={ctx => {
                (ctx: any).body += 'd';
              }}
            />
          </Middleware>
          <Middleware
            use={(ctx, { finish, skip }) => {
              if (ctx.url === '/skip-e') {
                skip();
              } else if (ctx.url === '/finish-e') {
                finish();
              }

              (ctx: any).body += 'e';
            }}
          />
        </Server>,
        false,
      );

      const srv = ctx.app.callback();

      await test(srv).get('/').expect(200).expect('abcde');
      await test(srv).get('/skip-nested').expect(200).expect('ae');
      await test(srv).get('/finish-only-a').expect(200).expect('a');
      await test(srv).get('/skip-b-nested').expect(200).expect('abde');
      await test(srv).get('/finish-a-b').expect(200).expect('abe');
      await test(srv).get('/skip-e').expect(200).expect('abcd');
      await test(srv).get('/finish-e').expect(200).expect('abcd');
    });

    it('calls nested middlewares implictly', async () => {
      const ctx = serve(
        <Server port={3333}>
          <Middleware
            use={async (ctx, { finish, nested, skip }) => {
              try {
                ctx.status = 200;
                ctx.body = 'a';

                return await nested();
              } catch (e) {}
            }}
          >
            <Middleware
              use={(ctx, { finish, skip }) => {
                (ctx: any).body += 'b';
              }}
            >
              <Middleware
                use={ctx => {
                  throw new Error('c');
                }}
              />
            </Middleware>
          </Middleware>
          <Middleware
            use={ctx => {
              (ctx: any).body += 'd';
            }}
          />
        </Server>,
        false,
      );

      const srv = ctx.app.callback();

      await test(srv).get('/').expect(200).expect('abd');
    });
  });
});
