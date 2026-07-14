import React, { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { isOnline, queueCount, flushQueue } from '../lib/offline';

// Banner fijo que muestra el estado de conexión y las operaciones pendientes
// de sincronizar. Auto-sincroniza al recuperar la conexión.
export const OfflineBanner: React.FC = () => {
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(queueCount());
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  const refreshPending = useCallback(() => setPending(queueCount()), []);

  const sync = useCallback(async () => {
    if (syncing || queueCount() === 0 || !isOnline()) return;
    setSyncing(true);
    try {
      const { synced, failed, errors } = await flushQueue();
      refreshPending();
      if (synced > 0 || failed > 0) {
        setFlash({
          ok: failed === 0,
          msg: failed === 0
            ? `${synced} operación${synced === 1 ? '' : 'es'} sincronizada${synced === 1 ? '' : 's'}`
            : `${synced} sincronizadas, ${failed} con error: ${errors[0] || ''}`
        });
        setTimeout(() => setFlash(null), 5000);
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshPending]);

  useEffect(() => {
    const goOnline = () => { setOnline(true); sync(); };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    // Revisar pendientes periódicamente y al montar
    const iv = setInterval(() => { refreshPending(); if (isOnline()) sync(); }, 15000);
    if (isOnline()) sync();
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(iv);
    };
  }, [sync, refreshPending]);

  // Nada que mostrar si está online y sin pendientes
  if (online && pending === 0 && !flash) return null;

  return (
    <div className="fixed top-14 md:top-0 left-0 right-0 md:left-64 z-50 print:hidden">
      {flash ? (
        <div className={`flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white ${flash.ok ? 'bg-emerald-600' : 'bg-amber-600'}`}>
          {flash.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {flash.msg}
        </div>
      ) : !online ? (
        <div className="flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white bg-slate-800">
          <WifiOff className="w-4 h-4" />
          Sin conexión — trabajando offline{pending > 0 ? ` · ${pending} pendiente${pending === 1 ? '' : 's'}` : ''}
        </div>
      ) : pending > 0 ? (
        <button
          onClick={sync}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {pending} operación{pending === 1 ? '' : 'es'} por sincronizar — {syncing ? 'sincronizando...' : 'toca para sincronizar'}
        </button>
      ) : null}
    </div>
  );
};
