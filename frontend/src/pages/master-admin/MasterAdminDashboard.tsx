import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Lock, Unlock, DollarSign, AlertCircle, Building2, TrendingUp, Users, Zap, BarChart3 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
  contactPerson?: string;
  totalBranches: number;
  planName: string;
  subscriptionStatus: string;
  subscriptionEnd?: string;
  isBlocked: boolean;
  blockReason?: string;
  branches: Array<{ id: string; name: string; isBlocked: boolean }>;
}

interface PaymentInfo {
  totalCollected: number;
  totalPayments: number;
  potentialMonthlyRevenue: number;
  activeCompanies: number;
  blockedCompanies: number;
}

export const MasterAdminDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [companiesRes, revenueRes, overdueRes] = await Promise.all([
        api.get('/master-admin/companies'),
        api.get('/master-admin/report/revenue'),
        api.get('/master-admin/report/overdue')
      ]);

      setCompanies(companiesRes.data);
      setPayment(revenueRes.data);
      setOverdue(overdueRes.data.companies);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockCompany = async (companyId: string) => {
    try {
      await api.post(`/master-admin/companies/${companyId}/block`, { reason: blockReason });
      setBlockReason('');
      setSelectedCompany(null);
      fetchData();
      alert('Empresa y sucursales bloqueadas');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleUnblockCompany = async (companyId: string) => {
    try {
      await api.post(`/master-admin/companies/${companyId}/unblock`);
      fetchData();
      alert('Empresa desbloqueada');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleAddPayment = async (companyId: string) => {
    try {
      await api.post(`/master-admin/companies/${companyId}/payment`, {
        amount: paymentAmount,
        description: 'Pago de suscripción',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              Panel Master Admin
            </h1>
          </div>
          <p className="text-base text-slate-600 dark:text-slate-400 ml-12">
            Gestión centralizada de empresas, licencias y pagos
          </p>
        </div>

        {/* Revenue Stats */}
        {payment && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-3">
                      ${payment.totalCollected.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Total recaudado</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Potencial Mensual</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-3">
                      ${payment.potentialMonthlyRevenue.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Ingresos esperados</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresas Activas</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-3">
                      {payment.activeCompanies}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Con suscripción activa</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-600 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresas Bloqueadas</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-3">
                      {payment.blockedCompanies}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Requieren acción</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
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
                  {overdue.length} Suscripciones Vencidas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {overdue.map((company) => (
                  <div key={company.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{company.name}</p>
                      <p className="text-sm text-red-600">{company.daysOverdue} días vencido</p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-slate-50">
                      Plan: {company.planName}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Companies List */}
        <Card>
          <CardHeader borderBottom>
            <CardTitle>Empresas ({companies.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold">Empresa</th>
                    <th className="text-left py-3 px-4 font-semibold">Plan</th>
                    <th className="text-center py-3 px-4 font-semibold">Sucursales</th>
                    <th className="text-left py-3 px-4 font-semibold">Suscripción</th>
                    <th className="text-center py-3 px-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className={`border-b border-slate-200 dark:border-slate-700 ${
                      company.isBlocked ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-50 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {company.name}
                          </p>
                          <p className="text-xs text-slate-500">{company.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          {company.planName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-900 dark:text-slate-50">
                          {company.totalBranches}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          company.isBlocked
                            ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                            : company.subscriptionStatus === 'ACTIVE'
                            ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                        }`}>
                          {company.isBlocked ? 'BLOQUEADA' : company.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {company.isBlocked ? (
                            <Button
                              onClick={() => handleUnblockCompany(company.id)}
                              size="sm"
                              className="px-3 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => setSelectedCompany(company)}
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
                                handleAddPayment(company.id);
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
        {selectedCompany && (
          <Card>
            <CardHeader borderBottom>
              <CardTitle>Bloquear Empresa: {selectedCompany.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Motivo del bloqueo</Label>
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="ej: Falta de pago - Suscripción vencida"
                  className="mt-2 text-slate-900 dark:text-slate-50"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleBlockCompany(selectedCompany.id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Bloquear Empresa
                </Button>
                <Button variant="outline" onClick={() => setSelectedCompany(null)}>
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
