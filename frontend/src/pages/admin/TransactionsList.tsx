import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Filter, ChevronLeft, ChevronRight, TrendingUp, Printer, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../lib/api';
import { printTicket } from '../../lib/printTicket';

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

const TYPE_CONFIG = {
  PURCHASE: {
    label: 'Compra',
    icon: ArrowDownLeft,
    badge: 'bg-red-500/10 text-red-400 border border-red-500/20',
    amount: 'text-red-400',
    sign: '-',
  },
  RECHARGE: {
    label: 'Recarga',
    icon: ArrowUpRight,
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    amount: 'text-emerald-400',
    sign: '+',
  },
  REFUND: {
    label: 'Reembolso',
    icon: RefreshCw,
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    amount: 'text-emerald-400',
    sign: '+',
  },
};

const fmt = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  const totalAmount = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);
  const purchasesAmount = transactions.filter(t => t.type === 'PURCHASE').reduce((s, t) => s + parseFloat(t.amount), 0);
  const purchasesCount = transactions.filter(t => t.type === 'PURCHASE').length;
  const rechargesAmount = transactions.filter(t => t.type === 'RECHARGE').reduce((s, t) => s + parseFloat(t.amount), 0);
  const rechargesCount = transactions.filter(t => t.type === 'RECHARGE').length;

  const exportExcel = async () => {
    // Exporta todas las transacciones filtradas (sin paginación)
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', '1');
      params.append('limit', '10000');
      const { data } = await api.get(`/admin/transactions?${params}`);
      const rows = (data.data as Transaction[]).map(tx => ({
        Fecha: new Date(tx.createdAt).toLocaleString('es-MX'),
        Usuario: tx.user?.name || '',
        '# Empleado': tx.user?.employeeNumber || '',
        Tipo: tx.type === 'PURCHASE' ? 'Compra' : tx.type === 'RECHARGE' ? 'Recarga' : 'Reembolso',
        Monto: parseFloat(tx.amount),
        'Saldo Antes': parseFloat(tx.balanceBefore),
        'Saldo Después': parseFloat(tx.balanceAfter),
        Descripción: tx.description || '',
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
      XLSX.writeFile(wb, `mealpay-transacciones-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) {
      console.error('Error exportando:', err);
    }
  };

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-500 [color-scheme:dark]';

  return (
    <div className="min-h-screen bg-slate-950 md:ml-64 pt-16 md:pt-0">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Transacciones</h1>
        </div>
        <div className="flex items-center gap-3 ml-11">
          <p className="text-sm text-slate-400 flex-1">
            {pagination ? `${pagination.total.toLocaleString('es-MX')} registros en total` : 'Historial global del sistema'}
          </p>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Neto */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Neto (página)</p>
            <p className="text-2xl font-bold text-white">{fmt(totalAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">{transactions.length} transacciones</p>
          </div>

          {/* Compras */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-red-400" />
              </span>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Compras</p>
            </div>
            <p className="text-2xl font-bold text-red-400">-{fmt(purchasesAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">{purchasesCount} transacciones</p>
          </div>

          {/* Recargas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              </span>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recargas</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">+{fmt(rechargesAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">{rechargesCount} transacciones</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={type}
              onChange={e => { setType(e.target.value); setPage(1); }}
              className={inputCls}
            >
              <option value="">Todos los tipos</option>
              <option value="PURCHASE">Compra</option>
              <option value="RECHARGE">Recarga</option>
              <option value="REFUND">Reembolso</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className={inputCls}
            />
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className={inputCls}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-5 h-5 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
              <span className="text-sm text-slate-400">Cargando transacciones...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <TrendingUp className="w-10 h-10 text-slate-700" />
              <p className="text-slate-400 font-medium">Sin resultados</p>
              <p className="text-sm text-slate-600">Ajusta los filtros para ver transacciones</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Antes</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Después</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Descripción</th>
                      <th className="py-3 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.map(tx => {
                      const cfg = TYPE_CONFIG[tx.type];
                      const Icon = cfg.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleString('es-MX', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-slate-200 truncate max-w-[140px]">{tx.user?.name || '—'}</p>
                            <p className="text-xs text-slate-500">#{tx.user?.employeeNumber}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold tabular-nums ${cfg.amount}`}>
                            {cfg.sign}{fmt(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-slate-500 tabular-nums hidden lg:table-cell">
                            {fmt(tx.balanceBefore)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-slate-400 tabular-nums hidden lg:table-cell">
                            {fmt(tx.balanceAfter)}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate hidden xl:table-cell">
                            {tx.description || '—'}
                          </td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => printTicket({
                                type: tx.type,
                                userName: tx.user?.name || '—',
                                employeeNumber: tx.user?.employeeNumber || '',
                                amount: tx.amount,
                                balanceBefore: tx.balanceBefore,
                                balanceAfter: tx.balanceAfter,
                                date: tx.createdAt,
                                transactionId: tx.id,
                                description: tx.description,
                              })}
                              title="Imprimir ticket"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <span className="text-xs text-slate-500">
                    Página {pagination.page} de {pagination.pages}
                    <span className="ml-2 text-slate-600">({pagination.total.toLocaleString('es-MX')} total)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg">
                      {pagination.page}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
