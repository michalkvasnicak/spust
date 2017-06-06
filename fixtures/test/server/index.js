import { createServer } from 'http';

const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

server.listen(3001, '0.0.0.0', () => console.log('listening on 3001'));

export default server;
