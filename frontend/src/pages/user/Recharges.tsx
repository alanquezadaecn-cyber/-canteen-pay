import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { Plus, TrendingUp, CreditCard, Wallet, DollarSign } from 'lucide-react';
import { usePanelBase } from '../../hooks/usePanelBase';

interface Recharge {
  id: string;
  amount: string;
  paymentMethod: 'CASH' | 'STRIPE' | 'MERCADOPAGO';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export const Recharges: React.FC = () => {
  const navigate = useNavigate();
  const base = usePanelBase();
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    const fetchRecharges = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/transactions?type=RECHARGE&page=${page}&limit=20`);
        setRecharges(data.data);
        setTotalPages(data.pagination?.pages || 1);
      } catch (err) {
        console.error('Error fetching recharges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecharges();
  }, [page]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case 'STRIPE':
        return <CreditCard className="w-6 h-6 text-slate-700 dark:text-blue-400" />;
      case 'MERCADOPAGO':
        return <DollarSign className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />;
      default:
        return <DollarSign className="w-6 h-6" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo en caja';
      case 'STRIPE':
        return 'Tarjeta (Stripe)';
      case 'MERCADOPAGO':
        return 'MercadoPago';
      default:
        return method;
    }
  };

  const getPaymentMethodBG = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'bg-amber-100 dark:bg-amber-900/30';
      case 'STRIPE':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'MERCADOPAGO':
        return 'bg-cyan-100 dark:bg-cyan-900/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800">
            Completada
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800">
            Pendiente
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs font-medium border border-red-200 dark:border-red-800">
            Fallida
          </span>
        );
      default:
        return null;
    }
  };

  const completedRecharges = recharges.filter(r => r.status === 'COMPLETED');
  const totalRecarged = completedRecharges.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const avgRecharge = completedRecharges.length > 0 ? totalRecarged / completedRecharges.length : 0;

  const stats = [
    {
      label: 'Total Recargado',
      value: `$${totalRecarged.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      label: 'Recargas Completadas',
      value: completedRecharges.length.toString(),
      icon: CreditCard,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Promedio por Recarga',
      value: `$${avgRecharge.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">
        {/* Premium Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Mis Recargas 💳
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Historial y gestión de recargas de saldo
            </p>
          </div>
          <Button
            onClick={() => navigate(`${base}/recharge/new`)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Recarga
          </Button>
        </div>

        {/* Stats Cards */}
        {recharges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Card key={idx} variant="elevated" className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
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
        {recharges.length > 0 && (
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

        {/* Recharges Grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="shimmer h-20 rounded-lg"></div>
            ))}
          </div>
        ) : recharges.length > 0 ? (
          <>
            <div className="space-y-3">
              {recharges.map((recharge, idx) => (
                <Card
                  key={recharge.id}
                  variant="interactive"
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg ${getPaymentMethodBG(recharge.paymentMethod)} flex items-center justify-center`}>
                          {getPaymentMethodIcon(recharge.paymentMethod)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50">
                            +${parseFloat(recharge.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {getPaymentMethodLabel(recharge.paymentMethod)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {new Date(recharge.createdAt).toLocaleDateString('es-MX')}
                        </p>
                        {getStatusBadge(recharge.status)}
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
                <CreditCard className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                Sin recargas aún
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Recarga tu saldo para comenzar a usar CashFood
              </p>
              <Button variant="primary" onClick={() => navigate(`${base}/recharge/new`)}>
                Realizar Primera Recarga
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
