import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Rec {
  id: string;
  type: 'IN' | 'OUT';
  createdAt: string;
  branchName: string;
  user: { name: string; position?: string; employeeNumber: string; isStaff: boolean } | null;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });

export const Attendance: React.FC = () => {
  const [records, setRecords] = useState<Rec[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/admin/attendance?branchId=${branchId}&date=${date}`)
      .then(({ data }) => { setRecords(data.records); setBranches(data.branches || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [branchId, date]);

  const ins = records.filter(r => r.type === 'IN').length;
  const outs = records.filter(r => r.type === 'OUT').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-8 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Asistencia</h1>
            <p className="text-sm text-slate-500">Entradas y salidas de operación por sucursal</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          {branches.length > 1 && (
            <select value={branchId} onChange={e => setBranchId(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-emerald-400">
              <option value="">Todas las sucursales</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:border-emerald-400" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-400 uppercase font-semibold">Entradas</p>
            <p className="text-2xl font-bold text-emerald-600">{ins}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-400 uppercase font-semibold">Salidas</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{outs}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-400 uppercase font-semibold">Movimientos</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{records.length}</p>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <p className="text-center py-10 text-sm text-slate-400">Cargando...</p>
          ) : records.length === 0 ? (
            <p className="text-center py-10 text-sm text-slate-400">Sin registros para este día.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
              {records.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">{r.user?.name || '—'}</p>
                    <p className="text-xs text-slate-400">
                      {r.user?.position || (r.user?.isStaff ? 'Operación' : 'Comensal')} · #{r.user?.employeeNumber}
                      {branches.length > 1 && ` · ${r.branchName}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${r.type === 'IN' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {r.type === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {r.type === 'IN' ? 'Entrada' : 'Salida'}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtTime(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
