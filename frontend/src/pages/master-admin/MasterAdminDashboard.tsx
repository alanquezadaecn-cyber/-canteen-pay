import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Lock, Unlock, DollarSign, AlertCircle, Building2, TrendingUp, Zap, Edit3, MapPin, CreditCard, Mail, Plus, Trash2 } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  industry?: string;
  contactPerson?: string;
  paymentEmail?: string;
  totalBranches: number;
  planName: string;
  subscriptionStatus: string;
  subscriptionEnd?: string;
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
  branches: Array<{ id: string; name: string; location: string }>;
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
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
      setOverdue(overdueRes.data.companies || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditingCompany({ ...company });
    setShowEditModal(true);
  };

  const handleSaveCompany = async () => {
    if (!selectedCompany || !editingCompany) return;
    try {
      await api.put(`/master-admin/companies/${selectedCompany.id}`, editingCompany);
      fetchData();
      setShowEditModal(false);
      setEditingCompany(null);
      alert('Empresa actualizada correctamente');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar');
    }
  };

  const handleBlockCompany = async (company: Company) => {
    setSelectedCompany(company);
    try {
      await api.post(`/master-admin/companies/${company.id}/block`, { reason: blockReason || 'Sin especificar' });
      setBlockReason('');
      fetchData();
      alert('Empresa bloqueada');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleUnblockCompany = async (company: Company) => {
    try {
      await api.post(`/master-admin/companies/${company.id}/unblock`);
      fetchData();
      alert('Empresa desbloqueada');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleAddPayment = async (company: Company) => {
    if (!paymentAmount) {
      alert('Ingresa el monto');
      return;
    }
    try {
      await api.post(`/master-admin/companies/${company.id}/payment`, {
        amount: paymentAmount,
        description: 'Pago realizado',
        status: 'PAID'
      });
      setPaymentAmount('');
      setShowPaymentModal(false);
      fetchData();
      alert('Pago registrado correctamente');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Cargando datos...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Premium */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50">
                Panel Master Admin
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
                Gestión centralizada de empresas, licencias, facturación y ubicaciones
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid Pro */}
        {payment && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-4">${payment.totalCollected.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-2">Total recaudado</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Potencial Mensual</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-4">${payment.potentialMonthlyRevenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-2">Ingresos esperados</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresas Activas</p>
                    <p className="text-4xl font-bold text-slate-900 dark:text-slate-50 mt-4">{payment.activeCompanies}</p>
                    <p className="text-xs text-slate-500 mt-2">Con suscripción activa</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-600 hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresas Bloqueadas</p>
                    <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-4">{payment.blockedCompanies}</p>
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

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <Card className="border-l-4 border-l-red-600 bg-red-50 dark:bg-red-900/20">
            <CardHeader borderBottom>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-800 dark:text-red-200">
                  ⚠️ {overdue.length} Suscripciones Vencidas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {overdue.map((company) => (
                  <div key={company.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{company.name}</p>
                      <p className="text-sm text-red-600">Vencido hace {company.daysOverdue} días</p>
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Procesar Pago
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empresas Table - Pro */}
        <Card>
          <CardHeader borderBottom>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Empresas ({companies.length})</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Gestión completa de datos, facturación y ubicaciones</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-4 px-4 font-semibold text-slate-900 dark:text-slate-50">Empresa</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-900 dark:text-slate-50">Plan</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900 dark:text-slate-50">Sucursales</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-900 dark:text-slate-50">Estado</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-900 dark:text-slate-50">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      company.isBlocked ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-50">{company.name}</p>
                            <p className="text-xs text-slate-500">{company.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{company.planName}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <MapPin className="w-4 h-4" />
                          <span className="font-semibold">{company.totalBranches}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-lg ${
                          company.isBlocked
                            ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                            : company.subscriptionStatus === 'ACTIVE'
                            ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                        }`}>
                          {company.isBlocked ? '🔒 BLOQUEADA' : company.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button
                            onClick={() => { setSelectedCompany(company); handleEditCompany(company); }}
                            size="sm"
                            className="px-3 bg-blue-600 hover:bg-blue-700 text-white"
                            title="Editar empresa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => { setSelectedCompany(company); setShowPaymentModal(true); }}
                            size="sm"
                            className="px-3 bg-green-600 hover:bg-green-700 text-white"
                            title="Registrar pago"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                          {company.isBlocked ? (
                            <Button
                              onClick={() => handleUnblockCompany(company)}
                              size="sm"
                              className="px-3 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleBlockCompany(company)}
                              size="sm"
                              className="px-3 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Company Modal */}
        {showEditModal && selectedCompany && editingCompany && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <CardHeader borderBottom className="sticky top-0 bg-white dark:bg-slate-800">
                <CardTitle>Editar Empresa: {selectedCompany.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">

                {/* Datos Generales */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Datos Generales
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre Empresa</Label>
                      <Input
                        value={editingCompany.name || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                        className="mt-2 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <Label>Industria</Label>
                      <Input
                        value={editingCompany.industry || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })}
                        className="mt-2 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacto */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Principal</Label>
                      <Input
                        type="email"
                        value={editingCompany.email || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                        className="mt-2 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <Label>Email de Facturación</Label>
                      <Input
                        type="email"
                        value={editingCompany.paymentEmail || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, paymentEmail: e.target.value })}
                        className="mt-2 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Persona de Contacto</Label>
                      <Input
                        value={editingCompany.contactPerson || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, contactPerson: e.target.value })}
                        className="mt-2 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        value={editingCompany.phone || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                        className="mt-2 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Sucursales */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Sucursales ({editingCompany.branches?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {editingCompany.branches?.map((branch, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50">{branch.name}</p>
                          <p className="text-sm text-slate-500">{branch.location}</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-300 dark:hover:bg-slate-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Sucursal
                  </Button>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={handleSaveCompany}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Guardar Cambios
                  </Button>
                  <Button
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedCompany && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl">
              <CardHeader borderBottom>
                <CardTitle>Registrar Pago - {selectedCompany.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-2 text-slate-900 dark:text-slate-50"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={() => handleAddPayment(selectedCompany)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Procesar Pago
                  </Button>
                  <Button
                    onClick={() => setShowPaymentModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
