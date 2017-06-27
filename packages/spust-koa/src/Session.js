// @flow

import koaSession from 'koa-session-minimal';
import React from 'react';

import { serverContextType, type Context as ServerContext } from './Server';

type CookieOptions = {
  domain?: string,
  httpOnly?: boolean,
  maxAge?: number,
  path?: string,
  secure?: boolean,
};

export type Props = {
  key?: string,
  store: Object,
  cookie?: CookieOptions | (() => CookieOptions),
};

export default class Session extends React.Component<void, Props, void> {
  static contextTypes = serverContextType;

  context: ServerContext;

  constructor(props: Props, context: ServerContext) {
    super(props, context);

    this.context.use(koaSession({ ...this.props }));
  }

  render() {
    return null;
  }
}
