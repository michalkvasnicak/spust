// @flow

import koaStaticCache from 'koa-static-cache';
import React from 'react';

import { type Context as ServerContext, serverContextType } from './Server';

type DefaultProps = {
  dynamic: boolean,
};

export type Props = {
  alias?: { [key: string]: string },
  buffer?: boolean,
  cacheControl?: string,
  dir: string,
  dynamic: boolean,
  filter?: Array<string> | ((file: string) => boolean),
  gzip?: boolean,
  maxAge?: number,
  prefix?: string,
  preload?: boolean,
  usePrecompiledGzip?: boolean,
};

export default class Files extends React.Component<DefaultProps, Props, void> {
  static contextTypes = serverContextType;

  static defaultProps = {
    dynamic: true,
  };

  context: ServerContext;

  constructor(props: Props, context: ServerContext) {
    super(props, context);

    this.context.use(koaStaticCache({ ...this.props }));
  }

  render() {
    return null;
  }
}
