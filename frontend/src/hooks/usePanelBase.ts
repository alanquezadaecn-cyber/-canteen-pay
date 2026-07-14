import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Devuelve el prefijo base de la URL del panel actual, siempre con empresa/sucursal.
 * - Comensal: /:empresa/:sucursal/user
 * - Cajero:   /:empresa/:sucursal/caja
 * - Admin:    /:empresa/admin
 * Toma los slugs de la URL si están presentes, si no de la sesión.
 */
export function usePanelBase(): string {
  const params = useParams<{ companySlug?: string; branchSlug?: string }>();
  const { user, activePanel } = useAuthStore();

  // Preferir los slugs REALES de la sesión (BD) sobre los de la URL,
  // así una URL con slug viejo se corrige a la sucursal correcta.
  const company = user?.companySlug || params.companySlug || '';
  const branch = user?.branchSlug || params.branchSlug || '';

  const panel = activePanel;

  if (panel === 'admin') {
    return company ? `/${company}/admin` : '/admin';
  }
  if (panel === 'cashier') {
    return company && branch ? `/${company}/${branch}/caja` : '/cashier';
  }
  if (panel === 'user') {
    return company && branch ? `/${company}/${branch}/user` : '/dashboard';
  }
  return '';
}

/** Base para el comensal, independiente del panel activo (usado en layouts). */
export function comensalBase(companySlug?: string | null, branchSlug?: string | null): string {
  return companySlug && branchSlug ? `/${companySlug}/${branchSlug}/user` : '/dashboard';
}
export function cajaBase(companySlug?: string | null, branchSlug?: string | null): string {
  return companySlug && branchSlug ? `/${companySlug}/${branchSlug}/caja` : '/cashier';
}
export function adminBase(companySlug?: string | null): string {
  return companySlug ? `/${companySlug}/admin` : '/admin';
}
