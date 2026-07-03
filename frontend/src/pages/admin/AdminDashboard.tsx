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

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-1">
              Administración de Sucursales
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gestiona tus comedores y cajas
            </p>
          </div>
        </div>

        {/* Sucursales Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                      {branch.name}
                    </h3>
                    {branch.location && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        📍 {branch.location}
                      </p>
                    )}
                  </div>
                  <Building2 className="w-5 h-5 text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Cajas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {branch._count?.cashiers || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Usuarios</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {branch._count?.users || 0}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/admin/branches/${branch.id}`)}
                    className="flex-1 flex items-center justify-center gap-2"
                    size="sm"
                  >
                    Entrar <ChevronRight className="w-4 h-4" />
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

          {/* Nueva Sucursal Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 flex items-center justify-center min-h-[250px]">
            <Button
              onClick={() => setShowNewBranch(!showNewBranch)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nueva Sucursal
            </Button>
          </div>
        </div>

        {/* Crear/Editar Sucursal */}
        {(showNewBranch || editingBranch) && (
          <Card>
            <CardHeader borderBottom>
              <CardTitle>
                {editingBranch ? 'Editar Sucursal' : 'Crear Nueva Sucursal'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={editingBranch ? handleUpdateBranch : handleCreateBranch} className="space-y-4">
                <div>
                  <Label htmlFor="branchName">Nombre de Sucursal *</Label>
                  <Input
                    id="branchName"
                    value={editingBranch ? editingBranch.name : newBranch.name}
                    onChange={(e) => editingBranch
                      ? setEditingBranch({ ...editingBranch, name: e.target.value })
                      : setNewBranch({ ...newBranch, name: e.target.value })
                    }
                    placeholder="ej: Centro, Playa, Norte"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={editingBranch ? editingBranch.location || '' : newBranch.location}
                    onChange={(e) => editingBranch
                      ? setEditingBranch({ ...editingBranch, location: e.target.value })
                      : setNewBranch({ ...newBranch, location: e.target.value })
                    }
                    placeholder="ej: Calle 5 de Mayo #123"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
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
