import express from 'express';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const router = express.Router();

// Endpoint para inicializar datos de prueba
router.post('/seed', async (req, res) => {
  try {
    console.log('🌱 Iniciando seed de datos...');
    console.log('📡 DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

    // Test connection first
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a BD exitosa');

    // Limpiar datos existentes
    console.log('🗑️  Limpiando datos existentes...');
    await prisma.transaction.deleteMany();
    await prisma.recharge.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Datos limpios');

    // Hash passwords first (BEFORE creating users)
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Crear usuarios de prueba
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: hashedPassword,
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
          password: hashedPassword,
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
          password: hashedPassword,
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
          password: hashedPassword,
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

// Endpoint para crear planes y empresas de prueba
router.post('/seed-plans', async (req, res) => {
  try {
    console.log('🌱 Creando planes y empresas de prueba...');

    // Crear planes si no existen
    const enterprisePlan = await prisma.plan.upsert({
      where: { name: 'ENTERPRISE' },
      update: {
        description: 'Plan empresarial - $30k licencia + $500/mes hosting',
        price: 30000,
        billingCycle: 'YEARLY',
        maxBranches: 10,
        maxUsersPerBranch: null,
        features: ['qr-payments', 'cashier-module', 'admin-panel', 'reports', 'api-access', 'priority-support']
      },
      create: {
        name: 'ENTERPRISE',
        description: 'Plan empresarial - $30k licencia + $500/mes hosting',
        price: 30000,
        billingCycle: 'YEARLY',
        maxBranches: 10,
        maxUsersPerBranch: null,
        features: ['qr-payments', 'cashier-module', 'admin-panel', 'reports', 'api-access', 'priority-support']
      }
    });

    const litePlan = await prisma.plan.upsert({
      where: { name: 'LITE' },
      update: {
        description: 'Plan LITE - $5k licencia + $150/mes hosting',
        price: 5000,
        billingCycle: 'YEARLY',
        maxBranches: 1,
        maxUsersPerBranch: null,
        features: ['qr-payments', 'cashier-module', 'admin-panel', 'basic-reports', 'email-support']
      },
      create: {
        name: 'LITE',
        description: 'Plan LITE - $5k licencia + $150/mes hosting',
        price: 5000,
        billingCycle: 'YEARLY',
        maxBranches: 1,
        maxUsersPerBranch: null,
        features: ['qr-payments', 'cashier-module', 'admin-panel', 'basic-reports', 'email-support']
      }
    });

    console.log('✅ Planes creados');

    // Crear suscripción para empresa legado
    const legacyCompany = await prisma.company.findUnique({
      where: { email: 'legacy@mealpay.com' }
    });

    if (legacyCompany && !legacyCompany.subscriptionId) {
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const subscription = await prisma.subscription.create({
        data: {
          planId: enterprisePlan.id,
          status: 'ACTIVE',
          endDate
        }
      });

      await prisma.company.update({
        where: { id: legacyCompany.id },
        data: { subscriptionId: subscription.id }
      });

      console.log('✅ Suscripción creada para empresa legado');
    }

    // Crear empresas de prueba
    const testCompany1 = await prisma.company.upsert({
      where: { email: 'restaurante1@ejemplo.com' },
      update: {},
      create: {
        name: 'Restaurante El Gourmet',
        email: 'restaurante1@ejemplo.com',
        phone: '+55 (11) 98765-4321',
        industry: 'Restaurante',
        contactPerson: 'Roberto Silva',
        paymentEmail: 'pagos@gourmet.com.br',
        isActive: true,
        masterAdminEmail: 'admin@gourmet.com.br'
      }
    });

    // Crear suscripción para empresa 1
    const endDate1 = new Date();
    endDate1.setMonth(endDate1.getMonth() + 1);

    const sub1 = await prisma.subscription.create({
      data: {
        planId: litePlan.id,
        status: 'ACTIVE',
        endDate: endDate1
      }
    });

    await prisma.company.update({
      where: { id: testCompany1.id },
      data: { subscriptionId: sub1.id }
    });

    const testCompany2 = await prisma.company.upsert({
      where: { email: 'cafeteria@ejemplo.com' },
      update: {},
      create: {
        name: 'Cafetería Premium',
        email: 'cafeteria@ejemplo.com',
        phone: '+55 (11) 99999-8888',
        industry: 'Cafetería',
        contactPerson: 'Maria Santos',
        paymentEmail: 'billing@cafeteria.com.br',
        isActive: true,
        masterAdminEmail: 'admin@cafeteria.com.br'
      }
    });

    // Crear suscripción para empresa 2
    const endDate2 = new Date();
    endDate2.setMonth(endDate2.getMonth() + 2);

    const sub2 = await prisma.subscription.create({
      data: {
        planId: litePlan.id,
        status: 'ACTIVE',
        endDate: endDate2
      }
    });

    await prisma.company.update({
      where: { id: testCompany2.id },
      data: { subscriptionId: sub2.id }
    });

    console.log('✅ Empresas de prueba creadas');

    res.json({
      success: true,
      message: '✅ Datos de prueba creados',
      data: {
        plans: [enterprisePlan, litePlan],
        companies: [legacyCompany, testCompany1, testCompany2]
      }
    });
  } catch (error) {
    console.error('❌ Error en seed-plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para crear Master Admin
router.post('/setup-master', async (req, res) => {
  try {
    console.log('🔐 Creando Master Admin...');

    const hashedPassword = await bcrypt.hash('Anubis920520.#', 10);

    // Buscar si ya existe el usuario
    const existing = await prisma.user.findUnique({
      where: { email: 'alejandro.qt92@gmail.com' }
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Master Admin ya existe',
        email: 'alejandro.qt92@gmail.com'
      });
    }

    // Crear usuario Master Admin
    const masterAdmin = await prisma.user.create({
      data: {
        name: 'Alejandro Quezada',
        email: 'alejandro.qt92@gmail.com',
        password: hashedPassword,
        employeeNumber: 'MASTER-001',
        phone: '+55 (11) 99999-9999',
        role: 'ADMIN',
        balance: 0,
        qrCode: randomUUID(),
        isActive: true
      }
    });

    console.log('✅ Master Admin creado');

    res.json({
      success: true,
      message: '✅ Master Admin creado exitosamente',
      user: {
        email: masterAdmin.email,
        name: masterAdmin.name,
        role: masterAdmin.role
      }
    });
  } catch (error) {
    console.error('❌ Error creando master admin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para crear empresa de prueba con sucursales
router.post('/setup-asinmex', async (req, res) => {
  try {
    console.log('🏢 Creando empresa ASINMEX con sucursales...');

    // Obtener plan LITE
    const litePlan = await prisma.plan.findUnique({
      where: { name: 'LITE' }
    });

    if (!litePlan) {
      return res.status(400).json({ error: 'Plan LITE no existe. Ejecuta /api/init/seed-plans primero' });
    }

    // Buscar si ya existe
    const existing = await prisma.company.findUnique({
      where: { email: 'asinmex@asinmex.com.mx' }
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'ASINMEX ya existe',
        company: existing
      });
    }

    // Crear empresa
    const company = await prisma.company.create({
      data: {
        name: 'ASINMEX SA DE CV',
        email: 'asinmex@asinmex.com.mx',
        phone: '+52 (55) 5555-5555',
        industry: 'Industrial',
        contactPerson: 'Gerente General',
        paymentEmail: 'pagos@asinmex.com.mx',
        isActive: true,
        masterAdminEmail: 'admin@asinmex.com.mx'
      }
    });

    // Crear suscripción para la empresa
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        planId: litePlan.id,
        status: 'ACTIVE',
        endDate
      }
    });

    await prisma.company.update({
      where: { id: company.id },
      data: { subscriptionId: subscription.id }
    });

    // Crear sucursales
    const branches = await Promise.all([
      prisma.branch.create({
        data: {
          companyId: company.id,
          name: 'AIVY',
          location: 'México City',
          isActive: true,
          licenseStatus: 'ACTIVE',
          monthlyFee: 5000
        }
      }),
      prisma.branch.create({
        data: {
          companyId: company.id,
          name: 'BOCH',
          location: 'México City',
          isActive: true,
          licenseStatus: 'ACTIVE',
          monthlyFee: 5000
        }
      })
    ]);

    console.log('✅ ASINMEX creada con sucursales');

    res.json({
      success: true,
      message: '✅ ASINMEX y sucursales creadas',
      company: {
        name: company.name,
        email: company.email,
        branches: branches.map(b => ({ id: b.id, name: b.name, location: b.location }))
      }
    });
  } catch (error) {
    console.error('❌ Error creando ASINMEX:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para crear vendedores en sucursales de ASINMEX
router.post('/seed-asinmex-cashiers', async (req, res) => {
  try {
    console.log('💳 Creando vendedores en sucursales de ASINMEX...');

    const branches = await prisma.branch.findMany({
      where: { company: { email: 'asinmex@asinmex.com.mx' } }
    });

    if (branches.length === 0) {
      return res.status(400).json({ error: 'ASINMEX no tiene sucursales' });
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    let totalCashiersCreated = 0;

    for (const branch of branches) {
      const email = `vendedor@${branch.name.toLowerCase()}.asinmex.com`;
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        console.log(`⏭️  Vendedor ${email} ya existe`);
        continue;
      }

      await prisma.user.create({
        data: {
          name: `Vendedor ${branch.name}`,
          email,
          password: hashedPassword,
          phone: '+52 5555-0000',
          role: 'CASHIER',
          employeeNumber: `CASH-${branch.name}-001`,
          branchId: branch.id,
          qrCode: randomUUID(),
          isActive: true
        }
      });

      totalCashiersCreated++;
    }

    res.json({
      success: true,
      message: `✅ ${totalCashiersCreated} vendedores creados`,
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        vendedorEmail: `vendedor@${b.name.toLowerCase()}.asinmex.com`
      }))
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para crear usuarios de prueba en sucursales de ASINMEX
router.post('/seed-asinmex-users', async (req, res) => {
  try {
    console.log('👥 Creando usuarios de prueba en sucursales de ASINMEX...');

    // Obtener ASINMEX
    const company = await prisma.company.findUnique({
      where: { email: 'asinmex@asinmex.com.mx' }
    });

    if (!company) {
      return res.status(400).json({ error: 'ASINMEX no existe. Ejecuta /api/init/setup-asinmex primero' });
    }

    // Obtener sucursales de ASINMEX
    const branches = await prisma.branch.findMany({
      where: { companyId: company.id }
    });

    if (branches.length === 0) {
      return res.status(400).json({ error: 'ASINMEX no tiene sucursales' });
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    let totalUsersCreated = 0;

    // Crear 3 usuarios por sucursal
    for (const branch of branches) {
      const branchUsers = [];

      for (let i = 1; i <= 3; i++) {
        const email = `usuario${i}@${branch.name.toLowerCase()}.asinmex.com`;
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
          console.log(`⏭️  Usuario ${email} ya existe, saltando...`);
          continue;
        }

        const qrCode = randomUUID();

        const user = await prisma.user.create({
          data: {
            name: `Usuario ${i} - ${branch.name}`,
            email,
            password: hashedPassword,
            employeeNumber: `${branch.name}-USR-${i}`,
            phone: `+52 555${i}${i}${i}${i}`,
            qrCode,
            balance: (100 + i * 50),
            branchId: branch.id,
            role: 'USER',
            isActive: true
          }
        });

        branchUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          qrCode: user.qrCode,
          balance: user.balance.toString()
        });

        totalUsersCreated++;
      }

      console.log(`✅ ${branchUsers.length} usuarios creados en sucursal ${branch.name}`);
    }

    res.json({
      success: true,
      message: `✅ ${totalUsersCreated} usuarios creados en sucursales de ASINMEX`,
      totalUsers: totalUsersCreated,
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        location: b.location
      }))
    });
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para crear productos de prueba en sucursales de ASINMEX
router.post('/seed-asinmex-products', async (req, res) => {
  try {
    console.log('🍽️ Creando productos de prueba en sucursales...');

    const branches = await prisma.branch.findMany({
      where: { company: { email: 'asinmex@asinmex.com.mx' } }
    });

    if (branches.length === 0) {
      return res.status(400).json({ error: 'ASINMEX no tiene sucursales' });
    }

    const productsTemplate = [
      { name: 'Comida del día', price: 50, category: 'Platillos' },
      { name: 'Bebida', price: 15, category: 'Bebidas' },
      { name: 'Postre', price: 20, category: 'Postres' },
      { name: 'Combo Completo', price: 80, category: 'Combos' },
      { name: 'Sopa', price: 25, category: 'Platillos' },
      { name: 'Agua', price: 10, category: 'Bebidas' }
    ];

    let totalProducts = 0;

    for (const branch of branches) {
      for (const productTemplate of productsTemplate) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            branchId: branch.id,
            name: productTemplate.name
          }
        });

        if (existingProduct) continue;

        await prisma.product.create({
          data: {
            branchId: branch.id,
            name: productTemplate.name,
            price: productTemplate.price,
            category: productTemplate.category,
            isActive: true
          }
        });

        totalProducts++;
      }
    }

    res.json({
      success: true,
      message: `✅ ${totalProducts} productos creados`,
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        productCount: productsTemplate.length
      }))
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
