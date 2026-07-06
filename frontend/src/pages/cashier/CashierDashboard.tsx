import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Plus, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface UserStat {
  id: string;
  name: string;
  email: string;
  balance: string;
  totalTransactions: number;
  lastTransaction?: string;
}

interface Summary {
  totalTransactions: number;
  totalCharges: number;
  totalChargesAmount: string;
  averageCharge: string;
}

export const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserStat[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    employeeNumber: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, usersRes] = await Promise.all([
        api.get('/cashier/summary').catch(() => ({ data: null })),
        api.get('/admin/users?limit=1000')
      ]);

      if (summaryRes.data) {
        setSummary(summaryRes.data);
      }

      const usersList = usersRes.data.data || [];
      const statsMap = new Map<string, UserStat>();

      usersList.forEach(u => {
        if (u.role === 'USER') {
          statsMap.set(u.id, {
            id: u.id,
            name: u.name,
            email: u.email,
            balance: u.balance,
            totalTransactions: 0,
            lastTransaction: undefined
          });
        }
      });

      // Obtener transacciones
      const transRes = await api.get('/admin/transactions?limit=100');
      const transactions = transRes.data.data || [];

      transactions.forEach(tx => {
        if (statsMap.has(tx.userId)) {
          const stat = statsMap.get(tx.userId)!;
          stat.totalTransactions++;
          if (!stat.lastTransaction || new Date(tx.createdAt) > new Date(stat.lastTransaction)) {
            stat.lastTransaction = tx.createdAt;
          }
        }
      });

      setUsers(Array.from(statsMap.values()).sort((a, b) => b.totalTransactions - a.totalTransactions));
    } catch (err) {
      console.error('Error fetching cashier data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email.trim() || !newUser.password.trim()) return;

    try {
      await api.post('/admin/users', {
        name: newUser.name || newUser.email.split('@')[0],
        email: newUser.email,
        password: newUser.password,
        company: currentUser?.company || 'General',
        employeeNumber: newUser.employeeNumber || `EMP-${Date.now()}`,
        phone: newUser.phone || '+52 5555-0000',
        role: 'USER'
      });

      alert('Usuario creado exitosamente');
      setShowNewUser(false);
      setNewUser({ name: '', email: '', password: '', employeeNumber: '', phone: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-1">
              Panel de Caja
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Usuarios y transacciones
            </p>
          </div>
          <Button onClick={() => navigate('/cashier/scan')} className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Escanear QR
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Transacciones Hoy
                </h3>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {summary.totalCharges}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Monto: ${summary.totalChargesAmount}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Promedio por Transacción
                </h3>
                <DollarSign className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ${summary.averageCharge}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Total Usuarios
                </h3>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {users.length}
              </p>
            </div>
          </div>
        )}

        {/* Usuarios List */}
        <Card>
          <CardHeader borderBottom>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>Comensales disponibles para cobro</CardDescription>
              </div>
              <Button onClick={() => setShowNewUser(!showNewUser)} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {showNewUser && (
              <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4 border border-slate-200 dark:border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Juan Pérez"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="juan@example.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="••••••••"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
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

            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Email</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Saldo</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Transacciones</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Última Actividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-50">{u.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">{u.email}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ${u.balance}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-900 dark:text-slate-50">
                          {u.totalTransactions}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {u.lastTransaction
                            ? new Date(u.lastTransaction).toLocaleString('es-MX', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Nunca'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                No hay usuarios creados. Crea el primero.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
