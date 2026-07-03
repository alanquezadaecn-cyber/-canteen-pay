import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('Anubis9205', 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: 'Alan Quezada',
        email: 'aa.quezadat92@gmail.com',
        password: hashedPassword,
        company: 'Admin Company',
        employeeNumber: 'ADM-ALAN-001',
        phone: '+52 5555-0001',
        role: 'ADMIN',
        balance: 0,
        qrCode: randomUUID(),
        isActive: true
      }
    });

    console.log('✅ Usuario ADMIN creado exitosamente:');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👤 Nombre: ${user.name}`);
    console.log(`   🔐 Rol: ${user.role}`);
    console.log(`   💰 Balance: $${user.balance}`);
    console.log(`   ✅ ID: ${user.id}`);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  El usuario ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
