import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { usePanelBase } from '../../hooks/usePanelBase';
import { CalendarRange, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Tier { id: string; name: string; cost: string; branchId: string | null }
interface DayEntry { week: number; dayOfWeek: number; subsidyTierId: string; dishName: string }
interface ManualMenuEntry { subsidyTierId: string; dishName: string }
interface BranchRow { id: string; name: string; useMenuRotation: boolean; mode: 'AUTO' | 'MANUAL'; manualMenus: ManualMenuEntry[]; currentWeek: number }

// El menú rotativo ES el menú subsidiado: cada día del ciclo trae un platillo distinto
// POR NIVEL de subsidio (Estándar, Especial...). El costo no se toca aquí — ya vive en
// SubsidyTier; esta pantalla solo dice "qué platillo toca hoy" por nivel.
export const MenuRotation: React.FC = () => {
  const base = usePanelBase();
  const [enabled, setEnabled] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualWeek, setManualWeek] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [days, setDays] = useState<DayEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [savingCfg, setSavingCfg] = useState(false);
  const [savingDays, setSavingDays] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/admin/menu-rotation').then(({ data }) => {
      setEnabled(data.enabled);
      setStartDate(data.startDate ? String(data.startDate).slice(0, 10) : '');
      setMode(data.mode);
      setManualWeek(data.manualWeek || 1);
      setCurrentWeek(data.currentWeek);
      setTiers(data.tiers || []);
      setBranches((data.branches || []).map((b: any) => ({ ...b, manualMenus: b.manualMenus || [] })));

      // Rellenar los 56 días x cada tier, usando lo que ya existe en el servidor
      const tierList: Tier[] = data.tiers || [];
      const existing = new Map((data.days || []).map((d: DayEntry) => [`${d.week}-${d.dayOfWeek}-${d.subsidyTierId}`, d]));
      const full: DayEntry[] = [];
      for (const week of WEEKS) {
        for (const d of DAYS) {
          for (const t of tierList) {
            const key = `${week}-${d.value}-${t.id}`;
            const found = existing.get(key) as DayEntry | undefined;
            full.push({ week, dayOfWeek: d.value, subsidyTierId: t.id, dishName: found?.dishName || '' });
          }
        }
      }
      setDays(full);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const saveConfig = async () => {
    setSavingCfg(true); setMsg('');
    try {
      await api.put('/admin/menu-rotation/config', { enabled, startDate: startDate || null, mode, manualWeek });
      setMsg('Configuración guardada');
      load();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Error al guardar'); }
    finally { setSavingCfg(false); }
  };

  const toggleBranch = async (branchId: string, value: boolean) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, useMenuRotation: value } : b));
    try { await api.put(`/admin/menu-rotation/branches/${branchId}`, { useMenuRotation: value }); } catch { load(); }
  };

  const setBranchMode = async (branchId: string, newMode: 'AUTO' | 'MANUAL') => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, mode: newMode } : b));
    try { await api.put(`/admin/menu-rotation/branches/${branchId}`, { mode: newMode }); } catch { load(); }
  };

  const updateBranchManual = (branchId: string, tierId: string, value: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== branchId) return b;
      const rest = b.manualMenus.filter(m => m.subsidyTierId !== tierId);
      return { ...b, manualMenus: [...rest, { subsidyTierId: tierId, dishName: value }] };
    }));
  };

  const saveBranchManual = async (branchId: string) => {
    const b = branches.find(x => x.id === branchId);
    if (!b) return;
    try { await api.put(`/admin/menu-rotation/branches/${branchId}`, { manualMenus: b.manualMenus }); } catch { load(); }
  };

  const updateDay = (week: number, dayOfWeek: number, tierId: string, value: string) => {
    setDays(prev => prev.map(d => d.week === week && d.dayOfWeek === dayOfWeek && d.subsidyTierId === tierId ? { ...d, dishName: value } : d));
  };

  const saveDays = async () => {
    setSavingDays(true); setMsg('');
    try {
      await api.put('/admin/menu-rotation/days', { days });
      setMsg('Menú guardado');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Error al guardar el menú'); }
    finally { setSavingDays(false); }
  };

  const weekDays = days.filter(d => d.week === selectedWeek);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-8 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CalendarRange className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Menú rotativo</h1>
            <p className="text-sm text-slate-500">Ciclo de 8 semanas del menú subsidiado — un platillo por nivel cada día</p>
          </div>
        </div>

        {tiers.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Primero da de alta tus niveles de subsidio</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                El menú rotativo se arma por nivel (ej. Estándar, Especial). Ve a{' '}
                <Link to={`${base}/subsidio`} className="underline font-semibold">Subsidio</Link> y crea al menos un nivel antes de continuar.
              </p>
            </div>
          </div>
        )}

        {/* Configuración */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Configuración</p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Menú rotativo activo</p>
              <p className="text-xs text-slate-500">Cuando está activo, las sucursales que elijas abajo pueden usarlo.</p>
            </div>
            <button onClick={() => setEnabled(v => !v)} className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative ${enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">¿Cómo se elige la semana activa?</p>
              <p className="text-xs text-slate-500">Semana actual del ciclo: <strong className="text-emerald-600 dark:text-emerald-400">Semana {currentWeek}</strong></p>
            </div>
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
              <button onClick={() => setMode('AUTO')} className={`h-9 px-4 rounded-full text-xs font-bold cursor-pointer transition-colors ${mode === 'AUTO' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Automático</button>
              <button onClick={() => setMode('MANUAL')} className={`h-9 px-4 rounded-full text-xs font-bold cursor-pointer transition-colors ${mode === 'MANUAL' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Manual</button>
            </div>
          </div>

          {mode === 'AUTO' ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Fecha de inicio de la Semana 1</p>
                <p className="text-xs text-slate-500">El ciclo se calcula solo desde aquí, repitiendo cada 8 semanas.</p>
              </div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Semana activa (manual)</p>
                <p className="text-xs text-slate-500">Tú eliges qué semana del ciclo se muestra ahora.</p>
              </div>
              <select value={manualWeek} onChange={e => setManualWeek(parseInt(e.target.value))}
                className="h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400">
                {WEEKS.map(w => <option key={w} value={w}>Semana {w}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button onClick={saveConfig} disabled={savingCfg} className="flex items-center gap-2 py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer">
              <Save className="w-4 h-4" /> {savingCfg ? 'Guardando...' : 'Guardar'}
            </button>
            {msg && <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {msg}</span>}
          </div>
        </div>

        {/* Sucursales que lo usan */}
        {branches.length > 0 && tiers.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-3">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">¿Qué sucursales lo ven?</p>
            <p className="text-xs text-slate-500 -mt-2">
              Cada sucursal activada elige: <strong className="text-slate-600 dark:text-slate-300">Automático</strong> (sigue el ciclo de 8 semanas)
              o <strong className="text-slate-600 dark:text-slate-300">Manual</strong> (esa sucursal pone su propio platillo de hoy por nivel, sin importar el ciclo).
            </p>
            <div className="space-y-2">
              {branches.map(b => {
                const branchTiers = tiers.filter(t => !t.branchId || t.branchId === b.id);
                return (
                  <div key={b.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{b.name}</span>
                      <button
                        onClick={() => toggleBranch(b.id, !b.useMenuRotation)}
                        className={`h-8 px-3 rounded-full text-xs font-bold cursor-pointer transition-colors flex-shrink-0 ${b.useMenuRotation ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                      >
                        {b.useMenuRotation ? 'Activado' : 'Desactivado'}
                      </button>
                    </div>

                    {b.useMenuRotation && (
                      <>
                        <div className="flex gap-2 bg-white dark:bg-slate-900 rounded-full p-1 w-fit">
                          <button
                            onClick={() => setBranchMode(b.id, 'AUTO')}
                            className={`h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${b.mode === 'AUTO' ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                            Automático · Semana {b.currentWeek}
                          </button>
                          <button
                            onClick={() => setBranchMode(b.id, 'MANUAL')}
                            className={`h-7 px-3 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${b.mode === 'MANUAL' ? 'bg-amber-500 text-slate-950' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                            Manual
                          </button>
                        </div>

                        {b.mode === 'MANUAL' && (
                          <div className="space-y-2">
                            {branchTiers.map(t => {
                              const entry = b.manualMenus.find(m => m.subsidyTierId === t.id);
                              return (
                                <div key={t.id} className="flex items-center gap-2">
                                  <span className="w-20 flex-shrink-0 text-[11px] font-semibold text-slate-500">{t.name}</span>
                                  <input
                                    type="text"
                                    value={entry?.dishName || ''}
                                    onChange={e => updateBranchManual(b.id, t.id, e.target.value)}
                                    onBlur={() => saveBranchManual(b.id)}
                                    placeholder="Platillo de hoy"
                                    className="flex-1 h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cuadrícula del ciclo */}
        {tiers.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Platillos del ciclo</p>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {WEEKS.map(w => (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`flex-shrink-0 h-9 px-3.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                    selectedWeek === w
                      ? 'bg-emerald-600 text-white'
                      : w === currentWeek
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Semana {w}{w === currentWeek ? ' •' : ''}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {DAYS.map(day => (
                <div key={day.value} className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500">{day.label}</span>
                  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))` }}>
                    {tiers.map(t => {
                      const entry = weekDays.find(d => d.dayOfWeek === day.value && d.subsidyTierId === t.id);
                      return (
                        <div key={t.id} className="relative">
                          <input
                            type="text"
                            value={entry?.dishName || ''}
                            onChange={e => updateDay(selectedWeek, day.value, t.id, e.target.value)}
                            placeholder={`${t.name} — ej. Milanesa`}
                            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={saveDays} disabled={savingDays} className="flex items-center gap-2 py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer">
              <Save className="w-4 h-4" /> {savingDays ? 'Guardando...' : 'Guardar menú (las 8 semanas)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
