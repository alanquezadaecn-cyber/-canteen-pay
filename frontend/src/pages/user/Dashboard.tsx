import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BalanceCard } from '../../components/BalanceCard';
import { TransactionItem } from '../../components/TransactionItem';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { CreditCard, QrCode, FileText, Download, Printer, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import QRCodeComponent from 'qrcode.react';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/transactions?limit=5');
        setTransactions(data.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `QR_${user?.id || 'canteen'}.png`;
      link.click();
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '', 'height=600,width=600');
    if (printWindow && qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${user?.name}</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; }
                .container { text-align: center; }
                h1 { color: #059669; margin: 20px 0; }
                p { color: #64748b; margin: 10px 0; }
                img { border: 2px solid #059669; padding: 10px; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>MealPay - Mi QR</h1>
                <p>${user?.name}</p>
                <p>${user?.company}</p>
                ${canvas.outerHTML}
                <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">ID: ${user?.qrCode}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 100);
      }
    }
  };

  const stats = [
    {
      label: 'Compras Este Mes',
      value: transactions.filter(t => t.type === 'PURCHASE').length,
      icon: TrendingDown,
      color: 'text-red-500'
    },
    {
      label: 'Recargas',
      value: transactions.filter(t => t.type === 'RECHARGE').length,
      icon: TrendingUp,
      color: 'text-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-10 blur-3xl"></div>
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              ¡Hola, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-base">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Balance Card with Premium Design */}
        <div className="animate-fade-in">
          <BalanceCard
            balance={user?.balance || '0'}
            name={user?.name || ''}
            className="shadow-xl"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} variant="elevated" className="animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions - Premium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* QR Card */}
          <Card variant="interactive" className="cursor-pointer" onClick={() => setShowQRModal(true)}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Mi Código QR</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Descargar o Imprimir</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 mt-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Recharge Card */}
          <Card
            variant="interactive"
            className="cursor-pointer"
            onClick={() => navigate('/recharge/new')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Recargar Saldo</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">+Créditos al instante</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 mt-auto" />
              </div>
            </CardContent>
          </Card>

          {/* Statement Card */}
          <Card
            variant="interactive"
            className="cursor-pointer"
            onClick={() => navigate('/statement')}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Estado de Cuenta</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Historial completo</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 mt-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions - Premium */}
        <Card variant="default" className="animate-fade-in">
          <CardHeader borderBottom>
            <CardTitle>Últimas Transacciones</CardTitle>
            <CardDescription>Tus movimientos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="shimmer h-12 rounded-lg"></div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction, idx) => (
                  <div key={transaction.id} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <TransactionItem transaction={transaction} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Sin transacciones</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Comienza a usar tu monedero</p>
              </div>
            )}
            {transactions.length > 0 && (
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => navigate('/purchases')}
              >
                Ver todas las transacciones →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 md:ml-0">
          <Card variant="elevated" className="w-full max-w-sm animate-scale-in">
            <CardHeader borderBottom>
              <CardTitle>Mi Código QR</CardTitle>
              <CardDescription>Usa este QR en el comedor</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div
                ref={qrRef}
                className="flex justify-center p-6 bg-white dark:bg-slate-800 rounded-lg mb-6"
              >
                <QRCodeComponent
                  value={user?.qrCode || ''}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-6 text-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">ID: {user?.qrCode}</p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={downloadQR}
                >
                  <Download className="w-4 h-4" />
                  Descargar QR
                </Button>
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={printQR}
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowQRModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
