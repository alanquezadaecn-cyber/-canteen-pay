import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { usePanelBase } from '../../hooks/usePanelBase';
import { useBranding } from '../../hooks/useBranding';
import { QRModal } from '../../components/QRModal';
import { BulkImportComensales } from '../../components/BulkImportComensales';
import api from '../../lib/api';
import { Search, Pencil, Check, X, Power, Users as UsersIcon, UserPlus, QrCode, Upload, ChefHat } from 'lucide-react';

interface Comensal {
  id: string;
  name: string;
  email: string;
  employeeNumber: string;
  phone: string;
  balance: string;
  qrCode: string;
  isActive: boolean;
  isStaff?: boolean;
  position?: string | null;
  photoUrl?: string | null;
}

export const CashierUsers: React.FC = () => {
  const navigate = useNavigate();
  const base = usePanelBase();
  const { user } = useAuthStore();
  const branding = useBranding();
  const branchId = user?.branchId || '';
  const hrEnabled = branding?.features?.hr !== false;

  const [tab, setTab] = useState<'COMENSAL' | 'STAFF'>('COMENSAL');
  const [users, setUsers] = useState<Comensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', employeeNumber: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qrUser, setQrUser] = useState<Comensal | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [limit, setLimit] = useState<{ max: number | null; used: number } | null>(null);

  useEffect(() => {
    if (!branchId) return;
    api.get(`/cashier/branch/${branchId}/limit`).then(r => setLimit(r.data)).catch(() => {});
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [branchId, search]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/cashier/branch/${branchId}/users?search=${encodeURIComponent(search)}`);
      setUsers(data);
    } catch {
      setError('Error al cargar comensales');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u: Comensal) => {
    setEditingId(u.id);
    setForm({ name: u.name, phone: u.phone, email: u.email, employeeNumber: u.employeeNumber });
    setError('');
  };

  const save = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/cashier/branch/${branchId}/users/${id}`, form);
      setEditingId(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: Comensal) => {
    try {
      await api.put(`/cashier/branch/${branchId}/users/${u.id}`, { isActive: !u.isActive });
      setUsers(users.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x));
    } catch {}
  };

  const filtered = users.filter(u => tab === 'STAFF' ? u.isStaff : !u.isStaff);
  const staffCount = users.filter(u => u.isStaff).length;
  const comensalCount = users.filter(u => !u.isStaff).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8 pt-16 md:pt-8">
      <div className="max-w-2xl mx-auto px-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              {tab === 'STAFF' ? <ChefHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <UsersIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{tab === 'STAFF' ? 'Personal operativo' : 'Comensales'}</h1>
              <p className="text-sm text-slate-500">
                {tab === 'COMENSAL' && limit
                  ? `${limit.used}${limit.max != null ? ` / ${limit.max}` : ''} en tu comedor${limit.max != null && limit.used >= limit.max ? ' · cupo lleno' : ''}`
                  : tab === 'STAFF' ? `${staffCount} en tu equipo` : `${comensalCount} en tu comedor`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {tab === 'COMENSAL' && (
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:border-emerald-400 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Importar
              </button>
            )}
            <button
              onClick={() => navigate(`${base}/registrar${tab === 'STAFF' ? '?tipo=staff' : ''}`)}
              className="flex items-center gap-2 h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Alta
            </button>
          </div>
        </div>

        {/* Tabs Comensales / Personal operativo */}
        {hrEnabled && (
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            <button onClick={() => setTab('COMENSAL')} className={`flex-1 h-9 rounded-full text-sm font-semibold cursor-pointer transition-colors ${tab === 'COMENSAL' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
              Comensales ({comensalCount})
            </button>
            <button onClick={() => setTab('STAFF')} className={`flex-1 h-9 rounded-full text-sm font-semibold cursor-pointer transition-colors ${tab === 'STAFF' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>
              Personal operativo ({staffCount})
            </button>
          </div>
        )}

        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o número..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center text-slate-500 text-sm">
            {tab === 'STAFF' ? 'No hay personal operativo. Da de alta el primero desde "Alta".' : 'No hay comensales. Da de alta el primero desde "Alta".'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                {editingId === u.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nombre"
                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <input
                        value={form.employeeNumber}
                        onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
                        placeholder="# Empleado"
                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Teléfono"
                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400"
                      />
                      <input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Email"
                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => save(u.id)}
                        disabled={saving}
                        className="flex items-center gap-1 h-9 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 h-9 px-4 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs hover:border-slate-400 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {u.isStaff && (
                        u.photoUrl
                          ? <img src={u.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                          : <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0"><ChefHat className="w-5 h-5 text-emerald-500" /></div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{u.name}</p>
                          {!u.isActive && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">Inactivo</span>}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {u.isStaff ? (u.position || 'Equipo de operación') : `#${u.employeeNumber} · ${u.phone}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!u.isStaff && (
                        <div className="text-right mr-1">
                          <p className="text-xs text-slate-400">Saldo</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(u.balance).toFixed(2)}</p>
                        </div>
                      )}
                      <button
                        onClick={() => setQrUser(u)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors cursor-pointer"
                        title="Ver QR"
                      >
                        <QrCode className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => startEdit(u)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                          u.isActive
                            ? 'border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 text-red-500'
                            : 'border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 text-emerald-500'
                        }`}
                        title={u.isActive ? 'Desactivar' : 'Activar'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {qrUser && (
        <QRModal
          name={qrUser.name}
          employeeNumber={qrUser.employeeNumber}
          qrCode={qrUser.qrCode}
          photoUrl={(qrUser as any).photoUrl}
          position={(qrUser as any).position}
          onClose={() => setQrUser(null)}
        />
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Importar comensales</h2>
              <button onClick={() => setShowImport(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <BulkImportComensales
                endpoint={`/cashier/branch/${branchId}/bulk-import`}
                onClose={() => { setShowImport(false); load(); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
