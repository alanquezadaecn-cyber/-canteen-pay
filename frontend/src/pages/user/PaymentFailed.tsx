import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AlertCircle } from 'lucide-react';

export const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Pago No Completado
          </h1>
          <p className="text-slate-600 mb-8">
            Hubo un problema al procesar tu pago. Por favor, intenta de nuevo.
          </p>

          <div className="bg-red-50 rounded-lg p-4 mb-8 border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Posibles razones:</strong>
            </p>
            <ul className="text-sm text-red-700 mt-2 space-y-1 text-left">
              <li>• Fondos insuficientes</li>
              <li>• Tarjeta expirada o rechazada</li>
              <li>• Límite de transacción excedido</li>
              <li>• Problema temporal del servidor</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/recharge/new')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Intentar de Nuevo
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Volver al Panel
            </Button>
            <Button
              onClick={() => navigate('/cashier/scan')}
              variant="outline"
              className="w-full text-slate-600"
            >
              Pagar en Caja
            </Button>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            Si el problema persiste, contacta al administrador
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
