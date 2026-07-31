import React, { useState, useRef, useEffect } from 'react';
import { Lock, LogOut } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

interface Props {
  onUnlock: () => void;
}

export const CashierLockScreen: React.FC<Props> = ({ onUnlock }) => {
  const { user } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-password', { password });
      if (data.valid) {
        setPassword('');
        onUnlock();
      } else {
        setError('Contraseña incorrecta');
      }
    } catch {
      setError('Contraseña incorrecta');
    } finally {
      setLoading(false);
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-white text-xl font-bold">Panel bloqueado</h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.name ? `Ingresa tu contraseña para continuar, ${user.name.split(' ')[0]}` : 'Ingresa tu contraseña para continuar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Contraseña"
            autoComplete="current-password"
            className="w-full px-5 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-center text-lg tracking-wide placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-4 rounded-2xl bg-amber-500 text-slate-950 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
          >
            {loading ? 'Verificando...' : 'Desbloquear'}
          </button>
        </form>

        <button
          onClick={() => useAuthStore.getState().logout()}
          className="w-full mt-4 flex items-center justify-center gap-2 text-slate-500 text-sm cursor-pointer hover:text-slate-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
