import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { ArrowLeft, Plus, Trash2, Users, Zap, Upload } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location?: string;
  cashiers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    balance: string;
    isActive: boolean;
  }>;
}

export const BranchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewCashier, setShowNewCashier] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newCashier, setNewCashier] = useState({ name: '', email: '', password: '', phone: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    fetchBranch();
  }, [id]);

  const fetchBranch = async () => {
    try {
      if (!id) return;
      const res = await api.get(`/branches/${id}`);
      setBranch(res.data);
    } catch (err) {
      console.error('Error fetching branch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newCashier.email.trim() || !newCashier.password.trim()) return;

    try {
      await api.post(`/branches/${id}/cashiers`, {
        name: newCashier.name || newCashier.email.split('@')[0],
        email: newCashier.email,
        password: newCashier.password,
        phone: newCashier.phone || null
      });

      setShowNewCashier(false);
      setNewCashier({ name: '', email: '', password: '', phone: '' });
      fetchBranch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear cajero');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newUser.email.trim() || !newUser.password.trim()) return;

    try {
      await api.post(`/branches/${id}/users`, {
        name: newUser.name || newUser.email.split('@')[0],
        email: newUser.email,
        password: newUser.password,
        employeeNumber: `EMP-${Date.now()}`,
        phone: newUser.phone || '+52 5555-0000'
      });

      setShowNewUser(false);
      setNewUser({ name: '', email: '', password: '', phone: '' });
      fetchBranch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleDeleteCashier = async (cashierId: string) => {
    if (!confirm('¿Eliminar este cajero?')) return;
    try {
      await api.delete(`/admin/users/${cashierId}`);
      fetchBranch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar cajero');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchBranch();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando sucursal...</p>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Sucursal no encontrada</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">
                {branch.name}
              </h1>
              {branch.location && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  📍 {branch.location}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/admin/branches/${id}/products`)} size="sm">
              📦 Menú
            </Button>
            <Button onClick={() => navigate(`/admin/branches/${id}/reports`)} size="sm" variant="outline">
              📊 Reportes
            </Button>
          </div>
        </div>

        {/* Cajas Section */}
        <Card>
          <CardHeader borderBottom>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <CardTitle>Cajas ({branch.cashiers.length})</CardTitle>
                </div>
              </div>
              <Button onClick={() => setShowNewCashier(!showNewCashier)} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Cajero
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {showNewCashier && (
              <form onSubmit={handleCreateCashier} className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cashierName">Nombre</Label>
                    <Input
                      id="cashierName"
                      value={newCashier.name}
                      onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                      placeholder="Nombre del cajero"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cashierEmail">Email *</Label>
                    <Input
                      id="cashierEmail"
                      type="email"
                      value={newCashier.email}
                      onChange={(e) => setNewCashier({ ...newCashier, email: e.target.value })}
                      placeholder="cajero@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cashierPassword">Contraseña *</Label>
                    <Input
                      id="cashierPassword"
                      type="password"
                      value={newCashier.password}
                      onChange={(e) => setNewCashier({ ...newCashier, password: e.target.value })}
                      placeholder="••••••••"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cashierPhone">Teléfono</Label>
                    <Input
                      id="cashierPhone"
                      value={newCashier.phone}
                      onChange={(e) => setNewCashier({ ...newCashier, phone: e.target.value })}
                      placeholder="+52 5555-0000"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Crear Cajero</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewCashier(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {branch.cashiers.length > 0 ? (
              <div className="space-y-2">
                {branch.cashiers.map((cashier) => (
                  <div key={cashier.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{cashier.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{cashier.email}</p>
                      {cashier.phone && <p className="text-xs text-slate-500 dark:text-slate-500">{cashier.phone}</p>}
                    </div>
                    <Button
                      onClick={() => handleDeleteCashier(cashier.id)}
                      variant="outline"
                      size="sm"
                      className="px-3 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                No hay cajeros. Crea el primero.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usuarios Section */}
        <Card>
          <CardHeader borderBottom>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <div>
                  <CardTitle>Comensales ({branch.users.length})</CardTitle>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate(`/admin/branches/${id}/import`)} size="sm" variant="outline" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Importar Excel
                </Button>
                <Button onClick={() => setShowNewUser(!showNewUser)} size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {showNewUser && (
              <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName">Nombre</Label>
                    <Input
                      id="userName"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Nombre del comensal"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail">Email *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="usuario@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPassword">Contraseña *</Label>
                    <Input
                      id="userPassword"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="••••••••"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="userPhone">Teléfono</Label>
                    <Input
                      id="userPhone"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="+52 5555-0000"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Crear Usuario</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewUser(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {branch.users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Email</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Saldo</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branch.users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-50">{user.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">{user.email}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ${user.balance}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="outline"
                            size="sm"
                            className="px-3 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                No hay usuarios. Crea el primero.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
