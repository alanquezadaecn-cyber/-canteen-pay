import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Limpiar datos existentes
  await prisma.transaction.deleteMany();
  await prisma.recharge.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios de prueba
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: await bcrypt.hash('password123', 10),
        company: 'Tech Corp',
        employeeNumber: 'EMP-2024-001',
        phone: '+55 5555-0001',
        role: 'USER',
        balance: 500.00,
        qrCode: randomUUID()
      }
    }),
    prisma.user.create({
      data: {
        name: 'María García',
        email: 'maria@example.com',
        password: await bcrypt.hash('password123', 10),
        company: 'Tech Corp',
        employeeNumber: 'EMP-2024-002',
        phone: '+55 5555-0002',
        role: 'USER',
        balance: 250.50,
        qrCode: randomUUID()
      }
    }),
    prisma.user.create({
      data: {
        name: 'Carlos López',
        email: 'carlos@example.com',
        password: await bcrypt.hash('password123', 10),
        company: 'Tech Corp',
        employeeNumber: 'EMP-2024-003',
        phone: '+55 5555-0003',
        role: 'CASHIER',
        balance: 0,
        qrCode: randomUUID()
      }
    }),
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        company: 'Tech Corp',
        employeeNumber: 'ADM-2024-001',
        phone: '+55 5555-0099',
        role: 'ADMIN',
        balance: 0,
        qrCode: randomUUID()
      }
    })
  ]);

  console.log(`✅ ${users.length} usuarios creados`);

  // Crear transacciones de prueba para Juan
  const transactions = [
    {
      userId: users[0].id,
      type: 'RECHARGE',
      amount: 500.00,
      balanceBefore: 0,
      balanceAfter: 500.00,
      description: 'Recarga en caja',
      paymentMethod: 'CASH'
    },
    {
      userId: users[0].id,
      type: 'PURCHASE',
      amount: 45.50,
      balanceBefore: 500.00,
      balanceAfter: 454.50,
      description: 'Comida en comedor',
      paymentMethod: null
    },
    {
      userId: users[0].id,
      type: 'PURCHASE',
      amount: 32.00,
      balanceBefore: 454.50,
      balanceAfter: 422.50,
      description: 'Bebida y postres',
      paymentMethod: null
    },
    {
      userId: users[1].id,
      type: 'RECHARGE',
      amount: 250.50,
      balanceBefore: 0,
      balanceAfter: 250.50,
      description: 'Recarga con tarjeta',
      paymentMethod: 'STRIPE'
    },
    {
      userId: users[1].id,
      type: 'PURCHASE',
      amount: 28.75,
      balanceBefore: 250.50,
      balanceAfter: 221.75,
      description: 'Almuerzo',
      paymentMethod: null
    }
  ];

  await Promise.all(
    transactions.map(tx =>
      prisma.transaction.create({
        data: {
          ...tx,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      })
    )
  );

  console.log(`✅ ${transactions.length} transacciones creadas`);

  // Crear recharges de prueba
  const recharges = [
    {
      userId: users[0].id,
      amount: 500.00,
      paymentMethod: 'CASH',
      status: 'COMPLETED'
    },
    {
      userId: users[1].id,
      amount: 250.50,
      paymentMethod: 'STRIPE',
      status: 'COMPLETED'
    },
    {
      userId: users[1].id,
      amount: 100.00,
      paymentMethod: 'STRIPE',
      status: 'PENDING'
    }
  ];

  await Promise.all(
    recharges.map(recharge =>
      prisma.recharge.create({
        data: {
          ...recharge,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      })
    )
  );

  console.log(`✅ ${recharges.length} recargas creadas`);

  console.log('🎉 Seed completado exitosamente!');
  console.log('\n📝 Usuarios de prueba:');
  console.log('   Email: juan@example.com | Password: password123 | Role: USER');
  console.log('   Email: maria@example.com | Password: password123 | Role: USER');
  console.log('   Email: carlos@example.com | Password: password123 | Role: CASHIER');
  console.log('   Email: admin@example.com | Password: password123 | Role: ADMIN');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
