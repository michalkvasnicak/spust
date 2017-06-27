// @flow

import React from 'react';
import { graphiqlKoa } from 'graphql-server-koa';

import Middleware from './Middleware';

export type Props = {
  endpointURL: string,
  path: string,
};

export default class GraphiQL extends React.Component<Props, Props, void> {
  static defaultProps = {
    endpointURL: '/graphql',
    path: '/graphiql',
  };

  render() {
    const { endpointURL, path } = this.props;

    return (
      <Middleware
        use={async (ctx, { finish, skip }) => {
          if (ctx.path !== path) {
            skip();
          }

          if (ctx.method !== 'GET') {
            ctx.status = 405;

            finish();
          }

          await graphiqlKoa({ endpointURL })(ctx, () => {});

          // do not call next middleware functions
          finish();
        }}
      />
    );
  }
}
