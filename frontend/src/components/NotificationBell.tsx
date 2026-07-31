import React, { useEffect, useState } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import api from '../lib/api';
import { getPushPermissionState, subscribeToPush } from '../lib/push';

interface Alert { id: string; type: string; message: string; isRead: boolean; createdAt: string; }

export const NotificationBell: React.FC<{ light?: boolean }> = ({ light }) => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushState, setPushState] = useState<NotificationPermission | 'unsupported'>('default');
  const [subscribing, setSubscribing] = useState(false);

  const load = () => {
    api.get('/users/me/alerts').then(({ data }) => { setAlerts(data.alerts); setUnread(data.unread); }).catch(() => {});
  };

  useEffect(() => {
    load();
    getPushPermissionState().then(setPushState);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(load, 60000);
    return () => { document.removeEventListener('visibilitychange', onVisible); clearInterval(interval); };
  }, []);

  const markAllRead = async () => {
    if (unread === 0) return;
    await api.put('/users/me/alerts/read-all').catch(() => {});
    setUnread(0);
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const enablePush = async () => {
    setSubscribing(true);
    try {
      await subscribeToPush();
      setPushState(await getPushPermissionState());
    } finally {
      setSubscribing(false);
    }
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative">
      <button
        onClick={() => { const next = !open; setOpen(next); if (next) markAllRead(); }}
        className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${light ? 'text-white hover:bg-white/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        title="Notificaciones"
      >
        {unread > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Móvil: panel fijo con márgenes laterales (nunca se sale de la pantalla).
              Desktop (md+): dropdown anclado a la campanita, ancho fijo. */}
          <div className="fixed left-3 right-3 top-16 md:absolute md:left-auto md:right-0 md:top-auto md:mt-2 md:w-80 max-h-[70vh] md:max-h-[26rem] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl z-50">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Notificaciones</p>
              <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {pushState !== 'unsupported' && pushState !== 'granted' && (
              <button
                onClick={enablePush}
                disabled={subscribing || pushState === 'denied'}
                className="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
              >
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {pushState === 'denied' ? 'Notificaciones bloqueadas' : subscribing ? 'Activando...' : 'Activar notificaciones'}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                  {pushState === 'denied' ? 'Actívalas desde los permisos del navegador para este sitio' : 'Entérate al instante de cobros y recargas, aunque no tengas la app abierta'}
                </p>
              </button>
            )}

            {alerts.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">Sin notificaciones aún</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.map(a => (
                  <div key={a.id} className={`px-4 py-3 ${!a.isRead ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{a.message}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fmtTime(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
