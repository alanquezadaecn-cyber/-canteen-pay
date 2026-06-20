import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint para inicializar datos de prueba
router.post('/seed', async (req, res) => {
  try {
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
          qrCode: randomUUID(),
          isActive: true
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
          qrCode: randomUUID(),
          isActive: true
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
          qrCode: randomUUID(),
          isActive: true
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
          qrCode: randomUUID(),
          isActive: true
        }
      })
    ]);

    console.log(`✅ ${users.length} usuarios creados`);

    // Crear transacciones de prueba
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

    res.json({
      success: true,
      message: '✅ Seed completado',
      users: users.map(u => ({ email: u.email, role: u.role, password: 'password123' }))
    });
  } catch (error) {
    console.error('❌ Error en seed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
