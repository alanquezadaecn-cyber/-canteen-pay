import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface LoginProps {
  mode?: 'admin' | 'branch';
}

export const Login: React.FC<LoginProps> = ({ mode }) => {
  const navigate = useNavigate();
  // Soporta: /login, /login/:branchId, /login/admin/:companySlug, /login/:companySlug/:branchSlug,
  // /:companySlug/admin (mode='admin'), /:companySlug/:branchSlug (mode='branch')
  const { branchId, companySlug, branchSlug } = useParams<{
    branchId?: string;
    companySlug?: string;
    branchSlug?: string;
  }>();
  const { setAuth } = useAuthStore();

  const isAdminLogin = mode === 'admin' || (branchId === 'admin' && !!companySlug) || window.location.pathname.startsWith('/login/admin/');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Contexto resuelto desde la URL
  const [context, setContext] = useState<{
    type: 'generic' | 'admin' | 'branch';
    companyName?: string;
    branchName?: string;
    branchId?: string;
    logoUrl?: string | null;
  }>({ type: 'generic' });

  useEffect(() => {
    // /login/:branchId (UUID legacy)
    if (branchId && branchId !== 'admin' && branchId.length > 20) {
      fetch(`/api/public/branch/${branchId}`)
        .then(r => r.json())
        .then(d => setContext({ type: 'branch', branchName: d.name, branchId, logoUrl: d.logoUrl }))
        .catch(() => {});
      return;
    }
    // Login de admin de empresa
    if (isAdminLogin && companySlug) {
      fetch(`/api/public/slug/${companySlug.toLowerCase()}`)
        .then(r => r.json())
        .then(d => setContext({ type: 'admin', companyName: d.name, logoUrl: d.logoUrl }))
        .catch(() => {});
      return;
    }
    // Login de sucursal (cajero/comensal)
    if (companySlug && branchSlug) {
      fetch(`/api/public/slug/${companySlug.toLowerCase()}/${branchSlug.toLowerCase()}`)
        .then(r => r.json())
        .then(d => setContext({ type: 'branch', companyName: d.company?.name, branchName: d.branch?.name, branchId: d.branch?.id, logoUrl: d.company?.logoUrl }))
        .catch(() => {});
    }
  }, [branchId, companySlug, branchSlug, isAdminLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email y contraseña requeridos'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
        branchId: context.branchId || (branchId && branchId.length > 20 ? branchId : undefined)
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      const u = data.user;
      // URLs jerárquicas: empresa/admin · empresa/sucursal/caja · empresa/sucursal/user
      // Preferir slugs del user (BD); si faltan, usar los de la URL actual
      const c = u.companySlug || companySlug?.toLowerCase();
      const b = u.branchSlug || branchSlug?.toLowerCase();
      navigate(
        u.role === 'MASTER_ADMIN' ? '/master-admin' :
        u.role === 'ADMIN'        ? (c ? `/${c}/admin` : '/master-admin') :
        u.role === 'CASHIER'      ? (c && b ? `/${c}/${b}/caja` : `/caja/${u.branchId}`) :
        (c && b ? `/${c}/${b}/user` : '/dashboard')
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const title =
    context.type === 'admin'  ? `Admin — ${context.companyName || ''}` :
    context.type === 'branch' ? (context.branchName || 'Comedor') :
    'MealPay';

  const subtitle =
    context.type === 'admin'  ? 'Panel de administración' :
    context.type === 'branch' ? (context.companyName ? `${context.companyName}` : 'Acceso al comedor') :
    'Sistema de pago digital para comedores';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* brillos decorativos */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">

        {/* Logo / título */}
        <div className="text-center mb-8">
          {context.logoUrl && (
            <img src={context.logoUrl} alt={context.companyName || 'Logo'} className="w-20 h-20 object-contain mx-auto mb-4 rounded-2xl bg-white p-2 shadow-lg" />
          )}
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-emerald-100 text-sm mt-2">{subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-900/20 p-6 space-y-4">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors disabled:opacity-40 mt-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          {context.type === 'branch' && (
            <p className="text-center text-xs text-slate-400 pt-1">
              ¿Sin cuenta?{' '}
              <Link
                to={context.branchId ? `/register/${context.branchId}` : '/register'}
                className="text-emerald-600 hover:text-emerald-500 font-semibold"
              >
                Regístrate aquí
              </Link>
            </p>
          )}
        </div>

        {/* Marca del software */}
        <p className="text-center text-xs text-emerald-100/80 mt-6">
          Desarrollado con <span className="font-semibold text-white">MealPay</span> — pago digital para comedores
        </p>
      </div>
    </div>
  );
};
