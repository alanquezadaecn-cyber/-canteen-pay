import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Wallet, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';

type Step = 'amount' | 'method';
type PaymentMethod = 'mercadopago' | 'cash';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export const RechargeNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep = () => {
    const numAmount = parseFloat(amount);
    if (!amount || numAmount < 10) {
      setError('El monto mínimo es $10');
      return;
    }
    setError('');
    setStep('method');
  };

  const handleMercadoPagoPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/payments/mp/create-preference', {
        amount: parseFloat(amount)
      });
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear preferencia de pago');
      setLoading(false);
    }
  };

  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-lg mx-auto p-4 md:p-8 pt-8 md:pt-16 space-y-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 mb-4 transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Recargar saldo</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Selecciona cuánto quieres recargar</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Saldo actual */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo actual</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
              ${parseFloat(user?.balance || '0').toFixed(2)}
            </p>
          </div>

          {/* Montos rápidos */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto a recargar</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className={`h-12 rounded-xl text-sm font-semibold border transition-colors ${
                    amount === String(q)
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  ${q}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Otro monto..."
                step="1"
                min="10"
                className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-base focus:outline-none focus:border-slate-400 transition-colors"
              />
            </div>

            {amount && parseFloat(amount) >= 10 && (
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-50 px-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Nuevo saldo</span>
                <span>${(parseFloat(user?.balance || '0') + parseFloat(amount)).toFixed(2)}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleNextStep}
            disabled={!amount || parseFloat(amount) < 10}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-base transition-colors disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
      <div className="max-w-lg mx-auto p-4 md:p-8 pt-8 md:pt-16 space-y-5">
        <div>
          <button
            onClick={() => setStep('amount')}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 mb-4 transition-colors"
          >
            ← Cambiar monto
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Método de pago</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">¿Cómo quieres pagar?</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Resumen del monto */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recargando</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-1">
            ${parseFloat(amount).toFixed(2)}
          </p>
        </div>

        {/* Métodos */}
        <div className="space-y-3">
          {/* MercadoPago */}
          <button
            onClick={() => setSelectedMethod('mercadopago')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              selectedMethod === 'mercadopago'
                ? 'border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-900'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <p className="font-semibold text-base text-slate-900 dark:text-slate-50">MercadoPago</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tarjeta, OXXO, billetera MP</p>
              </div>
              {selectedMethod === 'mercadopago' && (
                <div className="ml-auto w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                </div>
              )}
            </div>
          </button>

          {/* Efectivo en caja */}
          <button
            onClick={() => setSelectedMethod('cash')}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              selectedMethod === 'cash'
                ? 'border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-900'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <p className="font-semibold text-base text-slate-900 dark:text-slate-50">Efectivo en caja</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Paga directamente con el cajero</p>
              </div>
              {selectedMethod === 'cash' && (
                <div className="ml-auto w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-900" />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Acción según método seleccionado */}
        {selectedMethod === 'mercadopago' && (
          <button
            onClick={handleMercadoPagoPayment}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-base transition-colors disabled:opacity-40"
          >
            {loading ? 'Redirigiendo...' : `Pagar $${parseFloat(amount).toFixed(2)} con MercadoPago`}
          </button>
        )}

        {selectedMethod === 'cash' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Dirígete a la caja del comedor y dile al cajero que quieres recargar <strong>${parseFloat(amount).toFixed(2)}</strong>.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tu saldo se actualizará automáticamente en cuanto el cajero procese el pago.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
