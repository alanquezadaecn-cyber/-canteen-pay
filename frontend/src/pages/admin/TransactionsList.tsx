import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
    employeeNumber: string;
  };
  paymentMethod?: string;
  cashierId?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const TransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', page.toString());
        params.append('limit', '30');

        const { data } = await api.get(`/admin/transactions?${params}`);
        setTransactions(data.data);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [type, startDate, endDate, page]);

  const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const purchasesAmount = transactions
    .filter(tx => tx.type === 'PURCHASE')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const rechargesAmount = transactions
    .filter(tx => tx.type === 'RECHARGE')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Transacciones Globales</h1>
        <p className="text-slate-600 mb-8">Todas las transacciones del sistema</p>

        {/* Filtros */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Todos los tipos</option>
                <option value="PURCHASE">Compra</option>
                <option value="RECHARGE">Recarga</option>
                <option value="REFUND">Reembolso</option>
              </select>

              <Input
                type="date"
                placeholder="Desde"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />

              <Input
                type="date"
                placeholder="Hasta"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-600">Total</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ${totalAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">Compras</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                -${purchasesAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <p className="text-sm text-emerald-600">Recargas</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                +${rechargesAmount.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="pt-0">
            {loading ? (
              <div className="text-center py-8 text-slate-600">Cargando transacciones...</div>
            ) : transactions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                        <th className="text-left py-3 px-4 font-semibold">Usuario</th>
                        <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                        <th className="text-right py-3 px-4 font-semibold">Monto</th>
                        <th className="text-right py-3 px-4 font-semibold">Saldo Antes</th>
                        <th className="text-right py-3 px-4 font-semibold">Saldo Después</th>
                        <th className="text-left py-3 px-4 font-semibold">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="py-3 px-4 text-xs">
                            {new Date(tx.createdAt).toLocaleString('es-MX')}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {tx.user.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.type === 'PURCHASE' ? 'bg-red-100 text-red-800' :
                              tx.type === 'RECHARGE' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${
                            tx.type === 'PURCHASE' ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {tx.type === 'PURCHASE' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            ${parseFloat(tx.balanceBefore).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            ${parseFloat(tx.balanceAfter).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                            {tx.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-slate-200">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-600">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                      disabled={page === pagination.pages}
                      className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No hay transacciones que coincidan con los filtros
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
