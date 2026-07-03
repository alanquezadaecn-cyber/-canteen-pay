import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, checkRole(['ADMIN']));

// GET products by branch
router.get('/branch/:branchId', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId },
      orderBy: { category: 'asc' }
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

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
