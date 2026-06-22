import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();
console.log('✅ Dotenv loaded');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
console.log('✅ Express app created');

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
console.log('✅ CORS configured');

app.use(express.json());
console.log('✅ JSON middleware loaded');

app.use(express.static(join(__dirname, '../../public')));
console.log('✅ Static files configured');

// Health check - NO dependencies
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
console.log('✅ Health endpoint registered');

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'App is working!', env: process.env.NODE_ENV || 'development' });
});
console.log('✅ Test endpoint registered');

const PORT = process.env.PORT || 3001;

try {
  app.listen(PORT, () => {
    console.log(`✅✅✅ SERVER RUNNING ON PORT ${PORT} ✅✅✅`);
  });
} catch (error) {
  console.error('❌ FAILED TO START:', error.message);
  process.exit(1);
}

process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});
