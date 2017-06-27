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

### `BodyParser`

> Parses request's bodies (json, etc)

### `ErrorHandler<{ onError: (e: Error) => void }>`

> Error handler middleware, can be used multiple times to ensure error handling on different levels of your server

#### Props

* `onError`: `(e: Error) => void` - **required prop** used to do something with an error (for example report it somewhere)

### `Files<{ dir: string, ...}>`

> Serves static files

#### Props

* `dir`: `string` - **required prop**, absolute path to directory
* ..., see [Koa static cache's options](https://github.com/koajs/static-cache#staticcachedir--options--files)
