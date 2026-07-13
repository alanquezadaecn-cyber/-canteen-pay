import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { detectSubdomain } from './middleware/subdomain.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://mealpay.up.railway.app',
  'https://cashfood.online',
  'https://www.cashfood.online',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (apps móviles, curl) y los orígenes en la lista
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    // Permitir cualquier subdominio de cashfood.online y dominios railway
    if (/\.cashfood\.online$/.test(origin) || /\.up\.railway\.app$/.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Detectar subdominio PRIMERO
app.use(detectSubdomain);

// Raw body middleware para Stripe webhook (ANTES de express.json())
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Servir archivos estáticos del frontend
const publicPath = join(__dirname, '../public');

// Archivos assets (JS/CSS) con caché larga
app.use('/assets', express.static(join(publicPath, 'assets'), {
  maxAge: '1y',
  immutable: true
}));

// index.html NUNCA se cachea
app.use(express.static(publicPath, {
  maxAge: 0,
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html') || filePath.endsWith('/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0' });
});

// Endpoint público para obtener nombre de sucursal (sin auth, para la pantalla de login)
app.get('/api/public/branch/:branchId', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.branchId },
      select: { id: true, name: true, location: true, company: { select: { logoUrl: true, name: true } } }
    });
    if (!branch) return res.status(404).json({ error: 'Sucursal no encontrada' });
    res.json({ ...branch, logoUrl: branch.company?.logoUrl || null });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// Lookup por slug: /api/public/slug/:companySlug  → info de empresa + sucursales
app.get('/api/public/slug/:companySlug', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    const company = await prisma.company.findUnique({
      where: { slug: req.params.companySlug.toLowerCase() },
      select: {
        id: true, name: true, slug: true, logoUrl: true,
        branches: { where: { isActive: true, isBlocked: false }, select: { id: true, name: true, slug: true, location: true } }
      }
    });
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(company);
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

// Lookup por slug: /api/public/slug/:companySlug/:branchSlug → info de sucursal
app.get('/api/public/slug/:companySlug/:branchSlug', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    const company = await prisma.company.findUnique({
      where: { slug: req.params.companySlug.toLowerCase() },
      select: { id: true, name: true, slug: true, logoUrl: true, branches: { where: { slug: req.params.branchSlug.toLowerCase() }, select: { id: true, name: true, slug: true, location: true } } }
    });
    if (!company || !company.branches[0]) return res.status(404).json({ error: 'Sucursal no encontrada' });
    res.json({ company: { id: company.id, name: company.name, slug: company.slug, logoUrl: company.logoUrl }, branch: company.branches[0] });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

// Endpoint público para listar sucursales activas (para autoregistro de comensales)
app.get('/api/public/branches', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    const branches = await prisma.branch.findMany({
      where: { isActive: true, isBlocked: false },
      select: { id: true, name: true, location: true },
      orderBy: { name: 'asc' }
    });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import cashierRoutes from './routes/cashier.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import branchRoutes from './routes/branches.js';
import productRoutes from './routes/products.js';
import reportRoutes from './routes/reports.js';
import userMgmtRoutes from './routes/user-management.js';
import cashierSessionRoutes from './routes/cashier-sessions.js';
import masterAdminRoutes from './routes/master-admin.js';
import initRoutes from './routes/init.js';
import inventoryRoutes from './routes/inventory.js';
import brandingRoutes from './routes/branding.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/user-management', userMgmtRoutes);
app.use('/api/cashier-sessions', cashierSessionRoutes);
app.use('/api/master-admin', masterAdminRoutes);
app.use('/api/init', initRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/branding', brandingRoutes);

// SPA Fallback - sirve index.html para cualquier ruta que no sea API
app.get('*', (req, res) => {
  // Si es una ruta de API, no hacer nada (ya fue manejada arriba)
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Para cualquier otra ruta, servir index.html (SPA)
  const indexPath = join(publicPath, 'index.html');

  // Verificar que index.html existe
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Si no existe, devolver JSON
    res.status(404).json({
      error: 'Frontend not found',
      message: 'index.html no está disponible',
      path: req.path
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 8080;

// Start server with error handling
try {
  app.listen(PORT, () => {
    console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📁 Sirviendo archivos estáticos desde: ${publicPath}`);
    console.log(`🌐 Frontend disponible en: http://localhost:${PORT}`);
  });
} catch (error) {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
