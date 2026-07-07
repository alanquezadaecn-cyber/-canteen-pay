import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken, checkRole(['ADMIN', 'CASHIER']));

// GET branches available for admin inventory view
router.get('/branches', async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true, role: true }
    });

    if (admin?.role === 'CASHIER') {
      const branch = await prisma.branch.findUnique({
        where: { id: admin.branchId || '' },
        select: { id: true, name: true }
      });
      return res.json(branch ? [branch] : []);
    }

    // Para ADMIN: obtener todas las sucursales de su empresa
    if (admin?.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: admin.branchId },
        select: { companyId: true }
      });
      if (branch) {
        const branches = await prisma.branch.findMany({
          where: { companyId: branch.companyId, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
        return res.json(branches);
      }
    }

    // Master admin: todas las sucursales
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// GET inventory for a branch — solo productos físicos (productType = PRODUCTO)
router.get('/branch/:branchId', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId, isActive: true, productType: 'PRODUCTO' },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    res.json(products.map(p => ({
      ...p,
      price: p.price.toString()
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// PUT actualizar stock/tracking de un producto
router.put('/:id/stock', async (req, res) => {
  try {
    const { stock, minStock, isTracked } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) }),
        ...(isTracked !== undefined && { isTracked: Boolean(isTracked) })
      }
    });
    res.json({ ...product, price: product.price.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

// POST reabastecer producto
router.post('/:id/restock', async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ error: 'Cantidad inválida' });

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const prevStock = product.stock;
    const newStock = prevStock === -1 ? qty : prevStock + qty;

    await prisma.$transaction([
      prisma.product.update({
        where: { id: req.params.id },
        data: { stock: newStock, isTracked: true }
      }),
      prisma.stockMovement.create({
        data: {
          productId: req.params.id,
          type: 'RESTOCK',
          quantity: qty,
          prevStock,
          newStock,
          note: note || null,
          createdBy: req.userId
        }
      })
    ]);

    res.json({ success: true, newStock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reabastecer' });
  }
});

// GET historial de movimientos
router.get('/:id/movements', async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { productId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(movements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

export default router;
