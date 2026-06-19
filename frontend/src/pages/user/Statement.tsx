import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';

interface Summary {
  totalTransactions: number;
  totalPurchases: number;
  totalRecharges: number;
  totalRefunds: number;
  purchasesAmount: string;
  rechargesAmount: string;
  refundsAmount: string;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  createdAt: string;
}

export const Statement: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchStatement = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const [summaryRes, transactionsRes] = await Promise.all([
          api.get(`/transactions/summary?${params.toString()}`),
          api.get(`/transactions?${params.toString()}&limit=100`)
        ]);

        setSummary(summaryRes.data);
        setTransactions(transactionsRes.data.data);
      } catch (err) {
        console.error('Error fetching statement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Estado de Cuenta</h1>
        <p className="text-slate-600 mb-8">
          Resumen detallado de todas tus transacciones
        </p>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="mb-2 block">
                  Fecha Inicial
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="mb-2 block">
                  Fecha Final
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summary && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">Total Transacciones</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {summary.totalTransactions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Total Compras</p>
                <p className="text-2xl font-bold text-red-600">
                  -${parseFloat(summary.purchasesAmount).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {summary.totalPurchases} compras
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Total Recargas</p>
                <p className="text-2xl font-bold text-emerald-600">
                  +${parseFloat(summary.rechargesAmount).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {summary.totalRecharges} recargas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Total Reembolsos</p>
                <p className="text-2xl font-bold text-blue-600">
                  +${parseFloat(summary.refundsAmount).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {summary.totalRefunds} reembolsos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-600">
                Cargando estado de cuenta...
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                      <th className="text-left py-3 px-4 font-semibold">Concepto</th>
                      <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold">Monto</th>
                      <th className="text-right py-3 px-4 font-semibold">Saldo Anterior</th>
                      <th className="text-right py-3 px-4 font-semibold">Saldo Nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          {new Date(tx.createdAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="py-3 px-4">{tx.description}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'PURCHASE' ? 'bg-red-100 text-red-800' :
                            tx.type === 'RECHARGE' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${
                          tx.type === 'RECHARGE' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'RECHARGE' ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          ${parseFloat(tx.balanceBefore).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ${parseFloat(tx.balanceAfter).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No hay transacciones en este período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
