#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Inicializando Canteen Pay Backend...');

// Generar cliente Prisma si es necesario
console.log('📦 Verificando Prisma client...');
try {
  execSync('npx prisma generate', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Prisma client listo');
} catch (error) {
  console.error('❌ Error al generar Prisma:', error.message);
  process.exit(1);
}

// Ejecutar el app
console.log('🎯 Iniciando servidor...');
import('./src/app.js');
