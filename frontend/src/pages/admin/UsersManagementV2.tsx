import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import { Search, Filter, Download, UserX, UserCheck, DollarSign, Users, Upload, ArrowUpDown } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  employeeNumber: string;
  company: string;
  branch?: string;
  balance: string;
  isActive: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const UsersManagementV2: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'date'>('name');
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, search, branch, status, sortBy]);

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/admin/branches');
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        sortBy
      });

      if (branch) params.append('branchId', branch);
      if (status !== 'all') params.append('status', status);

      const { data } = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive });
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['ID', 'Nombre', 'Email', 'Empleado#', 'Empresa', 'Saldo', 'Estado', 'Fecha'].join(','),
      ...users.map(u =>
        [
          u.id,
          `"${u.name}"`,
          u.email,
          u.employeeNumber,
          u.company,
          u.balance,
          u.isActive ? 'Activo' : 'Inactivo',
          new Date(u.createdAt).toLocaleDateString('es-MX')
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const stats = {
    total: pagination?.total || 0,
    active: users.filter(u => u.isActive).length,
    totalBalance: users.reduce((sum, u) => sum + parseFloat(u.balance || '0'), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Gestión de Usuarios 👥
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Administra todos los usuarios del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportCSV}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              variant="primary"
              className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-500"
            >
              <Upload className="w-4 h-4" />
              Importar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Total Usuarios</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    {stats.total}
                  </p>
                </div>
                <Users className="w-6 h-6 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    {stats.active}
                  </p>
                </div>
                <UserCheck className="w-6 h-6 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Saldo Total</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    ${stats.totalBalance.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Promedio Saldo</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                    ${stats.total > 0 ? (stats.totalBalance / stats.total).toFixed(2) : '0.00'}
                  </p>
                </div>
                <ArrowUpDown className="w-6 h-6 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Nombre, email, empleado#..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                  Sucursal
                </label>
                <select
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm"
                >
                  <option value="">Todas</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2 block">
                  Ordenar
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm"
                >
                  <option value="name">Nombre</option>
                  <option value="balance">Saldo (Mayor)</option>
                  <option value="date">Fecha (Reciente)</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearch('');
                    setBranch('');
                    setStatus('all');
                    setSortBy('name');
                    setPage(1);
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card variant="default">
          <CardHeader borderBottom>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                  Mostrando {users.length} de {pagination?.total || 0} usuarios
                </CardDescription>
              </div>
              {pagination && (
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Página {pagination.page} de {pagination.pages}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Nombre</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Empleado#</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Sucursal</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Saldo</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Estado</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900 dark:text-slate-50">{user.name}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">#{user.employeeNumber}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{user.branch || '-'}</td>
                          <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-slate-50">
                            ${parseFloat(user.balance).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              size="sm"
                              variant={user.isActive ? 'outline' : 'primary'}
                              onClick={() => handleToggleStatus(user.id, user.isActive)}
                              className="text-xs"
                            >
                              {user.isActive ? 'Desactivar' : 'Activar'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      ← Anterior
                    </Button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                      <Button
                        key={p}
                        variant={page === p ? 'primary' : 'outline'}
                        onClick={() => setPage(p)}
                        size="sm"
                        className="w-10"
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                      disabled={page === pagination.pages}
                    >
                      Siguiente →
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No hay usuarios con esos criterios</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
