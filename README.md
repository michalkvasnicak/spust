# Spust

[![npm](https://img.shields.io/npm/v/spust.svg)](https://www.npmjs.com/package/spust)
[![CircleCI](https://circleci.com/gh/michalkvasnicak/spust.svg?style=svg&circle-token=39f82c45c86ac3cd0b5a94f62a1c41919edd86ec)](https://circleci.com/gh/michalkvasnicak/spust)

> Quickly bootstrap universal javascript application.

**Under the development, API can change, feel free to report bugs, open PRs, etc...**

* [Installation](#installation)
* [Requirements](#requirements)
* [Usage](#usage)
* [Build](#build)
* [Local development](#local-development)
* [Test](#test)
* [Customizing configuration](#customizing-configuration)
* [Use babili for the client side minification](#use-babili-for-the-client-side-minification)
* [react-loadable v4 support](#react-loadable-v4-support)
* [styled-components v2 support](#styled-components-v2-support)

## Installation

```sh
yarn add spust
```

## Requirements

You have to set up directory structure like this:

```
src/
  client/
    index.js
  server/
    index.js
```

Your `src/server/index.js` has to export server listener so `spust` can manage it during the development process.

### Example of `server/index.js`

```js
import { createServer } from 'http';

const server = createServer((res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

// process.env.PORT is provided using webpack.DefinePlugin()
server.listen(process.env.PORT);

export default server;
```

## Usage

```sh
# builds bundle for production environment
yarn spust build
```

```sh
# starts webpack dev server and your backend server and opens browser automatically
yarn spust start
```

```sh
# starts jest in watch mode unless is called with --coverage or process.env.CI is set
yarn spust test
```

## Build

Build an application for production.

```sh
spust build
```

Will build project with `src` directory. Make sure you have `src/server/index.js` and `src/client/index.js` files.

## Local development

Starts the development server and automatically opens browser so you can develop right away.

```sh
spust start
```

Will start the webpack dev server and your backend server.

## Test

```sh
yarn spust test
```

Runs tests in interactive mode. See [create-react-app documentation](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#running-tests) for this as this is the same.

## Customizing configuration

You can provide your own `spust.config.js` which exports a function receiving webpack configuration and settings.

```js
// example, add node_modules to vendor entry
const webpack = require('webpack');

type Settings = {
  env: 'production' | 'development',
  // server manager field is available only in local dev mode
  // and can be null or instance of ServerManager
  // see src/ServerManager for a whole type
  serverManager?: ?ServerManager,
  srcDir: string,
  workDir: string,
  useBabili: boolean,
}

type Configuration = {
  client: WebpackConfig,
  server: WebpackConfig,
}

module.exports = (configuration: Configuration, settings: Settings): Configuration => {
  configuration.client.loaders.push(
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: module =>
        module.resource &&
        module.resource.indexOf('node_modules') !== -1,
    })
  );

  return configuration;
}
```

# Use babili for the client side minification

If you want to minify client side bundle using [babili](https://github.com/babel/babili) instead of [uglifyjs](https://github.com/mishoo/UglifyJS) *(because uglifyjs doesn't support es6 features)* you can enable it using `SPUST_USE_BABILI=1` env variable, for instance `SPUST_USE_BABILI=1 yarn spust build`.

This will change settings of `babel-preset-env` to support all [browsers with coverage > 2%](http://browserl.ist/?q=%3E+2%25).

# react-loadable v4 support

In order to use [react-loadable](https://github.com/thejameskyle/react-loadable) you have to install `react-loadable, import-inspector and babel-plugin-import-inspector`. Babel plugin will be used automatically.

# styled-components v2 support

In order to use [styled-components v2](https://www.styled-components.com/docs) you have to install `styled-components` and `babel-plugin-styled-components`. Babel plugin will be used automatically. Then just follow documentation on [styled-components server side rendering](https://www.styled-components.com/docs/advanced#server-side-rendering).
