import { prisma } from './prisma.js';

// Límite de comensales (role USER) por sucursal según el plan de la empresa.
// max = null  → ilimitado.
export async function branchUserLimit(branchId) {
  if (!branchId) return { max: null, used: 0, allowed: true };
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { company: { include: { subscription: { include: { plan: true } } } } }
  });
  const max = branch?.company?.subscription?.plan?.maxUsersPerBranch ?? null;
  const used = await prisma.user.count({ where: { branchId, role: 'USER' } });
  return { max, used, allowed: max == null || used < max, planName: branch?.company?.subscription?.plan?.name || null };
}

// Lanza error 403 si la sucursal ya alcanzó su límite de comensales.
export async function assertBranchHasRoom(branchId, res) {
  const { max, used, allowed, planName } = await branchUserLimit(branchId);
  if (!allowed) {
    res.status(403).json({
      error: `Límite de comensales alcanzado para esta sucursal (${used}/${max}). El plan ${planName || ''} permite hasta ${max}. Actualiza tu plan para agregar más.`
    });
    return false;
  }
  return true;
}
