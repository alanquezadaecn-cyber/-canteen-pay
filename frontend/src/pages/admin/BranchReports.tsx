import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { ArrowLeft, TrendingUp, Users, DollarSign, Target } from 'lucide-react';

interface Stats {
  period: { start: string; end: string };
  totalRevenue: string;
  totalRecharges: string;
  totalTransactions: number;
  activeUsers: number;
  totalUsers: number;
  averageTransactionValue: string;
  sessions: {
    total: number;
    totalCharges: string;
  };
  topUsers: Array<{
    id: string;
    name: string;
    totalSpent: number;
  }>;
}

export const BranchReports: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // days

  useEffect(() => {
    fetchStats();
  }, [branchId, period]);

  const fetchStats = async () => {
    try {
      if (!branchId) return;
      const start = new Date();
      start.setDate(start.getDate() - parseInt(period));

      const res = await api.get(`/reports/branch/${branchId}/stats`, {
        params: {
          startDate: start.toISOString(),
          endDate: new Date().toISOString()
        }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando reportes...</div>;
  }

  if (!stats) {
    return <div className="p-8 text-center">Sin datos</div>;
  }

  return (
    <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(-1)} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Reportes</h1>
          </div>

          <div className="flex gap-2">
            {['7', '30', '90', '365'].map((days) => (
              <Button
                key={days}
                variant={period === days ? 'primary' : 'outline'}
                onClick={() => setPeriod(days)}
                size="sm"
              >
                {days === '7' ? '1 sem' : days === '30' ? '1 mes' : days === '90' ? '3 meses' : '1 año'}
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Ingresos</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    ${stats.totalRevenue}
                  </p>
                </div>
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Usuarios Activos</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    {stats.activeUsers}/{stats.totalUsers}
                  </p>
                </div>
                <Users className="w-5 h-5 text-slate-700 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Transacciones</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    {stats.totalTransactions}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-700 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Promedio/Tx</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    ${stats.averageTransactionValue}
                  </p>
                </div>
                <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sesiones de Caja */}
        <Card>
          <CardHeader borderBottom>
            <CardTitle>Sesiones de Caja</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total de Sesiones</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {stats.sessions.total}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Cobrado</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  ${stats.sessions.totalCharges}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Usuarios */}
        <Card>
          <CardHeader borderBottom>
            <CardTitle>Top 10 Usuarios por Gasto</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {stats.topUsers.map((user, idx) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 w-6">#{idx + 1}</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">{user.name}</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${user.totalSpent.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
