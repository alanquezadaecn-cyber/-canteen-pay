import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { BarChart2, ArrowDownLeft, ArrowUpRight, Users, TrendingUp, Download, Trophy } from 'lucide-react';
import api from '../../lib/api';

interface Report {
  period: string;
  purchasesCount: number;
  purchasesTotal: string;
  rechargesCount: number;
  rechargesTotal: string;
  activeUsers: number;
  topUsers: Array<{ userId: string; name: string; amount: string }>;
  dailyBreakdown: Record<string, { purchases: string; recharges: string; neto: string }>;
}

const PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week',  label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'all',   label: 'Todo el tiempo' },
];

const fmt = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<Report | null>(null);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/reports?period=${period}`)
      .then(({ data }) => setReport(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const exportExcel = () => {
    if (!report) return;

    // Hoja resumen
    const summary = [
      { Métrica: 'Período', Valor: PERIODS.find(p => p.value === period)?.label },
      { Métrica: 'Compras (cantidad)', Valor: report.purchasesCount },
      { Métrica: 'Compras (total)', Valor: parseFloat(report.purchasesTotal) },
      { Métrica: 'Recargas (cantidad)', Valor: report.rechargesCount },
      { Métrica: 'Recargas (total)', Valor: parseFloat(report.rechargesTotal) },
      { Métrica: 'Neto', Valor: parseFloat(report.rechargesTotal) - parseFloat(report.purchasesTotal) },
      { Métrica: 'Usuarios activos', Valor: report.activeUsers },
    ];

    // Hoja desglose diario
    const daily = Object.entries(report.dailyBreakdown)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, d]) => ({
        Fecha: new Date(date).toLocaleDateString('es-MX'),
        Compras: parseFloat(d.purchases),
        Recargas: parseFloat(d.recharges),
        Neto: parseFloat(d.neto),
      }));

    // Hoja top usuarios
    const top = report.topUsers.map((u, i) => ({
      '#': i + 1,
      Usuario: u.name,
      'Total gastado': parseFloat(u.amount),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Resumen');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daily), 'Desglose Diario');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(top), 'Top Usuarios');
    XLSX.writeFile(wb, `mealpay-reporte-${period}-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const selectCls = 'bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer';

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-slate-950 md:ml-64 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Cargando reportes...</span>
        </div>
      </div>
    );
  }

  const neto = report ? parseFloat(report.rechargesTotal) - parseFloat(report.purchasesTotal) : 0;
  const maxAmount = report ? Math.max(...report.topUsers.map(u => parseFloat(u.amount)), 1) : 1;

  return (
    <div className="min-h-screen bg-slate-950 md:ml-64 pt-16 md:pt-0">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Reportes</h1>
              <p className="text-xs text-slate-400">Análisis y estadísticas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={period} onChange={e => setPeriod(e.target.value)} className={selectCls}>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button
              onClick={exportExcel}
              disabled={!report}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>

      {report && (
        <div className="p-6 space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded bg-red-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-3 h-3 text-red-400" />
                </span>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Compras</p>
              </div>
              <p className="text-2xl font-bold text-red-400">{fmt(report.purchasesTotal)}</p>
              <p className="text-xs text-slate-500 mt-1">{report.purchasesCount} transacciones</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                </span>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recargas</p>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{fmt(report.rechargesTotal)}</p>
              <p className="text-xs text-slate-500 mt-1">{report.rechargesCount} transacciones</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                </span>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Neto</p>
              </div>
              <p className={`text-2xl font-bold ${neto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt(neto)}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center">
                  <Users className="w-3 h-3 text-emerald-400" />
                </span>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Usuarios activos</p>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{report.activeUsers}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Usuarios */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Top 5 por Gasto</h2>
              </div>
              <div className="p-5 space-y-4">
                {report.topUsers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Sin datos</p>
                ) : report.topUsers.map((user, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm text-slate-200">
                        <span className="text-slate-500 mr-2">#{idx + 1}</span>
                        {user.name}
                      </p>
                      <p className="text-sm font-semibold text-red-400">{fmt(user.amount)}</p>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(parseFloat(user.amount) / maxAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose Diario */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Desglose Diario</h2>
              </div>
              {Object.keys(report.dailyBreakdown).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Sin datos para este período</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left py-2 px-4 text-xs text-slate-500 font-semibold uppercase">Fecha</th>
                        <th className="text-right py-2 px-4 text-xs text-slate-500 font-semibold uppercase">Compras</th>
                        <th className="text-right py-2 px-4 text-xs text-slate-500 font-semibold uppercase">Recargas</th>
                        <th className="text-right py-2 px-4 text-xs text-slate-500 font-semibold uppercase">Neto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {Object.entries(report.dailyBreakdown)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .map(([date, d], idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-4 text-slate-300 text-xs">
                              {new Date(date).toLocaleDateString('es-MX')}
                            </td>
                            <td className="py-2.5 px-4 text-right text-red-400 text-xs font-medium tabular-nums">
                              -{fmt(d.purchases)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-400 text-xs font-medium tabular-nums">
                              +{fmt(d.recharges)}
                            </td>
                            <td className={`py-2.5 px-4 text-right text-xs font-semibold tabular-nums ${
                              parseFloat(d.neto) >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {fmt(d.neto)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
