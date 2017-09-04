// @flow

import { readFileSync } from 'fs';

type AssetsFile = {
  bundles: {
    [key: string]: Array<string>,
  },
  entryPoints: {
    [key: string]: { [key: 'css' | 'js']: string | Array<string> },
  },
  modules: {
    [key: string]: Array<string>,
  },
};

// this file expose helpers that you can use in your project
export function assets(): { css: Array<string>, js: Array<string> } {
  // see helpers/providerVariables.js and configure.js server section's entry point
  const assetsJsonPath: string = process.env.__ASSETS_JSON_PATH || '';
  const loadedAssets: AssetsFile = JSON.parse(readFileSync(assetsJsonPath, { encoding: 'utf8' }));

  return Object.keys(loadedAssets.entryPoints).reduce(
    (result, entryName) => {
      const { css, js } = loadedAssets.entryPoints[entryName];

      return {
        css: [...result.css, ...(css == null ? [] : Array.isArray(css) ? css : [css])],
        js: [...result.js, ...(js == null ? [] : Array.isArray(js) ? js : [js])],
      };
    },
    { css: [], js: [] },
  );
}

export function createAsyncRequireLoader() {
  // see helpers/providerVariables.js and configure.js server section's entry point
  const assetsJsonPath: string = process.env.__ASSETS_JSON_PATH || '';
  const loadedAssets: AssetsFile = JSON.parse(readFileSync(assetsJsonPath, { encoding: 'utf8' }));

  return {
    getScripts(requiredFiles: Array<string>): Array<string> {
      return requiredFiles.reduce((result, requiredFile) => {
        const file = requiredFile + '.js';
        const indexFile = requiredFile + '/index.js';

        const bundles = loadedAssets.modules[file] || loadedAssets.modules[indexFile];

        if (bundles == null) {
          return result;
        }

        const scripts = bundles.reduce((processed, bundle) => {
          const files = loadedAssets.bundles[bundle];

          if (files == null) {
            return processed;
          }

          // allow only js files
          return [...files.filter(fileName => fileName.endsWith('js')).reverse(), ...processed];
        }, []);

        return [...scripts, ...result];
      }, []);
    },
  };
}
