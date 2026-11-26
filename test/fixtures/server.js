// Minimal HTTP server for the tests: serves the test pages and records the requests they send.
const http = require('http');
const fs = require('fs');
const path = require('path');
const pages = require('./pages');

const ROOT = path.join(__dirname, '..', '..');
const DELAY = 700; // how long a "slow server" takes to answer

function start() {
  const hits = [];

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      const [, first, second] = url.pathname.split('/');

      const send = (status, type, content, headers = {}) => {
        res.writeHead(status, { 'Content-Type': type, ...headers });
        res.end(content);
      };

      if (first === 'src') {
        return send(200, 'application/javascript', fs.readFileSync(path.join(ROOT, 'src', path.basename(second))));
      }

      if (first === 'jquery') {
        return send(200, 'application/javascript', fs.readFileSync(path.join(ROOT, 'node_modules', path.basename(second), 'dist', 'jquery.js')));
      }

      if (first === 'page') {
        return send(200, 'text/html', pages[second](url.searchParams.get('jquery')));
      }

      if (!['submit', 'download', 'ajax'].includes(first)) return send(404, 'text/plain', 'not found');

      hits.push({ path: first, body });

      // answers "no content" at once, so the browser stays on the page
      if (url.searchParams.get('stay')) return send(204, 'text/plain', '');

      setTimeout(() => {
        if (first === 'download') {
          const token = new URLSearchParams(body).get('download_token');
          const headers = { 'Content-Disposition': 'attachment; filename=report.csv' };
          if (token) headers['Set-Cookie'] = `download_token=${token}; Path=/`;
          return send(200, 'text/csv', 'a,b\n', headers);
        }

        if (first === 'ajax') return send(200, 'application/json', '{}');

        send(200, 'text/html', '<h1 id="done">done</h1>');
      }, DELAY);
    });
  });

  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    hits,
    close: () => { server.closeAllConnections(); server.close(); },
  })));
}

module.exports = { start, DELAY };
