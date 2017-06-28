// @flow

import Koa from 'koa';
import PropTypes from 'prop-types';
import React from 'react';
import { Server as HttpServer } from 'http';

// eslint-disable-next-line no-unused-vars
type ExtractMiddlewareType<MT: *, T: (mw: MT) => *> = MT;

export type MiddlewareFn = ExtractMiddlewareType<any, $PropertyType<Koa, 'use'>>;

export type ServerContext = {
  app: Koa,
  listen: (...args: any) => HttpServer,
};

export type Props = {
  context: Object,
  children?: any,
  port: number,
};

type DefaultProps = {
  context: Object,
};

export type Context = {
  server: Koa,
  use: $PropertyType<Koa, 'use'>,
};

export const serverContextType = {
  use: PropTypes.func.isRequired,
  server: PropTypes.instanceOf(Koa).isRequired,
};

export default class Server extends React.Component<DefaultProps, Props, void> {
  app: Koa;

  static defaultProps = {
    context: {},
  };

  static childContextTypes = serverContextType;

  constructor(props: Props, context: any) {
    super(props, context);

    this.app = new Koa();

    this.props.context.app = this.app;
    this.props.context.listen = () => this.app.listen(this.props.port);
  }

  getChildContext = () => ({
    use: (middleware: MiddlewareFn) => this.app.use(middleware),
    server: this.app,
  });

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}
