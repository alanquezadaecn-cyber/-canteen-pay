import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken, checkRole(['ADMIN', 'CASHIER']));

async function adminCompanyId(req) {
  if (req.userCompanyId) return req.userCompanyId;
  const admin = await prisma.user.findUnique({ where: { id: req.userId }, include: { branch: true } });
  return admin?.branch?.companyId || null;
}

// Resuelve las sucursales visibles para el usuario autenticado: el cajero solo la suya,
// el admin todas las de su empresa. Antes, si no se podía determinar una empresa, caía
// en "todas las sucursales de la plataforma" — eso exponía inventario de OTRAS empresas
// (IDOR); ahora sin empresa resuelta simplemente no se ve ninguna sucursal.
async function visibleBranches(req) {
  const companyId = await adminCompanyId(req);
  if (!companyId) return [];
  const me = await prisma.user.findUnique({ where: { id: req.userId }, select: { branchId: true, role: true } });
  if (me?.role === 'CASHIER') {
    const branch = await prisma.branch.findUnique({ where: { id: me.branchId || '' }, select: { id: true, name: true, companyId: true } });
    return branch && branch.companyId === companyId ? [branch] : [];
  }
  return prisma.branch.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true, companyId: true },
    orderBy: { name: 'asc' }
  });
}

// GET branches available for admin inventory view
router.get('/branches', async (req, res) => {
  try {
    const branches = await visibleBranches(req);
    res.json(branches.map(({ id, name }) => ({ id, name })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// GET resumen de inventario por sucursal — para que el admin vea de un vistazo
// qué sucursal tiene stock bajo/agotado/solicitudes pendientes, sin cambiar el filtro una por una.
router.get('/summary', async (req, res) => {
  try {
    const branches = await visibleBranches(req);
    const results = await Promise.all(branches.map(async (b) => {
      const products = await prisma.product.findMany({
        where: { branchId: b.id, isActive: true, productType: { in: ['PRODUCTO', 'INSUMO'] } },
        select: { stock: true, minStock: true, isTracked: true }
      });
      const pendingRequests = await prisma.restockRequest.count({ where: { branchId: b.id, status: 'PENDING' } });
      return {
        id: b.id,
        name: b.name,
        total: products.length,
        lowStock: products.filter(p => p.isTracked && p.stock > 0 && p.stock <= p.minStock && p.minStock > 0).length,
        outOfStock: products.filter(p => p.isTracked && p.stock === 0).length,
        pendingRequests
      };
    }));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el resumen de inventario' });
  }
});

// POST solicitar reabasto de un producto (lo dispara el cajero, lo ve el admin)
router.post('/:productId/request-restock', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, note } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, branchId: true } });
    if (!product || !product.branchId) return res.status(404).json({ error: 'Producto no encontrado' });

    const branches = await visibleBranches(req);
    if (!branches.some(b => b.id === product.branchId)) {
      return res.status(403).json({ error: 'No autorizado para este producto' });
    }

    // Evitar duplicar: si ya hay una solicitud pendiente para este producto, no crear otra
    const existing = await prisma.restockRequest.findFirst({ where: { productId, status: 'PENDING' } });
    if (existing) return res.json({ success: true, alreadyRequested: true, request: existing });

    const request = await prisma.restockRequest.create({
      data: {
        productId, branchId: product.branchId,
        quantity: quantity ? parseInt(quantity) : null,
        note: note?.trim() || null,
        requestedBy: req.userId
      }
    });
    res.status(201).json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al solicitar reabasto' });
  }
});

