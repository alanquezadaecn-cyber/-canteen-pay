#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Inicializando Canteen Pay Backend...');

// Generar cliente Prisma
console.log('📦 Generando Prisma client...');
try {
  execSync('npx prisma generate', {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Prisma client listo');
} catch (err) {
  console.warn('⚠️ Prisma generate warning, continuando...');
}

// Ejecutar el app
console.log('🎯 Iniciando servidor...');
import('./src/app.js').catch(err => {
  console.error('❌ Error iniciando app:', err);
  process.exit(1);
});
