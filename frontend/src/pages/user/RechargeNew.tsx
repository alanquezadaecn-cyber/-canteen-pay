import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { AlertCircle, CreditCard, DollarSign, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { StripeForm } from '../../components/StripeForm';

type Step = 'amount' | 'method';
type PaymentMethod = 'stripe' | 'mercadopago' | 'cash';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export const RechargeNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleNextStep = () => {
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      setError('Ingresa un monto válido');
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

      // Redirigir a MercadoPago
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
      <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Recargar Saldo</h1>
          <p className="text-slate-600 mb-8">Paso 1: Selecciona el monto</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <Card className="mb-8">
            <CardContent className="pt-6">
              <Label className="text-sm font-medium text-slate-700 mb-4 block">
                Montos Rápidos
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {QUICK_AMOUNTS.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => handleQuickAmount(quickAmount)}
                    className={`p-4 rounded-lg border-2 font-bold transition-all ${
                      amount === quickAmount.toString()
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-emerald-300'
                    }`}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-600">o ingresa un monto</span>
                </div>
              </div>

              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-slate-700 mb-2 block">
                  Monto Personalizado
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-600 font-medium">$</span>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="pl-8"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleNextStep}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Recargar Saldo</h1>
        <p className="text-slate-600 mb-8">Paso 2: Selecciona método de pago</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Resumen */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-slate-600 text-sm mb-2">Monto a recargar</p>
            <p className="text-4xl font-bold text-emerald-600">
              ${parseFloat(amount).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Métodos de Pago */}
        <div className="space-y-4 mb-8">
          {/* Stripe Card */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMethod === 'stripe'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onClick={() => setSelectedMethod('stripe')}
          >
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className={`w-6 h-6 ${selectedMethod === 'stripe' ? 'text-emerald-600' : 'text-slate-600'}`} />
              <div>
                <p className="font-bold text-slate-900">Tarjeta de Crédito/Débito</p>
                <p className="text-sm text-slate-600">Visa, Mastercard, Amex</p>
              </div>
            </div>
          </div>

          {/* MercadoPago */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMethod === 'mercadopago'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onClick={() => setSelectedMethod('mercadopago')}
          >
            <div className="flex items-center gap-3 mb-3">
              <Wallet className={`w-6 h-6 ${selectedMethod === 'mercadopago' ? 'text-blue-600' : 'text-slate-600'}`} />
              <div>
                <p className="font-bold text-slate-900">MercadoPago</p>
                <p className="text-sm text-slate-600">Tarjeta o billetera MP</p>
              </div>
            </div>
          </div>

          {/* Efectivo en Caja */}
          <div
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMethod === 'cash'
                ? 'border-amber-500 bg-amber-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
            onClick={() => setSelectedMethod('cash')}
          >
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className={`w-6 h-6 ${selectedMethod === 'cash' ? 'text-amber-600' : 'text-slate-600'}`} />
              <div>
                <p className="font-bold text-slate-900">Efectivo en Caja</p>
                <p className="text-sm text-slate-600">Pagar directamente al cajero</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Pago según selección */}
        {selectedMethod === 'stripe' && (
          <StripeForm amount={parseFloat(amount)} />
        )}

        {selectedMethod === 'mercadopago' && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <Button
                onClick={handleMercadoPagoPayment}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {loading ? 'Procesando...' : `Pagar $${parseFloat(amount).toFixed(2)} con MercadoPago`}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-3">
                Serás redirigido al sitio de MercadoPago
              </p>
            </CardContent>
          </Card>
        )}

        {selectedMethod === 'cash' && (
          <Card className="mb-8 bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <p className="text-slate-700 text-center mb-4">
                Dirígete a la caja del comedor para efectuar el pago en efectivo.
              </p>
              <p className="text-sm text-slate-600 text-center mb-6">
                Tu saldo se actualizará automáticamente una vez que el cajero procese el pago.
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Cerrar
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedMethod !== null && selectedMethod !== 'stripe' && selectedMethod !== 'mercadopago' && (
          <div className="flex gap-4">
            <Button
              onClick={() => setSelectedMethod(null)}
              variant="outline"
              className="flex-1"
            >
              Cambiar Monto
            </Button>
          </div>
        )}

        {(selectedMethod === null || selectedMethod === 'stripe') && (
          <div className="flex gap-4">
            <Button
              onClick={() => setStep('amount')}
              variant="outline"
              className="flex-1"
            >
              Atrás
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
