// @flow

import Koa from 'koa';
import React from 'react';
import { Server } from 'http';
import { renderToString } from 'react-dom/server';

import type { ServerContext } from './Server';

class ExtendedServer extends Server {
  app: Koa;
  overriddenListener: () => Server;

  constructor(listen: () => Server) {
    super();

    this.overriddenListener = listen;
  }

  listen() {
    return this.overriddenListener();
  }
}

export default function serve(
  server: React$Element<*>,
  listenAutomatically?: boolean = true,
): ExtendedServer {
  // flow hack, app and listen will be assigned using
  const context: ServerContext = ({}: any);

  renderToString(React.cloneElement(server, { context }));

  if (listenAutomatically === true) {
    const srv: ExtendedServer = (context.listen(): any);

    srv.app = context.app;

    return srv;
  }

  const srv = new ExtendedServer(context.listen);

  srv.app = context.app;

  return srv;
}
