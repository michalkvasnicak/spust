// @flow

import compose from 'koa-compose';
import React from 'react';

import FinishMiddlewareError from './FinishMiddlewareError';
import SkipToNextMiddlewareError from './SkipToNextMiddlewareError';

import { type Context as ServerContext, type MiddlewareFn, serverContextType } from './Server';

export type Props = {
  children?: any,
  use: (
    context: *,
    controllers: { finish: Function, nested: () => Promise<void>, skip: Function },
  ) => Promise<void> | void,
};

export default class Middleware extends React.Component<void, Props, void> {
  static childContextTypes = serverContextType;

  static contextTypes = serverContextType;

  middlewares: Array<MiddlewareFn> = [];

  context: ServerContext;

  constructor(props: Props, context: ServerContext) {
    super(props, context);

    this.context.use(async (ctx, next) => {
      try {
        let middlewaresCalled = false;
        const middlewares = compose(this.middlewares);

        await props.use(ctx, {
          async nested() {
            middlewaresCalled = true;

            return middlewares(ctx);
          },
          finish() {
            throw new FinishMiddlewareError();
          },
          skip() {
            throw new SkipToNextMiddlewareError();
          },
        });

        // call nested middlewares automatically
        if (!middlewaresCalled) {
          await middlewares(ctx);
        }

        // proceed to next middleware
        return await next();
      } catch (e) {
        // if is skip error, then just work normally but skip to next middleware
        // if is finish error, then just return but don't call next middleware
        // otherwise just throw so error handler can catch it
        if (e instanceof SkipToNextMiddlewareError) {
          return await next();
        } else if (e instanceof FinishMiddlewareError) {
          return;
        }

        throw e;
      }
    });
  }

  getChildContext = () => ({
    use: (middleware: MiddlewareFn) => this.middlewares.push(middleware),
    server: this.context.server,
  });

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}
