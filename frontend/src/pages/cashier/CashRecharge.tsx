import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { AlertCircle, CheckCircle, DollarSign, Search, TrendingUp, Briefcase } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  company: string;
  employeeNumber: string;
  balance: string;
  email?: string;
}

interface SuccessData {
  success: boolean;
  newBalance: string;
  userName: string;
}

export const CashRecharge: React.FC = () => {
  const navigate = useNavigate();
  const [qrOrCode, setQrOrCode] = useState('');
  const [amount, setAmount] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUser(null);
    setLoading(true);

    try {
      const { data } = await api.get(`/cashier/scan/${qrOrCode}`);
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Usuario no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setCharging(true);
    try {
      const { data } = await api.post('/cashier/recharge', {
        qrCode: qrOrCode,
        amount: amountNum
      });

      setSuccess(data);
      setQrOrCode('');
      setAmount('');
      setUser(null);

      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar recarga');
    } finally {
      setCharging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Recargar Saldo
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Registra recargas en efectivo de usuarios
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-start gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">¡Recarga Completada!</p>
              <p className="text-sm mt-1">
                {success.userName} - Nuevo saldo: ${parseFloat(success.newBalance).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Búsqueda - Premium Card */}
        {!user && (
          <Card variant="elevated" className="animate-fade-in">
            <CardHeader borderBottom>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg  dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                  <Search className="w-5 h-5 text-slate-700 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Buscar Usuario</CardTitle>
                  <CardDescription>Escanea o ingresa código QR</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="search" className="mb-2 block font-medium text-slate-700 dark:text-slate-300">
                    Código QR o Número de Empleado
                  </Label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Escanea o ingresa el QR..."
                    value={qrOrCode}
                    onChange={(e) => setQrOrCode(e.target.value)}
                    disabled={loading}
                    autoFocus
                    className="text-base"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !qrOrCode.trim()}
                  variant="primary"
                  className="w-full  hover:from-blue-600 hover:to-cyan-600"
                  size="lg"
                >
                  {loading ? 'Buscando...' : 'Buscar Usuario'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Datos del Usuario - Premium Display */}
        {user && (
          <>
            <Card variant="elevated" className="animate-fade-in border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
              <CardHeader borderBottom className=" dark:from-emerald-900/20 dark:to-teal-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg  dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">Usuario Encontrado</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {user.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-1">Saldo Actual</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${parseFloat(user.balance).toFixed(2)}
                    </p>
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
              </CardContent>
            </Card>

            {/* Formulario de Recarga */}
            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader borderBottom>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg  dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle>Monto a Recargar</CardTitle>
                    <CardDescription>En efectivo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleRecharge} className="space-y-6">
                  <div>
                    <Label htmlFor="amount" className="mb-2 block font-medium text-slate-700 dark:text-slate-300">
                      Cantidad ($)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
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
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 space-y-2 animate-scale-in">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Saldo actual:</span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">
                          ${parseFloat(user.balance).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Monto a recargar:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          +${parseFloat(amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-emerald-200 dark:border-emerald-800 pt-2 flex justify-between text-sm">
                        <span className="font-semibold text-slate-900 dark:text-slate-50">Nuevo saldo:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ${(parseFloat(user.balance) + parseFloat(amount)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUser(null);
                        setQrOrCode('');
                        setAmount('');
                        setError('');
                      }}
                      disabled={charging}
                      className="flex-1"
                    >
                      Limpiar
                    </Button>
                    <Button
                      type="submit"
                      disabled={charging || !amount || parseFloat(amount) <= 0}
                      className="flex-1  hover:from-emerald-600 hover:to-teal-600 text-white"
                      size="lg"
                    >
                      {charging ? 'Procesando...' : 'Recargar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
