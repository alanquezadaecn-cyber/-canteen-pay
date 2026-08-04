import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { ShoppingCart, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
  isCashSale?: boolean;
  cashReceived?: string | null;
  cashChange?: string | null;
  user: {
    name: string;
    employeeNumber: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface Totals { charges: string; recharges: string }

// YYYY-MM-DD en horario local (no UTC), para que el <input type="date"> y los presets coincidan
const toLocalDate = (d: Date) => {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};
const todayStr = () => toLocalDate(new Date());

export const CashierHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/cashier/history?page=${page}&limit=30&from=${fromDate}&to=${toDate}`);
        setTransactions(data.data);
        setPagination(data.pagination);
        setTotals(data.totals);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, fromDate, toDate]);

  const applyPreset = (preset: 'hoy' | 'ayer' | '7dias' | 'mes') => {
    const now = new Date();
    if (preset === 'hoy') { setFromDate(todayStr()); setToDate(todayStr()); }
    else if (preset === 'ayer') {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      setFromDate(toLocalDate(y)); setToDate(toLocalDate(y));
    } else if (preset === '7dias') {
      const from = new Date(now); from.setDate(from.getDate() - 6);
      setFromDate(toLocalDate(from)); setToDate(todayStr());
    } else if (preset === 'mes') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(toLocalDate(from)); setToDate(todayStr());
    }
    setPage(1);
  };

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

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'text-red-600 dark:text-red-400';
      case 'RECHARGE':
        return 'text-emerald-600 dark:text-emerald-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            Historial de Caja
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Todas las operaciones registradas
          </p>
        </div>

        {/* Filtro de fechas */}
        <Card variant="default">
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {([['hoy', 'Hoy'], ['ayer', 'Ayer'], ['7dias', 'Últimos 7 días'], ['mes', 'Este mes']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="h-8 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Del</label>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={e => { setFromDate(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Al</label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={todayStr()}
                  onChange={e => { setToDate(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        {pagination && totals && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Total Transacciones</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2 truncate">
                      {pagination.total}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    <ShoppingCart className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Total Cobrado</p>
                    <p className="text-3xl font-bold text-red-500 mt-2 truncate">
                      ${parseFloat(totals.charges).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Total Recargado</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2 truncate">
                      ${parseFloat(totals.recharges).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions List - Premium */}
        <Card variant="default">
          <CardHeader borderBottom>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Transacciones</CardTitle>
                <CardDescription>Historial completo de operaciones</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="shimmer h-20 rounded-lg"></div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <>
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
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 dark:text-slate-50">
                                {tx.user.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Empleado #{tx.user.employeeNumber} • {tx.description}
                              </p>
                              {tx.isCashSale && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                                  💵 Pagó ${parseFloat(tx.cashReceived || '0').toFixed(2)} · Cambio ${parseFloat(tx.cashChange || '0').toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getTransactionColor(tx.type)}`}>
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

                {/* Premium Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="flex-shrink-0"
                      >
                        ← Anterior
                      </Button>

                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                          <Button
                            key={p}
                            variant={page === p ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setPage(p)}
                            className="w-10 h-10 p-0"
                          >
                            {p}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                        disabled={page === pagination.pages}
                        className="flex-shrink-0"
                      >
                        Siguiente →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No hay operaciones aún</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Las transacciones aparecerán aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
