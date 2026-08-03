import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// GET products by branch (menú/cobro) — excluye INSUMO (esos son solo de operación, no se venden)
router.get('/branch/:branchId', verifyToken, checkRole(['ADMIN', 'CASHIER', 'USER']), async (req, res) => {
  try {
    // Sin esto, cualquier usuario autenticado (comensal, cajero o admin) podía ver el
    // menú de una sucursal de OTRA empresa con solo cambiar el branchId en la URL.
    const requester = await prisma.user.findUnique({ where: { id: req.userId }, include: { branch: true } });
    const companyId = req.userCompanyId || requester?.branch?.companyId;
    const targetBranch = companyId ? await prisma.branch.findUnique({ where: { id: req.params.branchId }, select: { companyId: true } }) : null;
    if (!targetBranch || targetBranch.companyId !== companyId) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    const products = await prisma.product.findMany({
      where: { branchId: req.params.branchId, isActive: true, productType: { not: 'INSUMO' } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    res.json(products.map(p => ({
      ...p,
      price: p.price.toString()
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

export function computeCurrentWeek(startDate, mode, manualWeek) {
  if (mode === 'MANUAL') return Math.min(8, Math.max(1, parseInt(manualWeek) || 1));
  if (!startDate) return 1;
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now - start) / 86400000);
  if (diffDays < 0) return 1;
  const weeksSince = Math.floor(diffDays / 7);
  return (weeksSince % 8) + 1;
}

// GET el platillo del menú rotativo que toca HOY en esta sucursal, uno por cada nivel de
// subsidio (el rotativo ES el menú subsidiado). Lo usan el comensal (Menú del día) y el
// cajero (para mostrar qué platillo corresponde a cada tier al cobrar subsidiado).
router.get('/branch/:branchId/rotation-today', verifyToken, checkRole(['ADMIN', 'CASHIER', 'USER']), async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.branchId },
      include: { company: { select: { id: true, menuRotationEnabled: true, menuRotationStartDate: true, menuRotationMode: true, menuRotationManualWeek: true } } }
    });
    const requester = await prisma.user.findUnique({ where: { id: req.userId }, include: { branch: true } });
    const companyId = req.userCompanyId || requester?.branch?.companyId;
    if (!branch || branch.companyId !== companyId) return res.status(404).json({ error: 'Sucursal no encontrada' });

    if (!branch.company?.menuRotationEnabled || !branch.useMenuRotation) {
      return res.json({ active: false });
    }

    // Los niveles de subsidio que aplican a esta sucursal (propios de la sucursal + los generales de la empresa)
    const tiers = await prisma.subsidyTier.findMany({
      where: { companyId: branch.company.id, isActive: true, OR: [{ branchId: branch.id }, { branchId: null }] },
      orderBy: { name: 'asc' }
    });

    // MANUAL: esta sucursal puso su propio platillo de hoy por nivel, ignora el ciclo.
    if (branch.menuRotationMode === 'MANUAL') {
      const manualMenus = await prisma.branchManualMenu.findMany({ where: { branchId: branch.id } });
      return res.json({
        active: true, mode: 'MANUAL',
        items: tiers.map(t => {
          const m = manualMenus.find(x => x.subsidyTierId === t.id);
          return { subsidyTierId: t.id, tierName: t.name, cost: t.cost.toString(), dishName: m?.dishName || null };
        })
      });
    }

    // AUTO (default): sigue el ciclo de 8 semanas de la empresa, un platillo por nivel.
    const week = computeCurrentWeek(branch.company.menuRotationStartDate, branch.company.menuRotationMode, branch.company.menuRotationManualWeek);
    const jsDay = new Date().getDay(); // 0=domingo...6=sábado
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // 1=lunes...7=domingo

    const days = await prisma.menuRotationDay.findMany({
      where: { companyId: branch.company.id, week, dayOfWeek, subsidyTierId: { in: tiers.map(t => t.id) } }
    });

    res.json({
      active: true, mode: 'AUTO', week, dayOfWeek,
      items: tiers.map(t => {
        const d = days.find(x => x.subsidyTierId === t.id);
        return { subsidyTierId: t.id, tierName: t.name, cost: t.cost.toString(), dishName: d?.dishName || null };
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el menú del día' });
  }
});

// CASHIER: listar TODOS los productos de su sucursal (activos e inactivos) — para gestionar el menú del día
router.get('/cashier/branch', verifyToken, checkRole(['CASHIER']), async (req, res) => {
  try {
    const cashier = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true }
    });
    if (!cashier?.branchId) return res.status(400).json({ error: 'No tienes una sucursal asignada' });
    const products = await prisma.product.findMany({
      where: { branchId: cashier.branchId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    res.json(products.map(p => ({ ...p, price: p.price.toString() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// CASHIER: reactivar producto (volver a ofrecerlo hoy)
router.put('/cashier/:id/activate', verifyToken, checkRole(['CASHIER']), async (req, res) => {
  try {
    const cashier = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { branchId: true }
    });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product || product.branchId !== cashier?.branchId) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const updated = await prisma.product.update({ where: { id: req.params.id }, data: { isActive: true } });
    res.json({ ...updated, price: updated.price.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reactivar producto' });
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

export default router;
