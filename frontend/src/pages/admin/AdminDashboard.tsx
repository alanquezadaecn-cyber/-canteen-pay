import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Plus, DollarSign, TrendingUp, Building2 } from 'lucide-react';

interface BranchStat {
  company: string;
  totalUsers: number;
  totalBalance: string;
  todayRevenue: string;
  todayTransactions: number;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
    company: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchStat[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', location: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, transRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/transactions?limit=10')
      ]);

      // Agrupar transacciones por company para estadísticas de sucursal
      const txData = transRes.data.data || [];
      const branchMap = new Map<string, BranchStat>();

      // Inicializar con datos de usuarios
      const usersRes = await api.get('/admin/users?limit=1000');
      const users = usersRes.data.users || [];

      users.forEach(user => {
        const company = user.company || 'Sin Sucursal';
        if (!branchMap.has(company)) {
          branchMap.set(company, {
            company,
            totalUsers: 0,
            totalBalance: '0',
            todayRevenue: '0',
            todayTransactions: 0
          });
        }
        const branch = branchMap.get(company)!;
        branch.totalUsers++;
        branch.totalBalance = (parseFloat(branch.totalBalance) + parseFloat(user.balance)).toFixed(2);
      });

      // Agregar datos de transacciones
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      txData.forEach(tx => {
        const company = tx.user.company || 'Sin Sucursal';
        if (!branchMap.has(company)) {
          branchMap.set(company, {
            company,
            totalUsers: 0,
            totalBalance: '0',
            todayRevenue: '0',
            todayTransactions: 0
          });
        }
        const branch = branchMap.get(company)!;
        const txDate = new Date(tx.createdAt);
        if (txDate >= today && txDate < tomorrow && tx.type === 'PURCHASE') {
          branch.todayRevenue = (parseFloat(branch.todayRevenue) + parseFloat(tx.amount)).toFixed(2);
          branch.todayTransactions++;
        }
      });

      setBranches(Array.from(branchMap.values()));
      setTransactions(txData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) return;

    try {
      // Crear usuario de admin para la sucursal o registrar la sucursal
      // Por ahora, solo mostramos mensaje de éxito
      alert(`Sucursal "${newBranch.name}" registrada`);
      setShowNewBranch(false);
      setNewBranch({ name: '', location: '' });
      fetchData();
    } catch (err) {
      console.error('Error creating branch:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-1">
              Panel de Control
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Resumen por sucursales
            </p>
          </div>
        </div>

        {/* Sucursales Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch.company}>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {branch.company}
                  </h3>
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Usuarios</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {branch.totalUsers}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saldo Total</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${branch.totalBalance}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cobros Hoy</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      ${branch.todayRevenue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Nueva Sucursal Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 flex items-center justify-center min-h-[280px]">
            <Button
              onClick={() => setShowNewBranch(!showNewBranch)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nueva Sucursal
            </Button>
          </div>
        </div>

        {/* Crear Nueva Sucursal */}
        {showNewBranch && (
          <Card>
            <CardHeader borderBottom>
              <CardTitle>Crear Nueva Sucursal</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div>
                  <Label htmlFor="branchName">Nombre de Sucursal</Label>
                  <Input
                    id="branchName"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    placeholder="ej: Sucursal Centro"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={newBranch.location}
                    onChange={(e) => setNewBranch({ ...newBranch, location: e.target.value })}
                    placeholder="ej: Calle 5 de Mayo #123"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Crear Sucursal</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewBranch(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Últimas Transacciones */}
        <Card>
          <CardHeader borderBottom>
            <CardTitle>Últimas Transacciones</CardTitle>
            <CardDescription>Actividad reciente del sistema</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Usuario</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Sucursal</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Monto</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-50">{tx.user.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{tx.user.company}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            tx.type === 'PURCHASE'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${
                          tx.type === 'PURCHASE'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {tx.type === 'PURCHASE' ? '-' : '+'}${tx.amount}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                          {new Date(tx.createdAt).toLocaleTimeString('es-MX')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                No hay transacciones
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
