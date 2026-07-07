import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Plus, Edit2, Trash2, ChevronRight, Building2, Users, Zap, Link2, Copy, Check, X } from 'lucide-react';

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
  const [linkModal, setLinkModal] = useState<Branch | null>(null);
  const [copied, setCopied] = useState(false);

  const getRegisterUrl = (branchId: string) =>
    `${window.location.origin}/register/${branchId}`;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = (branch: Branch) => {
    const url = getRegisterUrl(branch.id);
    const text = `Regístrate en el comedor *${branch.name}* para pagar con tu monedero digital:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
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
                    onClick={() => { setLinkModal(branch); setCopied(false); }}
                    variant="outline"
                    size="sm"
                    className="px-3"
                    title="Link de registro para comensales"
                  >
                    <Link2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
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

      {/* Modal link de registro */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 p-6">

            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Link de registro</h2>
              <button onClick={() => setLinkModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Comparte este link para que los comensales de <strong>{linkModal.name}</strong> se registren solos.
            </p>

            {/* URL box */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
              <p className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                {getRegisterUrl(linkModal.id)}
              </p>
              <button
                onClick={() => handleCopy(getRegisterUrl(linkModal.id))}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              </button>
            </div>

            {copied && (
              <p className="text-xs text-center text-slate-600 dark:text-slate-400 mb-4">Link copiado al portapapeles</p>
            )}

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCopy(getRegisterUrl(linkModal.id))}
                className="h-11 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copiar link
              </button>
              <button
                onClick={() => handleWhatsApp(linkModal)}
                className="h-11 rounded-xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {/* WhatsApp icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">
              El comensal se registra, elige su comedor y queda listo para usar el monedero.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