// GET solicitudes de reabasto — ADMIN ve las de toda su empresa, CASHIER solo las de su sucursal
router.get('/restock-requests', async (req, res) => {
  try {
    const branches = await visibleBranches(req);
    const branchIds = branches.map(b => b.id);
    const bmap = Object.fromEntries(branches.map(b => [b.id, b.name]));
    const status = req.query.status ? String(req.query.status) : 'PENDING';

    const requests = await prisma.restockRequest.findMany({
      where: { branchId: { in: branchIds }, ...(status !== 'ALL' && { status }) },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    const productIds = [...new Set(requests.map(r => r.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, category: true, stock: true, minStock: true } });
    const pmap = Object.fromEntries(products.map(p => [p.id, p]));

    res.json(requests.map(r => ({
      id: r.id, status: r.status, quantity: r.quantity, note: r.note, createdAt: r.createdAt,
      branchName: bmap[r.branchId] || '', product: pmap[r.productId] || null
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener solicitudes de reabasto' });
  }
});

// PUT resolver una solicitud de reabasto (ADMIN): reabastecer de verdad o descartar
router.put('/restock-requests/:id', checkRole(['ADMIN']), async (req, res) => {
  try {
    const { action, quantity } = req.body; // action: 'fulfill' | 'dismiss'
    const request = await prisma.restockRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.status !== 'PENDING') return res.status(404).json({ error: 'Solicitud no encontrada' });

    const branches = await visibleBranches(req);
    if (!branches.some(b => b.id === request.branchId)) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (action === 'fulfill') {
      const qty = parseInt(quantity) || request.quantity || 0;
      if (qty <= 0) return res.status(400).json({ error: 'Cantidad inválida' });

      const product = await prisma.product.findUnique({ where: { id: request.productId } });
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      const prevStock = product.stock;
      const newStock = prevStock === -1 ? qty : prevStock + qty;

      await prisma.$transaction([
        prisma.product.update({ where: { id: request.productId }, data: { stock: newStock, isTracked: true } }),
        prisma.stockMovement.create({
          data: { productId: request.productId, type: 'RESTOCK', quantity: qty, prevStock, newStock, note: 'Reabasto (solicitud de caja)', createdBy: req.userId }
        }),
        prisma.restockRequest.update({ where: { id: request.id }, data: { status: 'FULFILLED', resolvedAt: new Date() } })
      ]);
      return res.json({ success: true, newStock });
    }

    await prisma.restockRequest.update({ where: { id: request.id }, data: { status: 'DISMISSED', resolvedAt: new Date() } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al resolver la solicitud' });
  }
});

// CREATE producto físico (inventario) en una sucursal
// type: 'PRODUCTO' (se vende) | 'INSUMO' (operación, no se vende)
router.post('/branch/:branchId/create', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, price, category, stock, minStock, type, unit } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });

    const productType = type === 'INSUMO' ? 'INSUMO' : 'PRODUCTO';

    // Tanto cajero como admin solo pueden crear productos en una sucursal visible para
    // ellos (antes solo se validaba para CASHIER; un ADMIN podía crear productos en la
    // sucursal de OTRA empresa con solo mandar su branchId).
    const branches = await visibleBranches(req);
    if (!branches.some(b => b.id === branchId)) {
      return res.status(403).json({ error: 'No autorizado en esta sucursal' });
    }

    const initialStock = parseInt(stock);
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: productType === 'INSUMO' ? 0 : (parseFloat(price) || 0),
        category: category?.trim() || (unit?.trim() || 'General'),
        branchId,
        productType,
        stock: isNaN(initialStock) ? 0 : initialStock,
        minStock: parseInt(minStock) || 0,
        isTracked: true,
        isActive: true
      }
    });

    if (!isNaN(initialStock) && initialStock > 0) {
      await prisma.stockMovement.create({
        data: { productId: product.id, type: 'INITIAL', quantity: initialStock, prevStock: 0, newStock: initialStock, note: 'Stock inicial', createdBy: req.userId }
      });
    }

    res.status(201).json({ ...product, price: product.price.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Trae un producto SOLO si pertenece a una sucursal visible para el usuario autenticado.
// Sin esto, cualquier cajero/admin podía leer, modificar stock, reabastecer o eliminar
// CUALQUIER producto del sistema por ID, sin importar de qué sucursal/empresa fuera.
async function productInScope(req, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return null;
  const branches = await visibleBranches(req);
  if (!branches.some(b => b.id === product.branchId)) return null;
  return product;
}

// DELETE producto físico (desactivar)
router.delete('/:id', async (req, res) => {
  try {
    const product = await productInScope(req, req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// GET inventory for a branch — productos físicos (PRODUCTO, se venden) + insumos (INSUMO, operación)
router.get('/branch/:branchId', async (req, res) => {
  try {
    const branches = await visibleBranches(req);
    if (!branches.some(b => b.id === req.params.branchId)) {
      return res.status(403).json({ error: 'No autorizado en esta sucursal' });
    }
    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId, isActive: true, productType: { in: ['PRODUCTO', 'INSUMO'] } },
      orderBy: [{ productType: 'asc' }, { category: 'asc' }, { name: 'asc' }]
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
    const product = await productInScope(req, req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const { stock, minStock, isTracked } = req.body;
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) }),
        ...(isTracked !== undefined && { isTracked: Boolean(isTracked) })
      }
    });
    res.json({ ...updated, price: updated.price.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

// POST reabastecer producto
router.post('/:id/restock', async (req, res) => {
  try {
    const product = await productInScope(req, req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const { quantity, note } = req.body;
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ error: 'Cantidad inválida' });

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
    const product = await productInScope(req, req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

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
