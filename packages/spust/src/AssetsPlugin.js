// @flow

import mkdirp from 'mkdirp';
import toposort from 'toposort';
import path from 'path';
import { writeFileSync } from 'fs';

export default class AssetsPlugin {
  assetsFilename: string;
  bundlePath: string;

  constructor({
    assetsFilename = 'webpack-assets.json',
    path,
  }: {
    assetsFilename?: string,
    path: string,
  }) {
    this.assetsFilename = assetsFilename;
    this.bundlePath = path;
  }

  apply(compiler: Object): void {
    compiler.plugin('after-emit', async (compilation, cb) => {
      // now topologically sort assets and save them to bundle directory

      try {
        const publicPath = compilation.options.output.publicPath;

        const json = compilation.getStats().toJson();
        const initialChunks = json.chunks.filter(chunk => chunk.initial);
        const chunks = {};
        const entryPoints = {};
        const modules = {};
        const bundles = {};

        json.modules.forEach(module => {
          const parts = module.identifier.split('!');
          const filePath = parts[parts.length - 1];
          modules[filePath] = module.chunks;
        });

        json.chunks.forEach(chunk => {
          bundles[chunk.id] = chunk.files.map(file => publicPath + file);
        });

        initialChunks.forEach(chunk => {
          chunks[chunk.id] = chunk;
        });

        const edges = [];

        initialChunks.forEach(chunk => {
          if (chunk.parents) {
            // Add an edge for each parent (parent -> child)
            chunk.parents.forEach(parentId => {
              const parentChunk = chunks[parentId];
              // If the parent chunk does not exist (e.g. because of an excluded chunk)
              // we ignore that parent
              if (parentChunk) {
                edges.push([parentChunk, chunk]);
              }
            });
          }
        });

        const sorted = toposort.array(initialChunks, edges);

        sorted.forEach(chunk => {
          let map;

          if (!entryPoints[chunk.names[0]]) {
            map = entryPoints[chunk.names[0]] = { css: [], js: [] };
          } else {
            map = entryPoints[chunk.names[0]];
          }

          const files = Array.isArray(chunk.files) ? chunk.files : [chunk.files];

          files.forEach(file => {
            const filePath = publicPath + file;

            if (/\.js$/.test(file)) {
              map.js.push(filePath);
            } else if (/\.css$/.test(file)) {
              map.css.push(filePath);
            }
          });
        });

        // create build directory just in case
        mkdirp.sync(this.bundlePath);
        writeFileSync(
          path.resolve(this.bundlePath, this.assetsFilename),
          JSON.stringify({
            entryPoints,
            modules,
            bundles,
          }),
        );
      } catch (e) {
        cb(e);
      } finally {
        cb();
      }
    });
  }
}
