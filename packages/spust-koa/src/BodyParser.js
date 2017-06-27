// @flow

import koaBodyParser from 'koa-bodyparser';
import React from 'react';

import { type Context as ServerContext, serverContextType } from './Server';

export default class BodyParser extends React.Component<void, *, void> {
  static contextTypes = serverContextType;

  context: ServerContext;

  constructor(props: any, context: ServerContext) {
    super(props, context);

    this.context.use(koaBodyParser());
  }

  render() {
    return null;
  }
}
