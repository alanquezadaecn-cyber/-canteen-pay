import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { Users, DollarSign, TrendingUp, TrendingDown, Zap, Building2, Settings, BarChart3, Activity } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location: string;
  active: boolean;
  managerId?: string;
}

interface Stats {
  totalUsers: number;
  totalBalance: string;
  todayTransactions: number;
  todayRevenue: string;
  todayRecharges: string;
  totalTransactions: number;
}

interface BranchStats {
  branchId: string;
  branchName: string;
  users: number;
  balance: string;
  todayRevenue: string;
  todayRecharges: string;
  activeUsers: number;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
  branch?: string;
  user: {
    name: string;
  };
}

interface Cashier {
  name: string;
  branch?: string;
  totalCharges: number;
  totalChargesAmount: string;
  totalRecharges: number;
  totalRechargesAmount: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [stats, setStats] = useState<Stats | null>(null);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesRes, statsRes, branchStatsRes, transRes, cashierRes] = await Promise.all([
          api.get('/admin/branches').catch(() => ({ data: [] })),
          api.get(`/admin/stats${selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : ''}`),
          api.get('/admin/branches/stats').catch(() => ({ data: [] })),
          api.get(`/admin/transactions?limit=10${selectedBranch !== 'all' ? `&branchId=${selectedBranch}` : ''}`),
          api.get(`/admin/cashiers${selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : ''}`)
        ]);

        setBranches(branchesRes.data);
        setStats(statsRes.data);
        setBranchStats(branchStatsRes.data);
        setTransactions(transRes.data.data || []);
        setCashiers(cashierRes.data || []);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [selectedBranch]);

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
        {/* Premium Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Panel Administrativo 📊
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Vista completa del sistema y sucursales
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/settings')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            Configuración
          </Button>
        </div>

        {/* Branch Selector - Premium */}
        {branches.length > 0 && (
          <Card variant="elevated">
            <CardHeader borderBottom>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle>Sucursales</CardTitle>
                  <CardDescription>Filtra por sucursal o ve todas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedBranch === 'all' ? 'primary' : 'outline'}
                  onClick={() => setSelectedBranch('all')}
                  size="sm"
                >
                  📍 Todas las Sucursales
                </Button>
                {branches.map(branch => (
                  <Button
                    key={branch.id}
                    variant={selectedBranch === branch.id ? 'primary' : 'outline'}
                    onClick={() => setSelectedBranch(branch.id)}
                    size="sm"
                    disabled={!branch.active}
                  >
                    {branch.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards - Premium */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card variant="elevated" className="animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Usuarios Activos</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mt-2">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Saldo Total</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mt-2">
                      ${stats.totalBalance}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 opacity-10">
                    <DollarSign className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Cobros Hoy</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">
                      ${stats.todayRevenue}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 opacity-10">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Recargas Hoy</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mt-2">
                      ${stats.todayRecharges}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 opacity-10">
                    <TrendingDown className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Total Transacciones</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-red-500 bg-clip-text text-transparent mt-2">
                      {stats.totalTransactions}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 opacity-10">
                    <Zap className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Branch Performance - Si hay múltiples sucursales */}
        {selectedBranch === 'all' && branchStats.length > 1 && (
          <Card variant="default">
            <CardHeader borderBottom>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle>Desempeño por Sucursal</CardTitle>
                  <CardDescription>Comparativa de operaciones</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Sucursal</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Usuarios</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Saldo Total</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Cobros Hoy</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-50">Recargas Hoy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchStats.map((branch, idx) => (
                      <tr
                        key={branch.branchId}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-slate-50">{branch.branchName}</span>
                        </td>
                        <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">{branch.users}</td>
                        <td className="text-right py-3 px-4 font-medium text-slate-900 dark:text-slate-50">${branch.balance}</td>
                        <td className="text-right py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">${branch.todayRevenue}</td>
                        <td className="text-right py-3 px-4 font-semibold text-amber-600 dark:text-amber-400">${branch.todayRecharges}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Últimas Transacciones */}
          <div className="lg:col-span-2">
            <Card variant="default">
              <CardHeader borderBottom>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <CardTitle>Últimas Transacciones</CardTitle>
                    <CardDescription>Actividad reciente del sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx, idx) => (
                      <Card
                        key={tx.id}
                        variant="interactive"
                        className="animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-slate-50">
                                {tx.user.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {tx.description}
                                {tx.branch && ` • ${tx.branch}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${
                                tx.type === 'PURCHASE'
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {tx.type === 'PURCHASE' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {new Date(tx.createdAt).toLocaleTimeString('es-MX')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                    No hay transacciones
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cajeros Activos */}
          <div>
            <Card variant="default">
              <CardHeader borderBottom>
                <CardTitle className="text-lg">Cajeros Hoy</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {cashiers.length > 0 ? (
                  <div className="space-y-3">
                    {cashiers.map((cashier, idx) => (
                      <Card
                        key={idx}
                        variant="flat"
                        className="animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <CardContent className="pt-4">
                          <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                            {cashier.name}
                          </p>
                          {cashier.branch && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{cashier.branch}</p>
                          )}
                          <div className="mt-3 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Cobros:</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-50">
                                {cashier.totalCharges}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Monto:</span>
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                ${cashier.totalChargesAmount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">Recargas:</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ${cashier.totalRechargesAmount}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-400 text-sm">
                    No hay cajeros activos
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
