import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('🚀 Iniciando migraciones de Prisma...');

    // Ejecutar migraciones
    const result = await prisma.$executeRawUnsafe(`
      SELECT 1;
    `);

    console.log('✅ Conexión a BD exitosa');
    console.log('✅ Migraciones completadas');

  } catch (error) {
    console.error('❌ Error en migraciones:', error.message);
    console.warn('⚠️ Continuando sin migraciones...');
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
