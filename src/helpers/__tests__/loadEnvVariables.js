// @flow

import { resolve } from 'path';

import loadEnvVariables from '../loadEnvVariables';

describe('loadEnvVariables', () => {
  it('returns empty object if .env and .env.local files does not exist', async () => {
    expect(await loadEnvVariables(resolve(__dirname, '../__fixtures__/loadEnvVariables'))).toEqual(
      {},
    );
  });

  it('returns object for .env file', async () => {
    expect(
      await loadEnvVariables(resolve(__dirname, '../__fixtures__/loadEnvVariables/onlyEnv')),
    ).toEqual({
      TEST_VAR: '1',
      TEST_VAR_2: '2',
    });
  });

  it('returns object for .env.local file', async () => {
    expect(
      await loadEnvVariables(resolve(__dirname, '../__fixtures__/loadEnvVariables/onlyLocalEnv')),
    ).toEqual({
      TEST_VAR: '1',
      TEST_VAR_2: '2',
    });
  });

  it('returns object for with overridden variables file', async () => {
    expect(
      await loadEnvVariables(resolve(__dirname, '../__fixtures__/loadEnvVariables/overridden')),
    ).toEqual({
      TEST_VAR: '1',
      TEST_VAR_2: '3',
      TEST_VAR_3: '4',
    });
  });
});
