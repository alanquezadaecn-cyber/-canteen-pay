import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { usePanelBase } from '../../hooks/usePanelBase';
import { AlertCircle, CheckCircle, ArrowLeft, DollarSign } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  company: string;
  employeeNumber: string;
  phone: string;
  role: string;
  balance: string;
  isActive: boolean;
  createdAt: string;
  transactions: any[];
}

export const UserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = usePanelBase();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceForm, setBalanceForm] = useState({
    type: 'ADD',
    amount: '',
    reason: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', employeeNumber: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = () => {
    if (!user) return;
    setEditForm({ name: user.name, email: user.email, phone: user.phone, employeeNumber: user.employeeNumber });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setError('');
    try {
      const { data } = await api.put(`/admin/users/${id}`, editForm);
      setUser(user ? { ...user, ...data } : null);
      setSuccess('Datos actualizados correctamente');
      setShowEditModal(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const { data } = await api.get(`/admin/users/${id}`);
        setUser(data);
      } catch (err) {
        setError('Usuario no encontrado');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amountNum = parseFloat(balanceForm.amount);
    if (!amountNum || amountNum <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    if (!balanceForm.reason.trim()) {
      setError('Ingresa un motivo');
      return;
    }

    try {
      const { data } = await api.put(`/admin/users/${id}/balance`, {
        amount: amountNum,
        type: balanceForm.type,
        reason: balanceForm.reason
      });

      setUser(user ? { ...user, balance: data.newBalance } : null);
      setSuccess(`Saldo ajustado exitosamente. Nuevo saldo: $${data.newBalance}`);
      setShowBalanceModal(false);
      setBalanceForm({ type: 'ADD', amount: '', reason: '' });

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al ajustar saldo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p>Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center p-4">
        <Card className="bg-white max-w-md w-full">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
              Usuario no encontrado
            </h2>
            <p className="text-slate-600 text-center mb-6">
              {error || 'El usuario que buscas no existe'}
            </p>
            <Button
              onClick={() => navigate(`${base}/users`)}
              className="w-full"
            >
              Volver a Usuarios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <Button
          onClick={() => navigate(`${base}/users`)}
          variant="outline"
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Perfil */}
        <Card className="mb-8 bg-violet-600 text-white border-0">
          <CardContent className="pt-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold">{user.name}</h2>
                <p className="text-slate-300 mt-2">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  user.isActive
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'bg-red-500/20 text-red-200'
                }`}>
                  {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                </span>
                <button
                  onClick={openEdit}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  Editar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-700">
              <div>
                <p className="text-xs text-slate-400">Empresa</p>
                <p className="font-semibold text-white mt-1">{user.company}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Empleado #</p>
                <p className="font-semibold text-white mt-1">{user.employeeNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Teléfono</p>
                <p className="font-semibold text-white mt-1">{user.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Rol</p>
                <p className="font-semibold text-white mt-1">{user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saldo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card className="md:col-span-1 bg-emerald-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-900 text-lg">Saldo Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-emerald-600">
                ${parseFloat(user.balance).toFixed(2)}
              </p>
              <Button
                onClick={() => setShowBalanceModal(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700"
              >
                <DollarSign className="w-4 h-4" />
                Ajustar Saldo
              </Button>
            </CardContent>
          </Card>

          {/* Modal de Editar Datos */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Editar datos de {user.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <Label className="mb-1 block">Nombre</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="text-slate-900 dark:text-slate-50" />
                    </div>
                    <div>
                      <Label className="mb-1 block">Email</Label>
                      <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="text-slate-900 dark:text-slate-50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block"># Empleado</Label>
                        <Input value={editForm.employeeNumber} onChange={(e) => setEditForm({ ...editForm, employeeNumber: e.target.value })} className="text-slate-900 dark:text-slate-50" />
                      </div>
                      <div>
                        <Label className="mb-1 block">Teléfono</Label>
                        <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="text-slate-900 dark:text-slate-50" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button type="submit" disabled={savingEdit} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                        {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Modal de Ajuste */}
          {showBalanceModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Ajustar Saldo de {user.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBalanceAdjustment} className="space-y-4">
                    <div>
                      <Label htmlFor="type" className="mb-2 block">
                        Tipo
                      </Label>
                      <select
                        id="type"
                        value={balanceForm.type}
                        onChange={(e) =>
                          setBalanceForm({ ...balanceForm, type: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="ADD">Agregar</option>
                        <option value="SUBTRACT">Restar</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="amount" className="mb-2 block">
                        Monto ($)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={balanceForm.amount}
                        onChange={(e) =>
                          setBalanceForm({ ...balanceForm, amount: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="reason" className="mb-2 block">
                        Motivo
                      </Label>
                      <Input
                        id="reason"
                        type="text"
                        placeholder="Ej: Reembolso, Error anterior..."
                        value={balanceForm.reason}
                        onChange={(e) =>
                          setBalanceForm({ ...balanceForm, reason: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowBalanceModal(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-violet-600 hover:bg-violet-700"
                      >
                        Confirmar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Estadísticas */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Transacciones</span>
                <span className="font-semibold text-slate-900">
                  {user.transactions?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Compras</span>
                <span className="font-semibold text-red-600">
                  {user.transactions?.filter(t => t.type === 'PURCHASE').length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Recargas</span>
                <span className="font-semibold text-emerald-600">
                  {user.transactions?.filter(t => t.type === 'RECHARGE').length || 0}
                </span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="text-slate-600">Miembro desde</span>
                <span className="font-semibold text-slate-900">
                  {new Date(user.createdAt).toLocaleDateString('es-MX')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transacciones */}
        {user.transactions && user.transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Últimas Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-4 font-semibold">Fecha</th>
                      <th className="text-left py-2 px-4 font-semibold">Tipo</th>
                      <th className="text-right py-2 px-4 font-semibold">Monto</th>
                      <th className="text-right py-2 px-4 font-semibold">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.transactions.slice(0, 10).map((tx, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-4 text-sm">
                          {new Date(tx.createdAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'PURCHASE' ? 'bg-red-100 text-red-800' :
                            tx.type === 'RECHARGE' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-2 px-4 text-right font-semibold ${
                          tx.type === 'PURCHASE' ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {tx.type === 'PURCHASE' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          ${parseFloat(tx.balanceAfter).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
