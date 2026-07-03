import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { AlertCircle, CreditCard, DollarSign, User, Building, Briefcase, TrendingUp } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  company: string;
  employeeNumber: string;
  balance: string;
  email?: string;
  phone?: string;
}

export const ActionSelector: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrCode = searchParams.get('qr');

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!qrCode) {
      setError('Código QR no proporcionado');
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/cashier/scan/${qrCode}`);
        setUser(data);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Usuario no encontrado');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [qrCode]);

  if (loading) {
    return (
      <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Buscando usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md animate-scale-in">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 text-center mb-2">
              Usuario no encontrado
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
              {error || 'El código QR no es válido'}
            </p>
            <Button
              onClick={() => navigate('/cashier/scan')}
              variant="primary"
              className="w-full"
            >
              Volver a Escanear
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold  dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            Seleccionar Acción 👤
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Elige qué operación realizar
          </p>
        </div>

        {/* Perfil Premium del Cliente */}
        <Card variant="elevated" className="animate-fade-in">
          <CardHeader borderBottom>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg  dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <User className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>Usuario conectado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Main Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Empresa</p>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{user.company}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Empleado #</p>
                </div>
                <p className="font-mono font-semibold text-slate-900 dark:text-slate-50">{user.employeeNumber}</p>
              </div>
            </div>

            {/* Balance Highlight */}
            <div className="p-6  dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium uppercase mb-1">Saldo Disponible</p>
                  <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(user.balance).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-emerald-400 opacity-20" />
              </div>
            </div>

            {/* Contact Info (if available) */}
            {(user.email || user.phone) && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                {user.email && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                )}
                {user.phone && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Teléfono:</span> {user.phone}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opciones de Acción - Premium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pago/Cobro */}
          <Card
            variant="interactive"
            className="cursor-pointer h-full animate-fade-in"
            onClick={() => navigate(`/cashier/charge?qr=${encodeURIComponent(qrCode!)}`)}
          >
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-xl  dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-50">Cobro</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Procesar pago de compra en el comedor
                  </p>
                </div>
                <div className="pt-2 mt-auto">
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                    Débito de saldo
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recarga */}
          <Card
            variant="interactive"
            className="cursor-pointer h-full animate-fade-in"
            style={{ animationDelay: '100ms' }}
            onClick={() => navigate(`/cashier/recharge?qr=${encodeURIComponent(qrCode!)}`)}
          >
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-xl  dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-50">Recarga</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Recargar saldo en efectivo
                  </p>
                </div>
                <div className="pt-2 mt-auto">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                    Crédito de saldo
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botón Volver */}
        <Button
          onClick={() => navigate('/cashier/scan')}
          variant="outline"
          className="w-full"
        >
          ← Volver a Escanear
        </Button>
      </div>
    </div>
  );
};
