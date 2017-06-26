import { createServer } from 'http';
import { assets } from '../../../scripts';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });

  let loadedAssets = { js: [] };

  try {
    // do not use require because webpack can't figure out expression
    loadedAssets = assets();
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
        ${loadedAssets.js.map(script => `<script src="${script}"></script>`).join('\n')}
      </body>
    </html>
  `);
});

const PORT = parseInt(process.env.PORT || 3000, 10);

server.listen(PORT, '0.0.0.0', () => console.log(`listening on ${PORT}`));

export default server;
