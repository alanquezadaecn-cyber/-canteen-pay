import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { usePanelBase } from '../../hooks/usePanelBase';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const base = usePanelBase();
  const { setBalance } = useAuthStore();
  const [newBalance, setNewBalance] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        // Esperar 2s para que el webhook de MP haya procesado antes de consultar
        await new Promise(r => setTimeout(r, 2000));
        const { data } = await api.get('/users/me');
        setNewBalance(data.balance);
        setBalance(data.balance);
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [setBalance]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">

        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-9 h-9 text-slate-900 dark:text-slate-50" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          ¡Pago completado!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Tu recarga fue procesada exitosamente
        </p>

        {loading ? (
          <div className="py-6">
            <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-slate-900 dark:border-t-slate-100 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Actualizando saldo...</p>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 mb-8 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tu nuevo saldo</p>
            <p className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              ${parseFloat(newBalance || '0').toFixed(2)}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => navigate(base)}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-base transition-colors"
          >
            Ver mi saldo
          </button>
          <button
            onClick={() => navigate(`${base}/recharges`)}
            className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-base hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          >
            Ver historial
          </button>
        </div>
      </div>
    </div>
  );
};
