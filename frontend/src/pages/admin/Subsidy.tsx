import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../lib/api';
import { Coins, Save, Download, FileText, CheckCircle, Plus, Trash2, Layers, BadgeCheck } from 'lucide-react';

interface ReportRow { name: string; employeeNumber: string; branchName: string; count: number; amount: string; }
interface Tier { id: string; name: string; cost: string; isActive: boolean; branchId: string | null; branch: { id: string; name: string } | null }

export const Subsidy: React.FC = () => {
  // Config
  const [enabled, setEnabled] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(1);
  const [ivaRate, setIvaRate] = useState('16');
  const [settledAt, setSettledAt] = useState<string | null>(null);
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgMsg, setCfgMsg] = useState('');

  // Niveles de subsidio
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [newTierName, setNewTierName] = useState('');
  const [newTierCost, setNewTierCost] = useState('');
  const [newTierBranchId, setNewTierBranchId] = useState('');
  const [savingTier, setSavingTier] = useState(false);
  const [tierMsg, setTierMsg] = useState('');

  // Corte / liquidación
  const [settling, setSettling] = useState(false);

  // Reporte
  const today = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [report, setReport] = useState<{ subtotal: string; iva: string; ivaRate: string; total: string; count: number; byUser: ReportRow[]; settledAt: string | null } | null>(null);
  const [loadingRep, setLoadingRep] = useState(false);

  const loadConfig = () => {
    api.get('/admin/subsidy-config').then(({ data }) => {
      setEnabled(data.enabled); setMealsPerDay(data.mealsPerDay); setIvaRate(data.ivaRate); setSettledAt(data.settledAt);
    }).catch(() => {});
  };
  const loadTiers = () => {
    api.get('/admin/subsidy-tiers').then(({ data }) => {
      setTiers(data.tiers);
      if (data.branches) setBranches(data.branches);
    }).catch(() => {});
  };

  useEffect(() => { loadConfig(); loadTiers(); loadReport(); }, []);

  const saveCfg = async () => {
    setSavingCfg(true); setCfgMsg('');
    try {
      await api.put('/admin/subsidy-config', { enabled, mealsPerDay, ivaRate });
      setCfgMsg('Configuración guardada');
      setTimeout(() => setCfgMsg(''), 3000);
    } catch { setCfgMsg('Error al guardar'); }
    finally { setSavingCfg(false); }
  };

  const addTier = async () => {
    if (!newTierName.trim() || !newTierCost || parseFloat(newTierCost) <= 0) {
      setTierMsg('Nombre y costo válido requeridos');
      return;
    }
    setSavingTier(true); setTierMsg('');
    try {
      await api.post('/admin/subsidy-tiers', { name: newTierName.trim(), cost: newTierCost, branchId: newTierBranchId || null });
      setNewTierName(''); setNewTierCost(''); setNewTierBranchId('');
      loadTiers();
    } catch (err: any) {
      setTierMsg(err.response?.data?.error || 'Error al crear nivel');
    } finally { setSavingTier(false); }
  };

  const updateTierCost = async (tier: Tier, cost: string) => {
    setTiers(prev => prev.map(t => t.id === tier.id ? { ...t, cost } : t));
  };
  const saveTierCost = async (tier: Tier) => {
    try { await api.put(`/admin/subsidy-tiers/${tier.id}`, { cost: tier.cost }); } catch { loadTiers(); }
  };

  const saveTierBranch = async (tier: Tier, newBranchId: string) => {
    const branch = branches.find(b => b.id === newBranchId) || null;
    setTiers(prev => prev.map(t => t.id === tier.id ? { ...t, branchId: newBranchId || null, branch } : t));
    try { await api.put(`/admin/subsidy-tiers/${tier.id}`, { branchId: newBranchId || null }); } catch { loadTiers(); }
  };

  const deleteTier = async (tier: Tier) => {
    if (!confirm(`¿Eliminar el nivel "${tier.name}"? Los cajeros ya no podrán elegirlo.`)) return;
    try { await api.delete(`/admin/subsidy-tiers/${tier.id}`); loadTiers(); } catch {}
  };

  const settlePeriod = async () => {
    if (!report) return;
    if (!confirm(`¿Marcar este periodo como pagado por RH? El saldo subsidiado de todos los comensales regresará a $0 y empezará a acumularse de nuevo. Total liquidado: $${report.total} MXN.`)) return;
    setSettling(true);
    try {
      const { data } = await api.put('/admin/subsidy-settle');
      setSettledAt(data.settledAt);
      setFrom(new Date(data.settledAt).toISOString().slice(0, 10));
      loadReport();
    } catch {} finally { setSettling(false); }
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
      'Comidas subsidiadas': r.count, 'Monto base (MXN)': r.amount
    }));
    rows.push({ Comensal: 'SUBTOTAL', '# Empleado': '', Sucursal: '', 'Comidas subsidiadas': report.count as any, 'Monto base (MXN)': report.subtotal });
    rows.push({ Comensal: `IVA (${report.ivaRate}%)`, '# Empleado': '', Sucursal: '', 'Comidas subsidiadas': '' as any, 'Monto base (MXN)': report.iva });
    rows.push({ Comensal: 'TOTAL A PAGAR', '# Empleado': '', Sucursal: '', 'Comidas subsidiadas': '' as any, 'Monto base (MXN)': report.total });
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">IVA</p>
              <p className="text-xs text-slate-500">Se agrega al reporte que paga RH. El comensal nunca ve este porcentaje, solo el costo base del nivel.</p>
            </div>
            <div className="relative flex-shrink-0">
              <input type="number" min="0" step="0.01" value={ivaRate} onChange={e => setIvaRate(e.target.value)}
                className="w-20 h-11 pr-7 pl-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-center text-lg font-bold focus:outline-none focus:border-emerald-400" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveCfg} disabled={savingCfg} className="flex items-center gap-2 py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer">
              <Save className="w-4 h-4" /> {savingCfg ? 'Guardando...' : 'Guardar'}
            </button>
            {cfgMsg && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {cfgMsg}</span>}
          </div>
        </div>

        {/* Niveles de subsidio */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" /> Niveles de subsidio
          </p>
          <p className="text-xs text-slate-500 -mt-2">
            En caja, el cajero solo podrá elegir uno de estos niveles al cobrar subsidiado (ej. Estándar $75, Especial $120) — nunca cualquier platillo del menú.
          </p>

          {tiers.length > 0 && (
            <div className="space-y-2">
              {tiers.map(tier => (
                <div key={tier.id} className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{tier.name}</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                      <input
                        type="number" min="0" step="0.01" value={tier.cost}
                        onChange={e => updateTierCost(tier, e.target.value)}
                        onBlur={() => saveTierCost(tier)}
                        className="w-24 h-9 pl-6 pr-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <button onClick={() => deleteTier(tier)} className="w-9 h-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {branches.length > 1 && (
                    <select
                      value={tier.branchId || ''}
                      onChange={e => saveTierBranch(tier, e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs focus:outline-none focus:border-emerald-400"
                    >
                      <option value="">Todas las sucursales</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-slate-400 block mb-1">Nombre del nivel</label>
              <input type="text" value={newTierName} onChange={e => setNewTierName(e.target.value)} placeholder="Ej. Estándar"
                className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            {branches.length > 1 && (
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-slate-400 block mb-1">Sucursal</label>
                <select value={newTierBranchId} onChange={e => setNewTierBranchId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400">
                  <option value="">Todas las sucursales</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="w-28">
              <label className="text-xs text-slate-400 block mb-1">Costo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input type="number" min="0" step="0.01" value={newTierCost} onChange={e => setNewTierCost(e.target.value)} placeholder="75.00"
                  className="w-full h-11 pl-6 pr-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
              </div>
            </div>
            <button onClick={addTier} disabled={savingTier} className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 text-sm font-bold disabled:opacity-40 cursor-pointer">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          {tierMsg && <p className="text-xs text-red-500">{tierMsg}</p>}
        </div>

        {/* Reporte para RH */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> Reporte para RH</p>
            <button onClick={exportExcel} disabled={!report || report.byUser.length === 0} className="flex items-center gap-2 py-2 px-4 rounded-full border border-emerald-200 dark:border-emerald-900 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-40 cursor-pointer">
              <Download className="w-4 h-4" /> Exportar Excel
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {settledAt
              ? `Último periodo pagado por RH: ${new Date(settledAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}. El reporte muestra el consumo desde entonces.`
              : 'Aún no se ha liquidado ningún periodo. El reporte muestra el consumo desde el inicio del mes.'}
          </p>

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

          {/* Total a pagar: subtotal + IVA, desglosado (esto NO lo ve el comensal) */}
          <div className="bg-emerald-600 rounded-2xl p-5 text-white space-y-3">
            <p className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">{report?.count || 0} comidas subsidiadas en el periodo</p>
            <div className="flex items-center justify-between text-sm text-emerald-50">
              <span>Subtotal (lo que consumieron)</span>
              <span className="font-semibold">${report?.subtotal || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-emerald-50">
              <span>IVA ({report?.ivaRate || '16'}%)</span>
              <span className="font-semibold">${report?.iva || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <span className="text-sm font-bold">Total que RH debe pagar</span>
              <p className="text-3xl font-extrabold" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>${report?.total || '0.00'}</p>
            </div>
          </div>

          <button
            onClick={settlePeriod}
            disabled={settling || !report || parseFloat(report.total) <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm disabled:opacity-40 cursor-pointer"
          >
            <BadgeCheck className="w-4 h-4" /> {settling ? 'Liquidando...' : 'Marcar periodo como pagado por RH'}
          </button>

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
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Monto base</th>
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
              <p className="text-xs text-slate-400 mt-2">El monto base no incluye IVA — el desglose con IVA está arriba, en el total a pagar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
