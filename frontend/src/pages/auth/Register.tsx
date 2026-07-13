import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { branchId: urlBranchId } = useParams<{ branchId?: string }>();
  const { setAuth } = useAuthStore();

  const [branches, setBranches] = useState<{ id: string; name: string; location: string }[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    branchId: urlBranchId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar sucursales disponibles
    fetch('/api/public/branches')
      .then(r => r.json())
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchId) { setError('Selecciona tu sucursal / comedor'); return; }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (!form.phone.trim()) { setError('El teléfono es requerido'); return; }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        branchId: form.branchId
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      const u = data.user;
      navigate(u.companySlug && u.branchSlug ? `/${u.companySlug}/${u.branchSlug}/user` : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Crear cuenta</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Regístrate para usar el comedor</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Selección de sucursal */}
            {!urlBranchId && branches.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Comedor *</label>
                <div className="grid grid-cols-2 gap-2">
                  {branches.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setForm({ ...form, branchId: b.id })}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${
                        form.branchId === b.id
                          ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{b.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{b.location}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {[
              { id: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Juan Pérez' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'juan@empresa.com' },
              { id: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••' },
              { id: 'phone', label: 'Teléfono', type: 'tel', placeholder: '+52 55 1234-5678' }
            ].map(({ id, label, type, placeholder }) => (
              <div key={id}>
                <label htmlFor={id} className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{label} *</label>
                <input
                  id={id}
                  type={type}
                  value={(form as any)[id]}
                  onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                  placeholder={placeholder}
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-base transition-colors disabled:opacity-40 mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-slate-900 dark:text-slate-50 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
