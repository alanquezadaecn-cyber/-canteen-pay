import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Lock, Unlock, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location?: string;
  status: string;
  users: number;
  cashiers: number;
  monthlyFee: string;
  isBlocked: boolean;
  blockReason?: string;
  nextPaymentDate?: string;
}

interface PaymentInfo {
  totalCollected: string;
  totalPayments: number;
  potentialMonthlyRevenue: string;
  activeBranches: number;
}

export const MasterAdminDashboard: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchesRes, revenueRes, overdueRes] = await Promise.all([
        api.get('/master-admin/branches'),
        api.get('/master-admin/report/revenue'),
        api.get('/master-admin/report/overdue')
      ]);

      setBranches(branchesRes.data);
      setPayment(revenueRes.data);
      setOverdue(overdueRes.data.branches);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockBranch = async (branchId: string) => {
    try {
      await api.post(`/master-admin/${branchId}/block`, { reason: blockReason });
      setBlockReason('');
      setSelectedBranch(null);
      fetchData();
      alert('Sucursal bloqueada');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleUnblockBranch = async (branchId: string) => {
    try {
      await api.post(`/master-admin/${branchId}/unblock`);
      fetchData();
      alert('Sucursal desbloqueada');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleAddPayment = async (branchId: string) => {
    try {
      await api.post(`/master-admin/${branchId}/payment`, {
        amount: paymentAmount,
        description: 'Pago manual',
        status: 'PAID'
      });
      setPaymentAmount('');
      fetchData();
      alert('Pago registrado');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Master Admin
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Control de Licencias y Sucursales
          </p>
        </div>

        {/* Revenue Stats */}
        {payment && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">INGRESOS TOTALES</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                      ${payment.totalCollected}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">POTENCIAL MENSUAL</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    ${payment.potentialMonthlyRevenue}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">SUCURSALES ACTIVAS</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    {payment.activeBranches}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">PAGOS PROCESADOS</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                    {payment.totalPayments}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Overdue Warning */}
        {overdue.length > 0 && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardHeader borderBottom>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-800 dark:text-red-200">
                  {overdue.length} Sucursales Vencidas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {overdue.map((branch) => (
                  <div key={branch.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{branch.name}</p>
                      <p className="text-sm text-red-600">{branch.daysOverdue} días vencido</p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-slate-50">
                      ${branch.monthlyFee}/mes
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branches List */}
        <Card>
          <CardHeader borderBottom>
            <CardTitle>Sucursales ({branches.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold">Estado</th>
                    <th className="text-right py-3 px-4 font-semibold">Usuarios</th>
                    <th className="text-right py-3 px-4 font-semibold">Cuota Mensual</th>
                    <th className="text-center py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className={`border-b border-slate-200 dark:border-slate-700 ${
                      branch.isBlocked ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-50">{branch.name}</p>
                          {branch.location && <p className="text-xs text-slate-500">{branch.location}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          branch.isBlocked
                            ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                            : branch.status === 'ACTIVE'
                            ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                        }`}>
                          {branch.isBlocked ? 'BLOQUEADA' : branch.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{branch.users}</td>
                      <td className="py-3 px-4 text-right font-bold">${branch.monthlyFee}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {branch.isBlocked ? (
                            <Button
                              onClick={() => handleUnblockBranch(branch.id)}
                              size="sm"
                              className="px-3 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setSelectedBranch(branch)}
                              size="sm"
                              className="px-3 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              const amount = prompt('Monto del pago:');
                              if (amount) {
                                setPaymentAmount(amount);
                                handleAddPayment(branch.id);
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="px-3"
                          >
                            💰
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Block Modal */}
        {selectedBranch && (
          <Card>
            <CardHeader borderBottom>
              <CardTitle>Bloquear Sucursal: {selectedBranch.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Motivo del bloqueo</Label>
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="ej: Falta de pago"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBlockBranch(selectedBranch.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Bloquear
                </Button>
                <Button variant="outline" onClick={() => setSelectedBranch(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
