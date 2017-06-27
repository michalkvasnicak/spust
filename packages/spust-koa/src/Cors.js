// @flow

import koaCors from 'kcors';
import React from 'react';

import { serverContextType, type Context as ServerContext } from './Server';

export type Props = {
  allowMethods?: string | Array<string>,
  allowHeaders?: string | Array<string>,
  credentials?: boolean,
  exposeHeaders?: string | Array<string>,
  keepHeadersOnError?: boolean,
  maxAge?: number,
  origin?: string | ((ctx: Object) => ?string),
};

export default class Cors extends React.Component<void, Props, void> {
  static contextTypes = serverContextType;

  context: ServerContext;

  constructor(props: Props, context: ServerContext) {
    super(props, context);

    this.context.use(koaCors({ ...this.props }));
  }

  render() {
    return null;
  }
}
