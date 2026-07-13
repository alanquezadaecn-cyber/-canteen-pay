import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { usePanelBase } from '../../hooks/usePanelBase';

export const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const base = usePanelBase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-sm">

        <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-9 h-9 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Pago no completado
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Hubo un problema al procesar tu pago. No se hizo ningún cargo.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-8 border border-slate-200 dark:border-slate-700 text-left">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Posibles causas</p>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Fondos insuficientes</li>
            <li>• Tarjeta expirada o rechazada</li>
            <li>• Límite de transacción excedido</li>
            <li>• Pago cancelado</li>
          </ul>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => navigate(`${base}/recharge/new`)}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-base transition-colors"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => navigate(base)}
            className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-base hover:border-slate-400 transition-colors"
          >
            Volver al panel
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Si el problema persiste, contacta al administrador del comedor.
        </p>
      </div>
    </div>
  );
};
