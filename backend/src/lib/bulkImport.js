import bcrypt from 'bcrypt';
import { prisma } from './prisma.js';
import { QRService } from '../services/qr.service.js';
import { branchUserLimit } from './limits.js';

// Contraseña numérica de 8 dígitos, fácil de dictar al comensal
export function gen8DigitPassword() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

// Importación masiva de comensales a una sucursal.
// Requisito mínimo: NOMBRE. El # empleado, email, teléfono y contraseña son opcionales
// (se generan automáticamente si faltan).
export async function bulkImportComensales(branchId, users) {
  if (!Array.isArray(users) || users.length === 0) {
    return { httpError: { status: 400, error: 'Se requiere una lista de comensales' } };
  }

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return { httpError: { status: 404, error: 'Sucursal no encontrada' } };

  // Validar límite del plan (que el lote completo quepa)
  const { max, used } = await branchUserLimit(branchId);
  const validCount = users.filter(u => (u.name || '').trim()).length;
  if (max != null && used + validCount > max) {
    return { httpError: { status: 403, error: `El plan permite hasta ${max} comensales por sucursal. Hay ${used} y el archivo tiene ${validCount}. Reduce el archivo o actualiza tu plan.` } };
  }

  let success = 0;
  const errors = [];
  const created = [];

  // Siguiente # empleado consecutivo (se avanza en memoria)
  const maxCode = await prisma.user.aggregate({ _max: { employeeNumber: true } });
  let nextNum = 10001;
  const maxStr = maxCode._max?.employeeNumber;
  if (maxStr && /^\d+$/.test(maxStr)) nextNum = parseInt(maxStr) + 1;

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    try {
      if (!u.name?.trim()) {
        errors.push({ row: i + 2, error: 'El nombre es requerido' });
        continue;
      }

      const employeeNumber = u.employeeNumber?.toString().trim() || String(nextNum++);

      // Email: usar el dado o generar uno interno único (muchos comensales no tienen)
      let email = u.email?.trim().toLowerCase();
      if (email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) { errors.push({ row: i + 2, error: `Email ya registrado: ${email}` }); continue; }
      } else {
        email = `comensal-${employeeNumber}-${Date.now().toString().slice(-4)}${i}@${branch.slug || 'cashfood'}.local`;
      }

      const password = (u.password?.toString().trim()) || gen8DigitPassword(); // 8 dígitos autogenerada
      const hashedPassword = await bcrypt.hash(password, 10);
      const qrCode = QRService.generateUniqueCode();

      const newUser = await prisma.user.create({
        data: {
          name: u.name.trim(),
          email,
          password: hashedPassword,
          phone: u.phone?.toString().trim() || '+52 0000-0000',
          role: 'USER',
          employeeNumber,
          qrCode,
          branchId,
          isActive: true
        }
      });
      created.push({ name: newUser.name, email: newUser.email, employeeNumber: newUser.employeeNumber, qrCode: newUser.qrCode, password });
      success++;
    } catch (err) {
      errors.push({ row: i + 2, error: err.message || 'Error desconocido' });
    }
  }

  return { result: { success, failed: errors.length, errors, created } };
}
