# Spust

[![npm](https://img.shields.io/npm/v/spust.svg)](https://www.npmjs.com/package/spust)
[![CircleCI](https://circleci.com/gh/michalkvasnicak/spust.svg?style=svg&circle-token=39f82c45c86ac3cd0b5a94f62a1c41919edd86ec)](https://circleci.com/gh/michalkvasnicak/spust)

> Quickly bootstrap universal javascript application.

**Under the development, API can change, feel free to report bugs, open PRs, etc...**

## Installation

```sh
yarn add spust
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

## Build

Build an application for production.

```sh
spust build
```

Will build project with `src` directory. Make sure you have `src/server/index.js` and `src/client/index.js` files.

## Development

Starts the development server and automatically opens browser so you can develop right away.

```sh
spust start
```

Will start the webpack dev server and your backend server.

# react-loadable 4.0 support

In order to use [react-loadable](https://github.com/thejameskyle/react-loadable) you have to install `react-loadable, import-inspector and babel-plugin-import-inspector`. Babel plugin will be used automatically.
