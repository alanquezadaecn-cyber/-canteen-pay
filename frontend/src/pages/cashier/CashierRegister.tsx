import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { UserPlus, CheckCircle, Copy, Download, Printer, X } from 'lucide-react';
import QRCodeComponent from 'qrcode.react';

interface Created {
  id: string;
  name: string;
  email: string;
  employeeNumber: string;
  qrCode: string;
  password: string;
}

export const CashierRegister: React.FC = () => {
  const { user } = useAuthStore();
  const branchId = user?.branchId || '';

  const [form, setForm] = useState({ name: '', phone: '', email: '', employeeNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState('');
  const qrRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    if (!branchId) { setError('No tienes una sucursal asignada'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/cashier/branch/${branchId}/register`, form);
      setCreated(data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar comensal');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const printQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas || !created) return;
    const w = window.open('', '', 'height=600,width=600');
    if (!w) return;
    w.document.write(`
      <html><head><title>QR - ${created.name}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Arial}
      h1{color:#059669}p{color:#64748b;margin:6px}</style></head>
      <body><h1>${created.name}</h1><p>Empleado #${created.employeeNumber}</p>${canvas.outerHTML}
      <p style="font-size:11px">${created.qrCode}</p></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 150);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas || !created) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `QR_${created.employeeNumber}.png`;
    link.click();
  };

  const reset = () => {
    setCreated(null);
    setForm({ name: '', phone: '', email: '', employeeNumber: '', password: '' });
    setError('');
  };

  // ── Pantalla de éxito con QR y credenciales ──
  if (created) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8 pt-16 md:pt-8">
        <div className="max-w-lg mx-auto px-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 px-6 py-6 text-center">
              <div className="w-14 h-14 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">¡Comensal registrado!</h1>
              <p className="text-emerald-100 text-sm mt-1">{created.name}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* QR */}
              <div ref={qrRef} className="flex justify-center p-5 bg-white rounded-2xl border-2 border-slate-100">
                <QRCodeComponent value={created.qrCode} size={180} level="H" includeMargin />
              </div>

              {/* Código grande */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-1">Código de acceso</p>
                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest">{created.employeeNumber}</p>
              </div>

              {/* Credenciales */}
              <div className="space-y-2">
                {[
                  { label: 'Número de empleado', value: created.employeeNumber },
                  { label: 'Contraseña', value: created.password },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">{value}</p>
                    </div>
                    <button onClick={() => copy(value, label)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                      {copied === label ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Acciones QR */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadQR} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-full transition-colors cursor-pointer">
                  <Download className="w-4 h-4" /> Descargar QR
                </button>
                <button onClick={printQR} className="flex items-center justify-center gap-2 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-full hover:border-emerald-400 transition-colors cursor-pointer">
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </div>

              <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white text-sm font-semibold rounded-full transition-colors cursor-pointer">
                <UserPlus className="w-4 h-4" /> Registrar otro comensal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario ──
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8">
      <div className="relative bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-400 rounded-b-[2.5rem] pt-20 md:pt-12 pb-16 px-5 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative max-w-lg mx-auto text-center">
          <div className="w-12 h-12 bg-white/25 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Registrar Comensal</h1>
          <p className="text-emerald-100 text-sm mt-2">Da de alta a un nuevo comensal en tu comedor</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-10 relative">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-100 dark:border-slate-800 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Nombre completo *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Juan Pérez"
              autoFocus
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5"># Empleado</label>
              <input
                value={form.employeeNumber}
                onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                placeholder="Auto"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Opcional"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Email (opcional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Si el comensal quiere entrar a la app"
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400">
            Si no pones número de empleado, se genera automático. La contraseña por defecto es su número de empleado.
          </div>

          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors disabled:opacity-40 shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Registrando...' : 'Registrar comensal'}
          </button>
        </form>
      </div>
    </div>
  );
};
