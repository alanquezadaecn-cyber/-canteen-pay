import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TransactionItem } from '../../components/TransactionItem';
import api from '../../lib/api';
import { ShoppingBag, TrendingDown, DollarSign, Calendar } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
}

export const Purchases: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/transactions?type=PURCHASE&page=${page}&limit=20`);
        setTransactions(data.data);
        setTotalPages(data.pagination?.pages || 1);
      } catch (err) {
        console.error('Error fetching purchases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [page]);

  const stats = [
    {
      label: 'Total Gastado',
      value: `$${transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-red-500 to-orange-500'
    },
    {
      label: 'Compras',
      value: transactions.length.toString(),
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Promedio',
      value: transactions.length > 0
        ? `$${(transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / transactions.length).toFixed(2)}`
        : '$0.00',
      icon: TrendingDown,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">
        {/* Premium Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Mis Compras 🛍️
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Historial detallado de todas tus compras en el comedor
          </p>
        </div>

        {/* Stats Cards */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Card key={idx} variant="elevated">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">{stat.label}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-2`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} opacity-10`}>
                        <Icon className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Filters */}
        {transactions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(['all', 'week', 'month'] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'all' && 'Todas'}
                {f === 'week' && 'Esta Semana'}
                {f === 'month' && 'Este Mes'}
              </Button>
            ))}
          </div>
        )}

        {/* Transactions Grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="shimmer h-20 rounded-lg"></div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="space-y-3">
              {transactions.map((transaction, idx) => (
                <Card
                  key={transaction.id}
                  variant="interactive"
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50">
                            {transaction.description || 'Compra'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {new Date(transaction.createdAt).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          -${parseFloat(transaction.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {new Date(transaction.createdAt).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Premium */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  ← Anterior
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card variant="default">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                Sin compras aún
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Cuando realices compras en el comedor aparecerán aquí
              </p>
              <Button variant="primary" onClick={() => window.history.back()}>
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
