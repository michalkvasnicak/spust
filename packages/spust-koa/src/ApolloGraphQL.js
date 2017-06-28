// @flow

import React from 'react';
import { graphqlKoa } from 'graphql-server-koa';
import type { DocumentNode } from 'graphql';

import Middleware from './Middleware';

type GraphQLContext = {
  context?: any,
  rootValue?: any,
};

type DefaultProps = {
  methods: string | Array<string>,
  options: (ctx: *) => Promise<GraphQLContext> | GraphQLContext,
  path: string,
};

export type Props = DefaultProps & {
  schema: DocumentNode,
};

export default class ApolloGraphQL extends React.Component<DefaultProps, Props, void> {
  static defaultProps = {
    methods: ['GET', 'POST'],
    options: () => ({}),
    path: '/graphql',
  };

  allowedMethods: Array<string>;

  constructor(props: Props, context: any) {
    super(props, context);

    const { methods } = props;

    this.allowedMethods = Array.isArray(methods) ? methods : [methods];
    this.allowedMethods = this.allowedMethods.map(method => method.toUpperCase());
  }

  render() {
    const { options, path, schema } = this.props;

    return (
      <Middleware
        use={async (ctx, { finish, skip }) => {
          if (path !== ctx.path) {
            skip();
          }

          if (!this.allowedMethods.includes(ctx.method)) {
            ctx.status = 405;

            finish();
          }

          const opts = await options(ctx);

          return graphqlKoa({ ...opts, schema })(ctx, () => {});
        }}
      />
    );
  }
}
