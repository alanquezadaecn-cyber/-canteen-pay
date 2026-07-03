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
      <div className="p-4 md:p-8 space-y-8">

        {/* Clean Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            MealPay
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Gestión de Comedores
          </p>
        </div>

        {/* Sucursales Grid - Clean */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch, idx) => (
            <div
              key={branch.id}
              className="animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 h-full">

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                      {branch.name}
                    </h3>
                  </div>
                  {branch.location && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 ml-13">
                      📍 {branch.location}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Cajas</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                      {branch._count?.cashiers || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Usuarios</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                      {branch._count?.users || 0}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/admin/branches/${branch.id}`)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-50 dark:hover:bg-slate-200 dark:text-slate-900 font-semibold gap-2"
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
                    className="px-3"
                  >
                    <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Nueva Sucursal Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 flex items-center justify-center min-h-[250px] hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all group cursor-pointer" onClick={() => setShowNewBranch(!showNewBranch)}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 mx-auto flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                Nueva Sucursal
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Crear comedor
              </p>
            </div>
          </div>
        </div>

        {/* Crear/Editar Sucursal - Clean */}
        {(showNewBranch || editingBranch) && (
          <Card>
            <CardHeader borderBottom>
              <CardTitle className="text-2xl">
                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch} className="space-y-6">
                <div>
                  <Label htmlFor="branchName" className="text-sm font-semibold">Nombre de Sucursal *</Label>
                  <Input
                    id="branchName"
                    value={editingBranch ? editingBranch.name : newBranch.name}
                    onChange={(e) => editingBranch
                      ? setEditingBranch({ ...editingBranch, name: e.target.value })
                      : setNewBranch({ ...newBranch, name: e.target.value })
                    }
                    placeholder="ej: Centro, Playa, Norte"
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-semibold">Ubicación</Label>
                  <Input
                    id="location"
                    value={editingBranch ? editingBranch.location || '' : newBranch.location}
                    onChange={(e) => editingBranch
                      ? setEditingBranch({ ...editingBranch, location: e.target.value })
                      : setNewBranch({ ...newBranch, location: e.target.value })
                    }
                    placeholder="ej: Calle 5 de Mayo #123"
                    className="mt-2"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200">
                    {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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
