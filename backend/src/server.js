// Ultra-simple HTTP server - zero dependencies
const http = require('http');

console.log('\n🎯 === SERVER STARTING ===');
console.log('⏰ Timestamp:', new Date().toISOString());
console.log('🔧 Node version:', process.version);
console.log('📍 Env PORT:', process.env.PORT);
console.log('📂 Current dir:', process.cwd());

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

console.log('🚀 Attempting to listen on port', PORT);

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅✅✅ SUCCESS ✅✅✅');
  console.log('🎉 SERVER IS LISTENING ON PORT', PORT);
  console.log('📍 URL: http://0.0.0.0:' + PORT);
  console.log('🔗 Health check: http://localhost:' + PORT + '/health');
  console.log('\n');
});

server.on('error', (error) => {
  console.error('\n❌ SERVER ERROR:', error.message);
  console.error('Code:', error.code);
  console.error('\n');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:', error.message);
  console.error(error.stack);
  process.exit(1);
});

// Keep-alive logging every 30 seconds
setInterval(() => {
  console.log('✅ Server still running at', new Date().toISOString());
}, 30000);
