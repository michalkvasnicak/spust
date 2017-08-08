// @flow
const http = require('http');

const server = http.createServer(() => {});

setTimeout(() => {
  server.listen(3001);
}, 2000);
