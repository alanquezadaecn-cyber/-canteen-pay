import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';
import { Package, Plus, PackagePlus, Trash2, X, AlertTriangle, Check } from 'lucide-react';

interface Producto {
  id: string;
  name: string;
  price: string;
  category: string;
  stock: number;
  minStock: number;
  isTracked: boolean;
}

const fmt = (n: string | number) => `$${parseFloat(String(n)).toFixed(2)}`;

export const CashierInventory: React.FC = () => {
  const { user } = useAuthStore();
  const branchId = user?.branchId || '';

  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'General', stock: '', minStock: '' });
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState('');

  useEffect(() => { if (branchId) load(); }, [branchId]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/inventory/branch/${branchId}`);
      setItems(data);
    } catch {
      setError('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setError('');
    try {
      await api.post(`/inventory/branch/${branchId}/create`, {
        name: form.name, price: form.price || 0, category: form.category,
        stock: form.stock || 0, minStock: form.minStock || 0
      });
      setForm({ name: '', price: '', category: 'General', stock: '', minStock: '' });
      setShowNew(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear');
    } finally { setSaving(false); }
  };

  const doRestock = async (id: string) => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) return;
    try {
      await api.post(`/inventory/${id}/restock`, { quantity: qty });
      setRestockId(null); setRestockQty('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reabastecer');
    }
  };

  const adjust = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await api.put(`/inventory/${id}/stock`, { stock: newStock });
      setItems(items.map(x => x.id === id ? { ...x, stock: newStock } : x));
    } catch {}
  };

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este producto del inventario?')) return;
    try { await api.delete(`/inventory/${id}`); load(); } catch {}
  };

  const lowStock = items.filter(i => i.isTracked && i.stock <= i.minStock).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8 pt-16 md:pt-8">
      <div className="max-w-2xl mx-auto px-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Inventario</h1>
              <p className="text-sm text-slate-500">{items.length} productos{lowStock > 0 ? ` · ${lowStock} con stock bajo` : ''}</p>
            </div>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors cursor-pointer flex-shrink-0">
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Sin productos en inventario. Agrega el primero (ej. refrescos, aguas, snacks).</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(p => {
              const low = p.isTracked && p.stock <= p.minStock;
              return (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{p.name}</p>
                        {low && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Bajo</span>}
                      </div>
                      <p className="text-xs text-slate-400">{p.category} · {fmt(p.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Stepper de stock */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjust(p.id, p.stock - 1)} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 font-bold cursor-pointer">−</button>
                        <span className={`w-12 text-center font-bold ${low ? 'text-red-500' : 'text-slate-900 dark:text-slate-50'}`}>{p.stock < 0 ? '∞' : p.stock}</span>
                        <button onClick={() => adjust(p.id, p.stock + 1)} className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 font-bold cursor-pointer">+</button>
                      </div>
                      <button onClick={() => { setRestockId(p.id); setRestockQty(''); }} className="w-9 h-9 flex items-center justify-center rounded-lg border border-emerald-200 dark:border-emerald-900 text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer" title="Reabastecer">
                        <PackagePlus className="w-4 h-4" />
                      </button>
                      <button onClick={() => del(p.id)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 transition-colors cursor-pointer" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {restockId === p.id && (
                    <div className="mt-3 flex gap-2 items-center">
                      <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="Cantidad a agregar" autoFocus
                        className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
                      <button onClick={() => doRestock(p.id)} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer flex items-center gap-1"><Check className="w-4 h-4" /> Agregar</button>
                      <button onClick={() => setRestockId(null)} className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm cursor-pointer">Cancelar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal nuevo producto */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={create} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Nuevo producto</h2>
              <button type="button" onClick={() => setShowNew(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre (ej. Refresco 600ml)" autoFocus required
              className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Precio"
                className="h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Categoría"
                className="h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="Stock inicial"
                className="h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
              <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="Stock mínimo"
                className="h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400" />
            </div>
            <button type="submit" disabled={saving || !form.name.trim()} className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer">
              {saving ? 'Guardando...' : 'Agregar al inventario'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
