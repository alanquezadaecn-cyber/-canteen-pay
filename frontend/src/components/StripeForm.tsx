import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeFormProps {
  amount: number;
}

const CardForm: React.FC<StripeFormProps & { clientSecret: string; onSuccess: () => void }> = ({
  amount,
  clientSecret,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe no está disponible');
      return;
    }

    setLoading(true);
    setError('');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Elemento de tarjeta no encontrado');
      setLoading(false);
      return;
    }

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Error al procesar el pago');
      } else if (result.paymentIntent?.status === 'succeeded') {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="mb-8 bg-green-50 border-green-200">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-green-900 mb-2">¡Pago procesado!</h3>
          <p className="text-green-700 mb-4">
            Tu saldo se actualizará en unos momentos
          </p>
          <p className="text-sm text-slate-600">
            Redirigiendo al panel...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Información de Tarjeta
          </label>
          <div className="p-4 border border-slate-300 rounded-lg mb-6 bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1e293b',
                    '::placeholder': {
                      color: '#94a3b8',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
          </Button>

          <p className="text-xs text-slate-500 text-center mt-3">
            Tu tarjeta está segura. Utilizamos Stripe para procesar pagos.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export const StripeForm: React.FC<StripeFormProps> = ({ amount }) => {
  const { user } = useAuthStore();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const { data } = await api.post('/payments/stripe/create-intent', {
          amount,
        });

        setClientSecret(data.clientSecret);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al crear intención de pago');
      } finally {
        setLoading(false);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount]);

  const handleSuccess = () => {
    // Esperar un poco para que el webhook procese, luego redirigir
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3"></div>
          <p className="text-slate-600">Preparando formulario de pago...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-8 bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CardForm amount={amount} clientSecret={clientSecret} onSuccess={handleSuccess} />
    </Elements>
  );
};
