import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Eye, Power, Plus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  employeeNumber: string;
  role: string;
  balance: string;
  isActive: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/users?search=${search}&role=${role}&page=${page}&limit=20`);
        setUsers(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, role, page]);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}`, {
        isActive: !currentActive
      });

      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Usuarios</h1>
            <p className="text-slate-600">Gestión de usuarios del sistema</p>
          </div>
          <Button
            onClick={() => navigate('/admin/users/new')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-5 h-5" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">Todos los roles</option>
                <option value="USER">Usuario</option>
                <option value="CASHIER">Cajero</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-center py-8 text-slate-600">Cargando usuarios...</div>
            ) : users.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Empresa</th>
                        <th className="text-left py-3 px-4 font-semibold">Rol</th>
                        <th className="text-right py-3 px-4 font-semibold">Saldo</th>
                        <th className="text-center py-3 px-4 font-semibold">Estado</th>
                        <th className="text-center py-3 px-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {user.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{user.email}</td>
                          <td className="py-3 px-4 text-slate-600">{user.company}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'USER' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'CASHIER' ? 'bg-amber-100 text-amber-800' :
                              'bg-violet-100 text-violet-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900">
                            ${parseFloat(user.balance).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900"
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(user.id, user.isActive)}
                                className={`p-2 rounded-lg ${
                                  user.isActive
                                    ? 'hover:bg-red-100 text-red-600 hover:text-red-900'
                                    : 'hover:bg-emerald-100 text-emerald-600 hover:text-emerald-900'
                                }`}
                                title={user.isActive ? 'Desactivar' : 'Activar'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-slate-200">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-600">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                      disabled={page === pagination.pages}
                      className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No hay usuarios que coincidan con los filtros
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
