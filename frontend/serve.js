const http = require('http');
const fs   = require('fs');
const path = require('path');

const mime = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

const ROOT = __dirname;

http.createServer((req, res) => {
  const filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  const ext      = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(5500, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('🚀 DisasterLink Frontend Started');
  console.log('🌐 Local:   http://localhost:5500');
  console.log('📡 Network: http://127.0.0.1:5500');
  console.log('-------------------------------------------');
});
