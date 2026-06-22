// Ultra-simple HTTP server - zero dependencies
const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3001;

console.log('🚀 Starting HTTP server...');
console.log(`📍 Port: ${PORT}`);
console.log(`🕐 Time: ${new Date().toISOString()}`);

server.listen(PORT, () => {
  console.log(`✅✅✅ SERVER LISTENING ON PORT ${PORT} ✅✅✅`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});
