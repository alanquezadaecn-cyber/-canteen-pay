import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../lib/api';
import { Clock, ArrowDownLeft, ArrowUpRight, Camera, Keyboard, CheckCircle } from 'lucide-react';

interface Record {
  id: string;
  type: 'IN' | 'OUT';
  createdAt: string;
  user: { name: string; position?: string; employeeNumber: string; isStaff: boolean } | null;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });

export const CashierAttendance: React.FC = () => {
  const { user } = useAuthStore();
  const branchId = user?.branchId || '';

  const [records, setRecords] = useState<Record[]>([]);
  const [manual, setManual] = useState('');
  const [flash, setFlash] = useState<{ type: 'IN' | 'OUT'; name: string; position: string; time: string } | null>(null);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const busyRef = useRef(false);

  const load = () => {
    if (!branchId) return;
    api.get(`/cashier/branch/${branchId}/attendance`).then(r => setRecords(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [branchId]);

  const registrar = async (term: string) => {
    if (busyRef.current || !term.trim()) return;
    busyRef.current = true;
    setError('');
    try {
      const { data } = await api.post(`/cashier/branch/${branchId}/attendance/scan`, { qrCode: term.trim() });
      setFlash({ type: data.type, name: data.name, position: data.position, time: fmtTime(data.time) });
      setManual('');
      load();
      setTimeout(() => setFlash(null), 3500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo registrar');
      setTimeout(() => setError(''), 3000);
    } finally {
      setTimeout(() => { busyRef.current = false; }, 1200); // evitar doble-scan del mismo QR
    }
  };

  const startCamera = async () => {
    try {
      const qr = new Html5Qrcode('att-reader');
      qrRef.current = qr;
      await qr.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => registrar(decoded), () => {});
      setCameraOn(true);
    } catch {
      setCameraOn(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      const qr = qrRef.current; qrRef.current = null;
      if (qr) { try { const p = qr.stop(); if (p && (p as any).catch) (p as Promise<void>).catch(() => {}); } catch {} }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8 pt-16 md:pt-8">
      <div className="max-w-lg mx-auto px-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Asistencia</h1>
            <p className="text-sm text-slate-500">Escanea el QR para marcar entrada/salida</p>
          </div>
        </div>

        {/* Confirmación grande */}
        {flash && (
          <div className={`rounded-3xl p-6 text-center text-white ${flash.type === 'IN' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              {flash.type === 'IN' ? <ArrowDownLeft className="w-8 h-8" /> : <ArrowUpRight className="w-8 h-8" />}
            </div>
            <p className="text-2xl font-bold">{flash.type === 'IN' ? 'Entrada' : 'Salida'} · {flash.time}</p>
            <p className="text-white/90 mt-1">{flash.name}{flash.position ? ` · ${flash.position}` : ''}</p>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl text-sm text-center">{error}</div>
        )}

        {/* Cámara */}
        <div className="bg-black rounded-3xl overflow-hidden relative" style={{ aspectRatio: '1/1' }}>
          <div id="att-reader" className="w-full h-full" />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <div className="text-center"><Camera className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">Cámara no disponible — usa el número abajo</p></div>
            </div>
          )}
        </div>

        {/* Manual */}
        <form onSubmit={(e) => { e.preventDefault(); registrar(manual); }} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Keyboard className="w-4 h-4" /> O ingresa el número</p>
          <div className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Número de empleado o QR"
              className="flex-1 h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
            <button type="submit" className="h-12 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold cursor-pointer">Marcar</button>
          </div>
        </form>

        {/* Registros del día */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Movimientos de hoy</h2>
            <span className="text-xs text-slate-400">{records.length}</span>
          </div>
          {records.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">Aún no hay entradas ni salidas hoy.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {records.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">{r.user?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{r.user?.position || (r.user?.isStaff ? 'Operación' : 'Comensal')} · #{r.user?.employeeNumber}</p>
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
