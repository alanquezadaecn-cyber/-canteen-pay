import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { AlertCircle, CheckCircle, ArrowRight, User as UserIcon, TrendingDown, Briefcase } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  company: string;
  employeeNumber: string;
  phone: string;
  balance: string;
  isActive: boolean;
}

interface SuccessData {
  success: boolean;
  transaction: {
    id: string;
    amount: string;
    type: string;
  };
  newBalance: string;
  userName: string;
}

export const ChargeUser: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qrCode = searchParams.get('qr');

  const [user, setUser] = useState<UserData | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<SuccessData | null>(null);

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
        setError(err.response?.data?.error || 'Error al buscar usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [qrCode]);

  const newBalance = user && amount
    ? (parseFloat(user.balance) - parseFloat(amount)).toFixed(2)
    : user?.balance;

  const handleCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    if (amountNum > parseFloat(user?.balance || '0')) {
      setError('Saldo insuficiente');
      return;
    }

    setCharging(true);
    try {
      const { data } = await api.post('/cashier/charge', {
        qrCode,
        amount: amountNum
      });

      setSuccess(data);
      setTimeout(() => {
        navigate('/cashier/scan');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar pago');
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Buscando usuario...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md text-center animate-scale-in">
          <CardContent className="pt-12 pb-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-50 mb-2">
              ¡Pago Procesado!
            </h2>
            <p className="text-emerald-700 dark:text-emerald-300 mb-8">
              Transacción exitosa para {success.userName}
            </p>

            <div className="space-y-3 mb-8">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-800 dark:text-emerald-300">Monto cobrado:</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                    ${parseFloat(success.transaction.amount).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-emerald-300 dark:border-emerald-700 pt-2 flex justify-between text-sm">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">Nuevo saldo:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-200">
                    ${parseFloat(success.newBalance).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-6 animate-pulse">
              Redirigiendo al scanner en 3 segundos...
            </p>

            <Button
              onClick={() => navigate('/cashier/scan')}
              variant="primary"
              className="w-full  hover:from-emerald-600 hover:to-teal-600"
            >
              Volver a Escanear
            </Button>
          </CardContent>
        </Card>
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
              {error || 'No se pudo localizar el usuario con este QR'}
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Procesar Pago 💰
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Cobrar por compra en el comedor
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Datos del Usuario - Premium Card */}
        <Card variant="elevated" className="animate-fade-in">
          <CardHeader borderBottom>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>Usuario encontrado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Empresa</p>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{user.company}</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2">Empleado #</p>
                <p className="font-mono font-semibold text-slate-900 dark:text-slate-50">{user.employeeNumber}</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400">
              <p><span className="font-medium">Email:</span> {user.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Saldo - Premium Highlight */}
        <Card variant="flat" className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-1">Saldo Disponible</p>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${parseFloat(user.balance).toFixed(2)}
                </p>
              </div>
              {!user.isActive && (
                <div className="text-right">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                    ⚠️ Usuario inactivo
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Pago */}
        <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader borderBottom>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle>Ingresa el Monto a Cobrar</CardTitle>
                <CardDescription>Deduce del saldo del usuario</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCharge} className="space-y-6">
              <div>
                <Label htmlFor="amount" className="mb-2 block font-medium text-slate-700 dark:text-slate-300">
                  Monto ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={user.balance}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg"
                  disabled={charging}
                  autoFocus
                />
              </div>

              {/* Preview */}
              {amount && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2 animate-scale-in">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Saldo actual:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      ${parseFloat(user.balance).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Monto a cobrar:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -${parseFloat(amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-red-200 dark:border-red-800 pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">Nuevo saldo:</span>
                    <span className={`font-bold ${
                      parseFloat(newBalance || '0') < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      ${newBalance}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/cashier/scan')}
                  disabled={charging}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    charging ||
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    parseFloat(amount) > parseFloat(user.balance)
                  }
                  className="flex-1  hover:from-red-600 hover:to-orange-600 text-white flex items-center justify-center gap-2"
                >
                  {charging ? 'Procesando...' : 'Confirmar Pago'}
                  {!charging && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
