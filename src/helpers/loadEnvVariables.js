// @flow

import dotenv from 'dotenv';
import { readFile } from 'mz/fs';
import { resolve as resolvePath } from 'path';

export default async function loadEnvVariables(
  workDir: string,
  envFileName?: Array<string> = ['.env', '.env.local'],
): Promise<{ [key: string]: any }> {
  const envFilesContents: Array<Object> = await Promise.all(
    envFileName.map(filename =>
      readFile(resolvePath(workDir, filename))
        .then(content => dotenv.parse(content))
        .catch(() => ({})),
    ),
  );

  return Object.assign({}, ...envFilesContents);
}
