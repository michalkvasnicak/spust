// @flow

import Koa from 'koa';
import React from 'react';
import { shallow } from 'enzyme';

import Server from '../Server';

describe('Server', () => {
  it('assigns app to context prop', () => {
    const context = {};
    shallow(<Server context={context} port={3000} />);

    expect(context.app instanceof Koa).toBe(true);
    expect(typeof context.listen).toBe('function');
  });
});
