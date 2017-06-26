// @flow

import { readFileSync } from 'fs';

// this file expose helpers that you can use in your project
export function assets(): { css: Array<string>, js: Array<string> } {
  // see helpers/providerVariables.js and configure.js server section's entry point
  const assetsJsonPath: string = process.env.__ASSETS_JSON_PATH || '';
  const loadedAssets: {
    [key: string]: { [key: 'css' | 'js']: string | Array<string> },
  } = JSON.parse(readFileSync(assetsJsonPath, { encoding: 'utf8' }));

  return Object.keys(loadedAssets).reduce(
    (result, entryName) => {
      const { css, js } = loadedAssets[entryName];

      return {
        css: [...result.css, ...(css == null ? [] : Array.isArray(css) ? css : [css])],
        js: [...result.js, ...(js == null ? [] : Array.isArray(js) ? js : [js])],
      };
    },
    { css: [], js: [] },
  );
}
