import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Lock, Unlock, DollarSign, AlertCircle, Building2, TrendingUp, Zap, Edit3, MapPin, CreditCard, Mail, Plus, Trash2, Copy, CheckCircle, RefreshCw, X, Link2, LogIn } from 'lucide-react';

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

  // Nueva empresa
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyResult, setNewCompanyResult] = useState<any>(null);
  const [newCompanyForm, setNewCompanyForm] = useState({
    companyName: '', email: '', phone: '', contactPerson: '',
    industry: '', planName: 'LICENCIA',
    branchName: 'Comedor Principal', branchLocation: 'Planta 1',
    adminPassword: ''
  });
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [newCompanyError, setNewCompanyError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [resetting, setResetting] = useState(false);
  const [urlsModal, setUrlsModal] = useState<Company | null>(null);
  const [copiedUrl, setCopiedUrl] = useState('');

  const APP_URL = window.location.origin;
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

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

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.companyName || !newCompanyForm.email || !newCompanyForm.adminPassword) {
      setNewCompanyError('Nombre, email y contraseña son requeridos');
      return;
    }
    setCreatingCompany(true);
    setNewCompanyError('');
    try {
      const { data } = await api.post('/master-admin/companies/create', newCompanyForm);
      setNewCompanyResult(data);
      fetchData();
    } catch (err: any) {
      setNewCompanyError(err.response?.data?.error || 'Error al crear empresa');
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleAccessPanel = async (company: Company) => {
    try {
      const { data } = await api.get(`/master-admin/companies/${company.id}/access-link`);
      const url = `${window.location.origin}/impersonate?t=${data.token}&to=${encodeURIComponent(data.redirectUrl)}`;
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al generar acceso');
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    if (!confirm(`¿Borrar "${company.name}" y todos sus datos? Esto no se puede deshacer.`)) return;
    try {
      await api.delete(`/master-admin/companies/${company.id}`);
      setCompanies(prev => prev.filter(c => c.id !== company.id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al borrar empresa');
    }
  };

  const handleResetTestData = async () => {
    if (!confirm('¿Confirmas que quieres borrar TODAS las empresas, sucursales, usuarios y transacciones? Esto no se puede deshacer.')) return;
    setResetting(true);
    try {
      await api.post('/master-admin/reset-test-data');
      setCompanies([]);
      setPayment(null);
      setOverdue([]);
      alert('Base de datos limpia. Lista para nuevas pruebas.');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al limpiar datos');
    } finally {
      setResetting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-600 dark:text-slate-400">Cargando datos...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 dark:bg-slate-100 rounded-xl flex-shrink-0">
                <Zap className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
                  Master Admin
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Empresas, sucursales y licencias
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetTestData}
                disabled={resetting}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Borrar todo
              </button>
              <button
                onClick={() => { setShowNewCompany(true); setNewCompanyResult(null); setNewCompanyError(''); }}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Empresa
              </button>
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
                            onClick={() => handleAccessPanel(company)}
                            size="sm"
                            className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                            title="Acceder al panel de admin"
                          >
                            <LogIn className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => { setCopiedUrl(''); setUrlsModal(company); }}
                            size="sm"
                            className="px-3 bg-slate-700 hover:bg-slate-600 text-white"
                            title="Ver URLs de acceso"
                          >
                            <Link2 className="w-4 h-4" />
                          </Button>
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
                          <Button
                            onClick={() => handleDeleteCompany(company)}
                            size="sm"
                            variant="outline"
                            className="px-3 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950"
                            title="Borrar empresa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* Modal: Nueva Empresa */}
        {showNewCompany && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full my-8 shadow-2xl border border-slate-200 dark:border-slate-700">

              {/* Resultado exitoso */}
              {newCompanyResult ? (
                <div className="p-6 space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-slate-900 dark:text-slate-50" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">¡Empresa creada!</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {newCompanyResult.company.name} — Plan {newCompanyResult.company.plan}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sucursal creada</p>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300">
                      <strong>{newCompanyResult.branch.name}</strong> — {newCompanyResult.branch.location}
                      <p className="text-xs text-slate-500 mt-1">ID: {newCompanyResult.branch.id}</p>
                    </div>

                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2">Credenciales de acceso</p>

                    {[newCompanyResult.credentials.admin, newCompanyResult.credentials.cashier].map((cred: any) => (
                      <div key={cred.role} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{cred.role}</p>
                        {[
                          { label: 'Email', value: cred.email },
                          { label: 'Contraseña', value: cred.password },
                          { label: 'URL', value: cred.branchUrl || cred.url }
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                              <p className="text-sm font-mono text-slate-900 dark:text-slate-50 break-all">{value}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(value, `${cred.role}-${label}`)}
                              className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-colors"
                            >
                              {copiedField === `${cred.role}-${label}`
                                ? <CheckCircle className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                                : <Copy className="w-3.5 h-3.5 text-slate-500" />
                              }
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Productos por defecto creados</p>
                      <div className="flex flex-wrap gap-1">
                        {newCompanyResult.defaultProducts?.map((p: string) => (
                          <span key={p} className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-400">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowNewCompany(false); setNewCompanyResult(null); }}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors"
                  >
                    Listo
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateCompany} className="p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nueva Empresa Cliente</h2>
                    <button type="button" onClick={() => setShowNewCompany(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {newCompanyError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm">
                      {newCompanyError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Nombre de la empresa *</label>
                      <Input value={newCompanyForm.companyName} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, companyName: e.target.value })} placeholder="Ej: Grupo Industrial ABC" className="text-slate-900 dark:text-slate-50" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Email del admin *</label>
                      <Input type="email" value={newCompanyForm.email} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, email: e.target.value })} placeholder="admin@empresa.com" className="text-slate-900 dark:text-slate-50" required />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Teléfono</label>
                      <Input value={newCompanyForm.phone} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, phone: e.target.value })} placeholder="+52 55 1234-5678" className="text-slate-900 dark:text-slate-50" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Persona de contacto</label>
                      <Input value={newCompanyForm.contactPerson} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, contactPerson: e.target.value })} placeholder="Juan Pérez" className="text-slate-900 dark:text-slate-50" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Industria</label>
                      <Input value={newCompanyForm.industry} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })} placeholder="Manufactura, Oficinas..." className="text-slate-900 dark:text-slate-50" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Plan *</label>
                      <select
                        value={newCompanyForm.planName}
                        onChange={(e) => setNewCompanyForm({ ...newCompanyForm, planName: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400"
                      >
                        <option value="LICENCIA">LICENCIA ANUAL — $30,000/año · 10 sucursales · soporte 3 meses</option>
                        <option value="PRO">PRO — $3,000/mes · 2 sucursales · soporte incluido</option>
                        <option value="ENTERPRISE">ENTERPRISE — $5,500/mes · 5 sucursales · soporte 24/7</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Nombre del comedor</label>
                      <Input value={newCompanyForm.branchName} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, branchName: e.target.value })} placeholder="Comedor Principal" className="text-slate-900 dark:text-slate-50" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Ubicación del comedor</label>
                      <Input value={newCompanyForm.branchLocation} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, branchLocation: e.target.value })} placeholder="Planta 1" className="text-slate-900 dark:text-slate-50" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Contraseña del admin *</label>
                      <Input type="password" value={newCompanyForm.adminPassword} onChange={(e) => setNewCompanyForm({ ...newCompanyForm, adminPassword: e.target.value })} placeholder="Mínimo 6 caracteres" className="text-slate-900 dark:text-slate-50" required />
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400">
                    Se crearán automáticamente: 1 sucursal, 1 usuario administrador, 1 cajero y 5 productos de ejemplo.
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={creatingCompany}
                      className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors disabled:opacity-40"
                    >
                      {creatingCompany ? 'Creando...' : 'Crear empresa'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCompany(false)}
                      className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:border-slate-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

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

      {/* Modal URLs de acceso */}
      {urlsModal && (() => {
        const slug = (urlsModal as any).slug || urlsModal.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const links = [
          {
            label: 'Admin',
            desc: 'Panel de administración de la empresa',
            url: `${APP_URL}/login/admin/${slug}`
          },
          ...((urlsModal.branches || []).map((b: any) => ({
            label: `Cajero / Comensal — ${b.name}`,
            desc: b.location || 'Sucursal',
            url: `${APP_URL}/login/${slug}/${b.slug || b.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
          }))),
          ...((urlsModal.branches || []).map((b: any) => ({
            label: `Registro comensales — ${b.name}`,
            desc: 'Link para que los comensales se registren',
            url: `${APP_URL}/register/${b.id}`
          })))
        ];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">URLs de acceso</h2>
                  <p className="text-sm text-slate-400">{urlsModal.name}</p>
                </div>
                <button onClick={() => setUrlsModal(null)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {links.map((link, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{link.label}</p>
                    <p className="text-xs text-slate-500 mb-2">{link.desc}</p>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-xs font-mono text-slate-300 break-all">{link.url}</p>
                      <button
                        onClick={() => copyUrl(link.url)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                      >
                        {copiedUrl === link.url
                          ? <CheckCircle className="w-4 h-4 text-white" />
                          : <Copy className="w-4 h-4 text-slate-400" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setUrlsModal(null)}
                className="w-full h-10 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
