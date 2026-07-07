import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Power, Plus, X, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

const MASTER_EMAILS = ['alejandro.qt92@gmail.com', 'master@mealpay.com'];
const isMaster = (email: string) => MASTER_EMAILS.includes(email);

interface User {
  id: string;
  name: string;
  email: string;
  employeeNumber: string;
  role: string;
  balance: string;
  isActive: boolean;
}

const ROLE_LABELS: Record<string, string> = { USER: 'Comensal', CASHIER: 'Cajero', ADMIN: 'Admin' };
const ROLE_COLORS: Record<string, string> = {
  USER: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  CASHIER: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
  ADMIN: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
};

export const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal nuevo usuario
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '', role: 'USER' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(t);
  }, [search, role, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users?search=${search}&role=${role}&page=${page}&limit=20`);
      setUsers(data.data);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, current: boolean) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !current });
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.phone) {
      setCreateError('Todos los campos son requeridos');
      return;
    }
    if (newUser.password.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/admin/users', newUser);
      setCreateSuccess(`${ROLE_LABELS[newUser.role]} "${newUser.name}" creado exitosamente`);
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'USER' });
      fetchUsers();
      setTimeout(() => { setCreateSuccess(''); setShowModal(false); }, 2000);
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Usuarios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{total} usuarios registrados</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setCreateError(''); setCreateSuccess(''); }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-48 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400 transition-colors"
          />
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-slate-400 transition-colors"
          >
            <option value="">Todos los roles</option>
            <option value="USER">Comensales</option>
            <option value="CASHIER">Cajeros</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              No hay usuarios. Agrega el primero con el botón "Agregar".
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rol</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">#{user.employeeNumber}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 hidden md:table-cell">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ROLE_COLORS[user.role] || ROLE_COLORS.USER}`}>
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-sm text-slate-900 dark:text-slate-50">
                          ${parseFloat(user.balance).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${user.isActive ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'}`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            </button>
                            {!isMaster(user.email) && (
                              <button
                                onClick={() => handleToggleActive(user.id, user.isActive)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                                  user.isActive
                                    ? 'border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                }`}
                                title={user.isActive ? 'Desactivar' : 'Activar'}
                              >
                                <Power className={`w-3.5 h-3.5 ${user.isActive ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-slate-500 dark:text-slate-400">Página {page} de {pages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal agregar usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Agregar usuario</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createSuccess ? (
              <div className="py-8 text-center">
                <p className="text-slate-900 dark:text-slate-50 font-semibold">{createSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                {createError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {createError}
                  </div>
                )}

                {/* Tipo de usuario */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">Tipo de usuario</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: 'USER', label: 'Comensal', desc: 'Usa el comedor' }, { value: 'CASHIER', label: 'Cajero', desc: 'Opera la caja' }].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewUser({ ...newUser, role: opt.value })}
                        className={`p-3 rounded-xl border-2 text-left transition-colors ${
                          newUser.role === opt.value
                            ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{opt.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {[
                  { key: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Juan Pérez' },
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'juan@empresa.com' },
                  { key: 'phone', label: 'Teléfono', type: 'tel', placeholder: '+52 55 1234-5678' },
                  { key: 'password', label: 'Contraseña temporal', type: 'password', placeholder: 'Mínimo 6 caracteres' }
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{label} *</label>
                    <input
                      type={type}
                      value={(newUser as any)[key]}
                      onChange={(e) => setNewUser({ ...newUser, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400 transition-colors"
                      required
                    />
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors disabled:opacity-40"
                  >
                    {creating ? 'Creando...' : `Crear ${newUser.role === 'USER' ? 'comensal' : 'cajero'}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:border-slate-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
