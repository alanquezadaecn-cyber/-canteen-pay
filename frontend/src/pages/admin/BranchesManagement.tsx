import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Building2, Plus, Edit2, Trash2, CheckCircle, AlertCircle, MapPin, Users, DollarSign } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location: string;
  address?: string;
  phone?: string;
  active: boolean;
  managerId?: string;
  managerName?: string;
  totalUsers?: number;
  totalBalance?: string;
  createdAt: string;
}

export const BranchesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/admin/branches');
      setBranches(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching branches:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.location.trim()) {
      setError('Nombre y ubicación son requeridos');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/admin/branches/${editingId}`, formData);
        setSuccess('Sucursal actualizada exitosamente');
      } else {
        await api.post('/admin/branches', formData);
        setSuccess('Sucursal creada exitosamente');
      }

      setFormData({ name: '', location: '', address: '', phone: '' });
      setEditingId(null);
      setShowForm(false);
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar sucursal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro que deseas eliminar esta sucursal?')) return;

    try {
      await api.delete(`/admin/branches/${id}`);
      setSuccess('Sucursal eliminada exitosamente');
      fetchBranches();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al eliminar sucursal');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      location: branch.location,
      address: branch.address || '',
      phone: branch.phone || ''
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold  dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Gestión de Sucursales 🏢
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Administra todas las sucursales del sistema
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', location: '', address: '', phone: '' });
              setShowForm(!showForm);
            }}
            variant="primary"
            className="flex items-center gap-2  hover:from-violet-600 hover:to-purple-600"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Nueva Sucursal
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <Card variant="elevated" className="animate-fade-in">
            <CardHeader borderBottom>
              <CardTitle>
                {editingId ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="mb-2 block font-medium">
                      Nombre Sucursal
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="ej: Sucursal Centro"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="mb-2 block font-medium">
                      Ubicación
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="ej: Centro de la Ciudad"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="mb-2 block font-medium">
                      Dirección
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Dirección completa"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="mb-2 block font-medium">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Teléfono de contacto"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1  hover:from-violet-600 hover:to-purple-600"
                  >
                    {editingId ? 'Actualizar' : 'Crear'} Sucursal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Branches Grid */}
        {branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch, idx) => (
              <Card
                key={branch.id}
                variant="interactive"
                className="animate-fade-in h-full"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CardHeader borderBottom>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg  dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                        <Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {branch.location}
                        </CardDescription>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      branch.active
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {branch.active ? 'Activa' : 'Inactiva'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    {branch.address && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Dirección:</span> {branch.address}
                      </p>
                    )}
                    {branch.phone && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Teléfono:</span> {branch.phone}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    {branch.totalUsers !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Usuarios
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          {branch.totalUsers}
                        </span>
                      </div>
                    )}
                    {branch.totalBalance && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Saldo
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                          ${branch.totalBalance}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(branch)}
                      className="flex-1 flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(branch.id)}
                      className="flex-1 flex items-center justify-center gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="default">
            <CardContent className="pt-12 pb-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">No hay sucursales creadas</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Crea la primera sucursal para comenzar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
