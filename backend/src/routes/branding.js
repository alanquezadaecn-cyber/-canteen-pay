import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// GET branding de la empresa de la sesión actual (cualquier rol autenticado con companyId)
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.userCompanyId) return res.json({ name: null, logoUrl: null });
    const company = await prisma.company.findUnique({
      where: { id: req.userCompanyId },
      select: { name: true, logoUrl: true }
    });
    res.json(company || { name: null, logoUrl: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener branding' });
  }
});

// PUT actualizar logo de la propia empresa (solo ADMIN)
router.put('/logo', verifyToken, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { logoUrl } = req.body;
    if (!req.userCompanyId) return res.status(400).json({ error: 'Sin empresa asociada' });
    if (logoUrl && !logoUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Formato de imagen inválido' });
    }
    // ~2MB de base64 como tope razonable
    if (logoUrl && logoUrl.length > 2_800_000) {
      return res.status(400).json({ error: 'La imagen es demasiado grande. Usa un logo más pequeño.' });
    }
    const company = await prisma.company.update({
      where: { id: req.userCompanyId },
      data: { logoUrl: logoUrl || null }
    });
    res.json({ success: true, logoUrl: company.logoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar logo' });
  }
});

export default router;
