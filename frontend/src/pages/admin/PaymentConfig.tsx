import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { CreditCard, CheckCircle, ExternalLink, Save, AlertCircle } from 'lucide-react';

export const PaymentConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [tokenMasked, setTokenMasked] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.get('/admin/payment-config')
      .then(({ data }) => {
        setConfigured(data.mpConfigured);
        setTokenMasked(data.mpTokenMasked || '');
        setPublicKey(data.mpPublicKey || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const body: any = { mpPublicKey: publicKey };
      if (accessToken.trim()) body.mpAccessToken = accessToken.trim();
      const { data } = await api.put('/admin/payment-config', body);
      setConfigured(data.mpConfigured);
      setAccessToken('');
      if (data.mpConfigured) {
        const { data: c } = await api.get('/admin/payment-config');
        setTokenMasked(c.mpTokenMasked || '');
      }
      setMsg({ ok: true, text: 'Configuración guardada. Las recargas en línea caen directo a tu cuenta de MercadoPago.' });
    } catch (err: any) {
      setMsg({ ok: false, text: err.response?.data?.error || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const disable = async () => {
    if (!confirm('¿Desactivar recargas en línea? Los comensales solo podrán recargar en caja.')) return;
    setSaving(true);
    try {
      await api.put('/admin/payment-config', { mpAccessToken: '', mpPublicKey: '' });
      setConfigured(false); setTokenMasked(''); setPublicKey(''); setAccessToken('');
      setMsg({ ok: true, text: 'Recargas en línea desactivadas.' });
    } catch {
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-5 space-y-6">

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Pagos en línea</h1>
            <p className="text-sm text-slate-500">Conecta tu MercadoPago — el dinero de las recargas cae directo a tu cuenta</p>
          </div>
        </div>

        {/* Estado */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${configured ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'}`}>
          {configured ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {configured ? 'Recargas en línea ACTIVAS' : 'Recargas en línea desactivadas'}
            </p>
            <p className="text-xs text-slate-500">
              {configured ? `Token conectado: ${tokenMasked}` : 'Los comensales solo pueden recargar en caja (efectivo).'}
            </p>
          </div>
        </div>

        {msg && (
          <div className={`rounded-2xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">¿Cómo obtengo mis credenciales?</p>
          <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
            <li>Entra a tu cuenta de MercadoPago → <b>Tu negocio → Configuración → Credenciales</b>.</li>
            <li>Copia tu <b>Access Token</b> de producción (empieza con <code className="text-emerald-600">APP_USR-</code>).</li>
            <li>Copia tu <b>Public Key</b> (opcional).</li>
            <li>Pégalos abajo y guarda. Listo: las recargas caen a tu cuenta.</li>
          </ol>
          <a
            href="https://www.mercadopago.com.mx/developers/panel/app"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-500"
          >
            Abrir panel de MercadoPago <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Formulario */}
        <form onSubmit={save} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Access Token {configured && <span className="text-slate-400 normal-case">(deja vacío para conservar el actual)</span>}
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="APP_USR-0000000000000000-..."
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-mono focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Public Key (opcional)</label>
            <input
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="APP_USR-xxxxxxxx-xxxx-..."
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-mono focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || (!accessToken.trim() && !configured)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {configured && (
              <button
                type="button"
                onClick={disable}
                disabled={saving}
                className="px-5 py-3 rounded-full border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
              >
                Desactivar
              </button>
            )}
          </div>
        </form>

        <p className="text-xs text-slate-400 text-center">
          CashFood no toca tu dinero — las recargas van directo a tu cuenta de MercadoPago. Tú solo pagas tu licencia.
        </p>
      </div>
    </div>
  );
};
