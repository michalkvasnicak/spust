import { createServer } from 'http';
import { readFileSync } from 'fs';

let assets = {
  main: {
    css: null,
    js: null,
  },
};

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });

  try {
    // do not use require because webpack can't figure out expression
    assets = JSON.parse(readFileSync(process.env.ASSETS_JSON_PATH, { encoding: 'utf8' }));
  } catch (e) {
    console.error(e);
  }

  res.end(`
    <html>
      <head>
        <title>Spust!!</title>
      </head>
      <body>
        <h1>Hello World</h1>
        <script src="${assets.main.js}"></script>
      </body>
    </html>
  `);
});

server.listen(3001, '0.0.0.0', () => console.log('listening on 3001'));

export default server;
