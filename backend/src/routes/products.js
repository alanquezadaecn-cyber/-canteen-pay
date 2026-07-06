import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// GET products by branch (accesible para ADMIN y CASHIER)
router.get('/branch/:branchId', verifyToken, checkRole(['ADMIN', 'CASHIER']), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId, isActive: true },
      orderBy: { category: 'asc' }
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// CASHIER: crear producto en su propia sucursal
router.post('/cashier/create', verifyToken, checkRole(['CASHIER']), async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name?.trim() || !price) {
      return res.status(400).json({ error: 'Nombre y precio requeridos' });
    }
    const cashier = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true }
    });
    if (!cashier?.branchId) {
      return res.status(400).json({ error: 'No tienes una sucursal asignada' });
    }
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        category: category?.trim() || 'General',
        branchId: cashier.branchId
      }
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// CASHIER: eliminar producto de su sucursal
router.delete('/cashier/:id', verifyToken, checkRole(['CASHIER']), async (req, res) => {
  try {
    const cashier = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true }
    });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product || product.branchId !== cashier?.branchId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// CASHIER: actualizar precio de producto de su sucursal
router.put('/cashier/:id', verifyToken, checkRole(['CASHIER']), async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const cashier = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true }
    });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product || product.branchId !== cashier?.branchId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(price && { price: parseFloat(price) }),
        ...(category && { category: category.trim() })
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.use(verifyToken, checkRole(['ADMIN']));

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// CREATE product
router.post('/', async (req, res) => {
  try {
    const { name, price, category, branchId, image } = req.body;

    if (!name?.trim() || !price) {
      return res.status(400).json({ error: 'Nombre y precio requeridos' });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        category: category?.trim() || 'General',
        branchId: branchId || null,
        image: image || null
      }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// UPDATE product
router.put('/:id', async (req, res) => {
  try {
    const { name, price, category, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(price && { price: parseFloat(price) }),
        ...(category && { category: category.trim() }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
