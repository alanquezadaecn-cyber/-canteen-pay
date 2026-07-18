import React, { useEffect, useState } from 'react';
import { ClipboardList, ArrowDownLeft, ArrowUpRight, Printer, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

interface CorteTransaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  createdAt: string;
  user: { name: string; employeeNumber: string } | null;
}

interface CorteData {
  cashierName: string;
  date: string;
  totalCharges: number;
  totalChargesAmount: string;
  totalRecharges: number;
  totalRechargesAmount: string;
  transactions: CorteTransaction[];
}

const fmt = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Hora de México forzada (no depende de la zona horaria del navegador)
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City'
  });

export const CorteDeCaja: React.FC = () => {
  const [data, setData] = useState<CorteData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get('/cashier/corte');
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePrint = () => window.print();

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Mexico_City'
  });

  return (
    <>
      {/* Screen version */}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8 print:hidden">

        {/* Hero verde */}
        <div className="relative bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-400 rounded-b-[2.5rem] pt-20 md:pt-10 pb-10 px-5 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Corte de Caja</h1>
                <p className="text-emerald-100 text-xs capitalize">{today}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="p-2.5 text-white bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
                title="Actualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-full hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Cargando corte...</span>
          </div>
        ) : !data ? (
          <div className="text-center py-20">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No se pudo cargar el corte</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-5 mt-6 space-y-5">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-red-500" />
                  </span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total cobrado</p>
                </div>
                <p className="text-3xl font-bold text-red-500">{fmt(data.totalChargesAmount)}</p>
                <p className="text-xs text-slate-400 mt-1">{data.totalCharges} {data.totalCharges === 1 ? 'cobro' : 'cobros'}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total recargado</p>
                </div>
                <p className="text-3xl font-bold text-emerald-600">{fmt(data.totalRechargesAmount)}</p>
                <p className="text-xs text-slate-400 mt-1">{data.totalRecharges} {data.totalRecharges === 1 ? 'recarga' : 'recargas'}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Total transacciones</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{data.transactions.length}</p>
                <p className="text-xs text-slate-400 mt-1">en el turno de hoy</p>
              </div>
            </div>

            {/* Transaction list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Detalle de transacciones</h2>
              </div>

              {data.transactions.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Sin transacciones hoy</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Hora</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Comensal</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Monto</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">Saldo final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {data.transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                            {fmtTime(tx.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{tx.user?.name || '—'}</p>
                            <p className="text-xs text-slate-400">#{tx.user?.employeeNumber}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              tx.type === 'PURCHASE'
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                : tx.type === 'RECHARGE'
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {tx.type === 'PURCHASE' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {tx.type === 'PURCHASE' ? 'Cobro' : tx.type === 'RECHARGE' ? 'Recarga' : 'Reembolso'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold tabular-nums text-sm ${
                            tx.type === 'PURCHASE' ? 'text-red-500' : 'text-emerald-600'
                          }`}>
                            {tx.type === 'PURCHASE' ? '-' : '+'}{fmt(tx.amount)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-slate-500 tabular-nums hidden sm:table-cell">
                            {fmt(tx.balanceAfter)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                        <td colSpan={3} className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Total</td>
                        <td className="py-3 px-4 text-right">
                          <p className="text-xs text-red-500 font-bold">-{fmt(data.totalChargesAmount)}</p>
                          <p className="text-xs text-emerald-600 font-bold">+{fmt(data.totalRechargesAmount)}</p>
                        </td>
                        <td className="hidden sm:table-cell" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print version */}
      {data && (
        <div className="hidden print:block p-8 text-black font-mono text-sm">
          <div className="text-center mb-6">
            <p className="text-2xl font-bold">CashFood</p>
            <p className="text-base">Corte de Caja</p>
            <p className="text-sm text-gray-600">{today}</p>
            <p className="text-sm">Cajero: {data.cashierName}</p>
          </div>

          <div className="border-t border-b border-black py-4 mb-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total cobrado</p>
              <p className="text-xl font-bold">{fmt(data.totalChargesAmount)}</p>
              <p className="text-xs text-gray-500">{data.totalCharges} cobros</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Total recargado</p>
              <p className="text-xl font-bold">{fmt(data.totalRechargesAmount)}</p>
              <p className="text-xs text-gray-500">{data.totalRecharges} recargas</p>
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-1">Hora</th>
                <th className="text-left py-1">Usuario</th>
                <th className="text-left py-1">Tipo</th>
                <th className="text-right py-1">Monto</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map(tx => (
                <tr key={tx.id} className="border-b border-gray-200">
                  <td className="py-1">{fmtTime(tx.createdAt)}</td>
                  <td className="py-1">{tx.user?.name || '—'}</td>
                  <td className="py-1">{tx.type === 'PURCHASE' ? 'Cobro' : 'Recarga'}</td>
                  <td className="py-1 text-right">{tx.type === 'PURCHASE' ? '-' : '+'}{fmt(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-black mt-4 pt-4 text-center text-xs text-gray-500">
            <p>Total transacciones: {data.transactions.length}</p>
            <p className="mt-2">_________________________</p>
            <p>Firma del cajero</p>
          </div>
        </div>
      )}
    </>
  );
};
