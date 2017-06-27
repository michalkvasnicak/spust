# Spust - Koa

Write your [Koa 2.0](https://github.com/koajs/koa) backend using JSX and React.

## Installation

```sh
yarn add spust-koa

# or

npm install spust-koa
```

## Usage

```js
import Middleware from 'spust-koa/lib/Middleware';
import Server from 'spust-koa/lib/Server';
import serve from 'spust-koa';

// will start listening automatically
export default serve(
  <Server port={3000}>
    <Middleware use={(ctx, { skip }) => {
      if (ctx.url === '/') {
        ctx.status = 200;
        ctx.body = 'Homepage';

        skip();
      }
    }} />
    <Middleware use={(ctx) => {
      if (ctx.url === '/a') {
        ctx.status = 200;
        ctx.body = 'a';
      }
    }} />
  </Server>
);
```

## Available components and API

### `serve(server: <Server />, listenAutomatically?: boolean = true)`

> helper which extract server instance from your declaration and handles listening

#### Arguments

* `server`: Server element
* `listenAutomatically`: optional argument, if you pass `false`, server won't start listening automatically

### `Server<{ port: number }>`

> Root component of your server

### Props

* `port`: **required prop**, port on which your server will listen

### `Middleware<{ use: (context: Koa2Context, controllers: Controllers) => Promise<void> | void }>`

> Component used to define your middleware functions

#### Props

* `use`: **required** prop, function accepting `context` and `controllers` arguments
  * `context`: Koa 2 context, see [Koa's context documentation](https://github.com/koajs/koa/blob/master/docs/api/context.md)
  * `controllers`: helper methods used to control the flow of middleware functions, consists of:
    * `finish`: `Function`
      * interrupts the execution of the current middleware and skips execution of the middleware functions in the current level
      * returns to the parent level, so flow in the parent level can continue
    * `nested`: `() => Promise<void>`
      * implicitly calls nested middleware functions *(nested middlewares will be called in the scope of the middleware)*
      * *if you don't use `nested()` in your middleware function, it will call them automatically after the middleware function is finished (but outside of its scope)*
    * `skip`: `Function` - interrupts the execution of the current middleware and proceeds to the next middleware in the current level

### `ApolloGraphQL<{ path: string, methods: string | Array<string>, schema: DocumentNode }>`

> Create GraphQL server using Apollo's Koa middleware

#### Props

* `path`: `string` - optional prop
* `methods`: `string | Array<string>` - optional prop
* `schema`: `DocumentNode`: **required prop**, your GraphQL schema

### `BodyParser`

> Parses request's bodies (json, etc)

### `Cors<{ allowMethods, allowHeaders, credentials, exposeHeaders, keepHeadersOnError, maxAge, origin }>`

> Add CORS support to your server

#### Props

See [koa cors's documentation](https://github.com/koajs/cors)

### `ErrorHandler<{ onError: (e: Error) => void }>`

> Error handler middleware, can be used multiple times to ensure error handling on different levels of your server

#### Props

* `onError`: `(e: Error) => void` - **required prop** used to do something with an error (for example report it somewhere)

### `Files<{ dir: string, ...}>`

> Serves static files

#### Props

* `dir`: `string` - **required prop**, absolute path to directory
* ..., see [Koa static cache's options](https://github.com/koajs/static-cache#staticcachedir--options--files)

### `GraphiQL<{ path: string, endpointURL: string }>`

> Creates GraphiQL route

#### Props

* `path`: `string` - optional prop
* `endpointURL`: `string` - optional prop, path to graphql endpoint

### `Secure<props>`

> Secures your application, see [helmet's documentation](https://www.npmjs.com/search?q=helmet) and [hpp's documentation](https://www.npmjs.com/package/hpp)

#### Props

* [`contentSecurityPolicy?`](./src/Secure.js#11) - optional prop
* [`dnsPrefetchControl?`](./src/Secure.js#39) - optional prop
* [`expectCertificateTransparency`](./src/Secure.js#40) - optional prop
* [`frameguard`](./src/Secure.js#45) - optional prop
* [`hidePoweredBy`](./src/Secure.js#49) - optional prop
* [`httpParameterPollution`](./src/Secure.js#50) - optional prop
* [`httpPublicKeyPinning`](./src/Secure.js#56) - optional prop
* [`httpStrictTransportSecurity`](./src/Secure.js#64) - optional prop
* [`ieNoOpen`](./src/Secure.js#71) - optional prop
* [`noCache`](./src/Secure.js#72) - optional prop
* [`noSniff`](./src/Secure.js#73) - optional prop
* [`referrerPolicy`](./src/Secure.js#74) - optional prop
* [`xssFilter`](./src/Secure.js#85) - optional prop
* for more explainations see [helmet's documentation](https://www.npmjs.com/search?q=helmet) and [hpp's documentation](https://www.npmjs.com/package/hpp)


### `Session<{ key: string, store: Object, cookie: Object}>`

> Add support for sessions

#### Props

* `store`: `Object` - **required prop**
* for whole documentation see [koa-session-minimal's documentation](https://www.npmjs.com/package/koa-session-minimal)
