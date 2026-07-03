import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Plus, Edit2, Trash2, ChevronRight, Building2, Users, Zap } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location?: string;
  isActive: boolean;
  _count?: {
    cashiers: number;
    users: number;
  };
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', location: '' });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranch.name.trim()) return;

    try {
      await api.post('/branches', {
        name: newBranch.name.trim(),
        location: newBranch.location.trim() || null
      });

      setShowNewBranch(false);
      setNewBranch({ name: '', location: '' });
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear sucursal');
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editingBranch.name.trim()) return;

    try {
      await api.put(`/branches/${editingBranch.id}`, {
        name: editingBranch.name.trim(),
        location: editingBranch.location?.trim() || null
      });

      setEditingBranch(null);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar sucursal');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('¿Eliminar esta sucursal?')) return;

    try {
      await api.delete(`/branches/${id}`);
      fetchBranches();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar sucursal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">

        {/* Premium Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 rounded-2xl p-8 text-white shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              🏢 MealPay
            </h1>
            <p className="text-blue-50 text-lg">
              Gestión Premium de Comedores
            </p>
            <p className="text-sm text-blue-100 mt-4">
              Control total de sucursales, productos, usuarios y reportes
            </p>
          </div>
        </div>

        {/* Sucursales Grid - Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch, idx) => (
            <div
              key={branch.id}
              className="group relative animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Gradient Border Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-all duration-300 -z-10"></div>

              {/* Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 h-full">

                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                        {branch.name}
                      </h3>
                    </div>
                    {branch.location && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 ml-13">
                        📍 {branch.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700/30">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">CAJAS</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                      {branch._count?.cashiers || 0}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700/30">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">USUARIOS</p>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                      {branch._count?.users || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/admin/branches/${branch.id}`)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg gap-2"
                    size="sm"
                  >
                    Gestionar <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setEditingBranch(branch)}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteBranch(branch.id)}
                    variant="outline"
                    size="sm"
                    className="px-3 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Nueva Sucursal Card - Premium */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 flex items-center justify-center min-h-[250px] hover:border-purple-400 transition-colors group cursor-pointer" onClick={() => setShowNewBranch(!showNewBranch)}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                Nueva Sucursal
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Agregar un nuevo comedor
              </p>
            </div>
          </div>
        </div>

        {/* Crear/Editar Sucursal - Premium */}
        {(showNewBranch || editingBranch) && (
          <Card>
            <CardHeader borderBottom>
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-900 dark:to-pink-900 text-white p-6 rounded-t-xl -mx-6 -mt-6 mb-6">
                <CardTitle className="text-white text-2xl">
                  {editingBranch ? '✏️ Editar Sucursal' : '✨ Nueva Sucursal'}
                </CardTitle>
                <p className="text-purple-100 text-sm mt-2">
                  {editingBranch ? 'Actualiza los datos de la sucursal' : 'Agrega un nuevo comedor a tu red'}
                </p>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch} className="space-y-6">
                <div>
                  <Label htmlFor="branchName" className="text-base font-semibold">Nombre de Sucursal *</Label>
                  <Input
                    id="branchName"
                    value={editingBranch ? editingBranch.name : newBranch.name}
                    onChange={(e) => editingBranch
                      ? setEditingBranch({ ...editingBranch, name: e.target.value })
                      : setNewBranch({ ...newBranch, name: e.target.value })
                    }
                    placeholder="ej: Centro, Playa, Norte"
                    className="mt-2 h-12 text-base"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-base font-semibold">Ubicación</Label>
                  <Input
                    id="location"
                    value={editingBranch ? editingBranch.location || '' : newBranch.location}
                    onChange={(e) => editingBranch
                      ? setEditingBranch({ ...editingBranch, location: e.target.value })
                      : setNewBranch({ ...newBranch, location: e.target.value })
                    }
                    placeholder="ej: Calle 5 de Mayo #123"
                    className="mt-2 h-12 text-base"
                  />
                </div>
                <div className="flex gap-3 pt-6">
                  <Button type="submit" className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold">
                    {editingBranch ? '💾 Guardar Cambios' : '➕ Crear Sucursal'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => {
                      setShowNewBranch(false);
                      setEditingBranch(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
