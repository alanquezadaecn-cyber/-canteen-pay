import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { QrCode, DollarSign, TrendingUp, Clock, Zap, RefreshCw } from 'lucide-react';

interface Summary {
  totalTransactions: number;
  totalCharges: number;
  totalChargesAmount: string;
  averageCharge: string;
  totalRecharges: number;
  totalRechargesAmount: string;
  date: string;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
    employeeNumber: string;
  };
}

export const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, historyRes] = await Promise.all([
          api.get('/cashier/summary'),
          api.get('/cashier/history?limit=5')
        ]);

        setSummary(summaryRes.data);
        setTransactions(historyRes.data.data);
      } catch (err) {
        console.error('Error fetching cashier data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'RECHARGE':
        return <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Clock className="w-6 h-6 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTransactionBG = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'RECHARGE':
        return 'bg-emerald-100 dark:bg-emerald-900/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
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
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
              Panel de Caja 🏪
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {summary?.date ? new Date(summary.date).toLocaleDateString('es-MX', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              }) : 'Hoy'}
            </p>
          </div>
          <Button
            onClick={() => navigate('/cashier/scan')}
            variant="primary"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            size="lg"
          >
            <Zap className="w-5 h-5" />
            Escanear Ahora
          </Button>
        </div>

        {/* Acciones Rápidas - Premium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="interactive" className="cursor-pointer" onClick={() => navigate('/cashier/scan')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Escanear QR</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Procesar transacción</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="cursor-pointer" onClick={() => navigate('/cashier/history')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Historial</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Ver transacciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards - Premium */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="elevated" className="animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Total Cobros</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mt-2">
                      ${summary.totalChargesAmount}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 opacity-10">
                    <DollarSign className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Qty Cobros</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mt-2">
                      {summary.totalCharges}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Promedio</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mt-2">
                      ${summary.averageCharge}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 opacity-10">
                    <DollarSign className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Recargas</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">
                      ${summary.totalRechargesAmount}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 opacity-10">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Últimas Operaciones - Premium */}
        <Card variant="default">
          <CardHeader borderBottom>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>Últimas Operaciones</CardTitle>
                  <CardDescription>Transacciones recientes</CardDescription>
                </div>
              </div>
              <Button
                size="iconSm"
                variant="ghost"
                onClick={() => navigate('/cashier/history')}
                title="Ver todas"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg ${getTransactionBG(tx.type)} flex items-center justify-center`}>
                            {getTransactionIcon(tx.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-50">
                              {tx.user.name}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              Empleado #{tx.user.employeeNumber}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
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
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No hay operaciones aún</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Comienza escaneando un QR</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
