import React from 'react';
import { AlertTriangle, MessageCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const WA = '5218112683542'; // WhatsApp de soporte CashFood

export const AccountSuspended: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hola, mi cuenta de CashFood (${user?.company || 'mi empresa'}) aparece suspendida y necesito ayuda para reactivarla.`);
    window.open(`https://wa.me/${WA}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-900/10 p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Cuenta suspendida</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {user?.company ? `La cuenta de ${user.company} está suspendida temporalmente.` : 'Tu cuenta está suspendida temporalmente.'}
            {' '}Ponte en contacto con soporte de CashFood para reactivarla.
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Contactar soporte por WhatsApp
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};
