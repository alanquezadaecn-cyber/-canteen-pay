import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, user } = useAuthStore();
  const [newBalance, setNewBalance] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const { data } = await api.get('/users/me');
        setNewBalance(data.balance);
        setAuth(data, null, null);
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(verifyPayment, 2000);

    return () => clearTimeout(timer);
  }, [setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="mb-6">
            <div className="inline-block">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            ¡Pago Completado!
          </h1>
          <p className="text-slate-600 mb-8">
            Tu recarga ha sido procesada exitosamente
          </p>

          {loading ? (
            <div className="py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
              <p className="text-sm text-slate-600">Actualizando saldo...</p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 mb-8 border border-emerald-200">
              <p className="text-sm text-slate-600 mb-1">Tu nuevo saldo</p>
              <p className="text-4xl font-bold text-emerald-600">
                ${parseFloat(newBalance).toFixed(2)}
              </p>
            </div>
          )}

          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 mb-3"
          >
            Ver Mi Saldo
          </Button>
          <Button
            onClick={() => navigate('/recharges')}
            variant="outline"
            className="w-full"
          >
            Ver Historial de Recargas
          </Button>
        </CardContent>
      </Card>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};
