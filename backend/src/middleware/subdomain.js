import { prisma } from '../lib/prisma.js';

export const detectSubdomain = async (req, res, next) => {
  try {
    const host = req.get('host') || '';
    const parts = host.split('.');

    // Extraer subdominio
    // asinmex.cashfood.online → asinmex
    // master.cashfood.online → master
    // cashfood.online → (root, sin subdominio)
    // localhost:3001 → (sin subdominio)

    let subdomain = null;

    if (parts.length > 2) {
      subdomain = parts[0];
    } else if (parts.length === 2 && !host.includes('localhost')) {
      // cashfood.online → no hay subdominio
      subdomain = null;
    }

    // Guardar subdominio en request
    req.subdomain = subdomain;
    req.companyId = null;
    req.companyData = null;

    // Si hay subdominio (no es root ni localhost), buscar empresa
    if (subdomain && subdomain !== 'master') {
      const company = await prisma.company.findFirst({
        where: {
          OR: [
            { id: subdomain }, // Por ID
            { name: { mode: 'insensitive', equals: subdomain } } // Por nombre (case-insensitive)
          ]
        }
      });

      if (company) {
        req.companyId = company.id;
        req.companyData = company;
      }
    }

    // Master admin → permite acceso a todas las empresas
    if (subdomain === 'master') {
      req.isMasterAdmin = true;
    }

    next();
  } catch (error) {
    console.error('❌ Subdomain detection error:', error);
    next();
  }
};
