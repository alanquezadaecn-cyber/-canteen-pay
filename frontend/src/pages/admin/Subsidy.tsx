import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../lib/api';
import { Coins, Save, Download, FileText, CheckCircle } from 'lucide-react';

interface ReportRow { name: string; employeeNumber: string; branchName: string; count: number; amount: string; }

export const Subsidy: React.FC = () => {
  // Config
  const [enabled, setEnabled] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(1);
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgMsg, setCfgMsg] = useState('');

  // Reporte
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<{ total: string; count: number; byUser: ReportRow[] } | null>(null);
  const [loadingRep, setLoadingRep] = useState(false);

  useEffect(() => {
    api.get('/admin/subsidy-config').then(({ data }) => { setEnabled(data.enabled); setMealsPerDay(data.mealsPerDay); }).catch(() => {});
    loadReport();
  }, []);

  const saveCfg = async () => {
    setSavingCfg(true); setCfgMsg('');
    try {
      await api.put('/admin/subsidy-config', { enabled, mealsPerDay });
      setCfgMsg('Configuración guardada');
      setTimeout(() => setCfgMsg(''), 3000);
    } catch { setCfgMsg('Error al guardar'); }
    finally { setSavingCfg(false); }
  };

  const loadReport = async () => {
    setLoadingRep(true);
    try {
      const { data } = await api.get(`/admin/subsidy-report?from=${from}&to=${to}&branchId=${branchId}`);
      setReport(data);
      setBranches(data.branches || []);
    } catch {} finally { setLoadingRep(false); }
  };

  useEffect(() => { loadReport(); /* eslint-disable-next-line */ }, [from, to, branchId]);

  const exportExcel = () => {
    if (!report) return;
    const rows = report.byUser.map(r => ({
      Comensal: r.name, '# Empleado': r.employeeNumber, Sucursal: r.branchName,
      'Comidas subsidiadas': r.count, 'Monto (MXN)': r.amount
    }));
    rows.push({ Comensal: 'TOTAL', '# Empleado': '', Sucursal: '', 'Comidas subsidiadas': report.count as any, 'Monto (MXN)': report.total });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 26 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Subsidio');
    XLSX.writeFile(wb, `subsidio_${from}_a_${to}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-8 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Coins className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Subsidio de comida</h1>
            <p className="text-sm text-slate-500">Cubre comidas a tus empleados y saca el reporte para pagar al proveedor</p>
          </div>
        </div>

        {/* Configuración */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Configuración</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Subsidio activo</p>
              <p className="text-xs text-slate-500">Cuando está activo, el cajero puede marcar comidas subsidiadas.</p>
            </div>
            <button onClick={() => setEnabled(v => !v)} className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative ${enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Comidas subsidiadas por día</p>
              <p className="text-xs text-slate-500">Cuántas veces al día puede comer cada empleado con subsidio.</p>
            </div>
            <input type="number" min="0" value={mealsPerDay} onChange={e => setMealsPerDay(parseInt(e.target.value) || 0)}
              className="w-20 h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-center text-lg font-bold focus:outline-none focus:border-emerald-400" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveCfg} disabled={savingCfg} className="flex items-center gap-2 py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer">
              <Save className="w-4 h-4" /> {savingCfg ? 'Guardando...' : 'Guardar'}
            </button>
            {cfgMsg && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {cfgMsg}</span>}
          </div>
        </div>

        {/* Reporte para RH */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> Reporte para RH</p>
            <button onClick={exportExcel} disabled={!report || report.byUser.length === 0} className="flex items-center gap-2 py-2 px-4 rounded-full border border-emerald-200 dark:border-emerald-900 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-40 cursor-pointer">
              <Download className="w-4 h-4" /> Exportar Excel
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Desde</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Hasta</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            {branches.length > 1 && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Sucursal</label>
                <select value={branchId} onChange={e => setBranchId(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-emerald-400">
                  <option value="">Todas</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Total a pagar */}
          <div className="bg-emerald-600 rounded-2xl p-5 text-white flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">Total subsidiado en el periodo</p>
              <p className="text-xs text-emerald-100 mt-0.5">{report?.count || 0} comidas · esto es lo que la empresa paga al proveedor</p>
            </div>
            <p className="text-3xl font-extrabold" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>${report?.total || '0.00'}</p>
          </div>

          {/* Tabla por empleado */}
          {loadingRep ? (
            <p className="text-center py-6 text-sm text-slate-400">Cargando...</p>
          ) : !report || report.byUser.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-400">Sin consumo subsidiado en este periodo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Comensal</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Comidas</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.byUser.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{r.name}</p>
                        <p className="text-xs text-slate-400">#{r.employeeNumber}{branches.length > 1 ? ` · ${r.branchName}` : ''}</p>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{r.count}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">${r.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
