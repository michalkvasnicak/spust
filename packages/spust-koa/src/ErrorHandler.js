// @flow

import React from 'react';

import Middleware from './Middleware';

export type Props = {
  children?: any,
  onError: (e: Error) => any,
};

export default function ErrorHandler(props: Props) {
  return (
    <Middleware
      use={async (ctx, { finish, nested }) => {
        try {
          return await nested();
        } catch (e) {
          props.onError(e);

          throw e;
        }
      }}
    >
      {props.children}
    </Middleware>
  );
}
