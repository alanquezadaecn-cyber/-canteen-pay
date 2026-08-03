import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Check, X, Eye, EyeOff, CalendarRange } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  isActive: boolean;
}

interface RotationToday { active: boolean; mode?: 'AUTO' | 'MANUAL'; week?: number; item?: { name: string; price: string } | null }

// Preferencia del cajero de usar (o no) el menú de la semana como lo que se cobra hoy —
// se guarda por sucursal+día para que no haya que repetirlo cada vez que se abre la caja.
const rotationPrefKey = (branchId: string) => `cashfood_use_rotation_${branchId}_${new Date().toISOString().slice(0, 10)}`;

export const CashierProducts: React.FC = () => {
  const { user } = useAuthStore();
  const branchId = user?.branchId || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'General' });
  const [editValues, setEditValues] = useState({ name: '', price: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [rotation, setRotation] = useState<RotationToday | null>(null);
  const [useRotation, setUseRotation] = useState(false);

  useEffect(() => {
    if (branchId) {
      load();
      api.get(`/products/branch/${branchId}/rotation-today`).then(({ data }) => {
        setRotation(data);
        if (data.active) {
          const stored = localStorage.getItem(rotationPrefKey(branchId));
          setUseRotation(stored === null ? true : stored === '1'); // por defecto activado si hay menú de la semana
        }
      }).catch(() => {});
    }
  }, [branchId]);

  const toggleUseRotation = (value: boolean) => {
    setUseRotation(value);
    if (branchId) localStorage.setItem(rotationPrefKey(branchId), value ? '1' : '0');
  };

  const load = async () => {
    try {
      const { data } = await api.get('/products/cashier/branch');
      setProducts(data);
    } catch (err) {
      setError('Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/products/cashier/create', {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category || 'General'
      });
      setNewProduct({ name: '', price: '', category: 'General' });
      setShowNew(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear producto');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues({ name: product.name, price: product.price, category: product.category });
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await api.put(`/products/cashier/${id}`, {
        name: editValues.name,
        price: parseFloat(editValues.price),
        category: editValues.category
      });
      setEditingId(null);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      if (product.isActive) {
        await api.delete(`/products/cashier/${product.id}`);
      } else {
        await api.put(`/products/cashier/${product.id}/activate`);
      }
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar disponibilidad');
    }
  };

  const availableCount = products.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
      <div className="max-w-lg mx-auto p-4 md:p-8 pt-8 md:pt-16 space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Menú del día</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {availableCount} disponibles hoy · lo que ven los comensales y lo que cobras en caja
            </p>
          </div>
          <button
            onClick={() => { setShowNew(true); setError(''); }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {/* Menú de la semana (ciclo de 8 semanas): si la sucursal no lo tiene activado desde
            Admin -> Menú semanal, esta tarjeta simplemente no aparece y todo sigue como siempre. */}
        {rotation?.active && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <CalendarRange className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Menú de la semana {rotation.mode === 'MANUAL' ? '· manual' : rotation.week ? `· Semana ${rotation.week}` : ''}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {rotation.item ? `${rotation.item.name} · $${rotation.item.price}` : 'Aún no se definió el platillo de hoy (Admin → Menú semanal)'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Usar este platillo como lo que se cobra hoy en caja</p>
              <button
                onClick={() => toggleUseRotation(!useRotation)}
                disabled={!rotation.item}
                className={`h-8 px-3 rounded-full text-xs font-bold cursor-pointer transition-colors disabled:opacity-40 flex-shrink-0 ${useRotation ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
              >
                {useRotation ? 'Activado' : 'Desactivado'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Formulario nuevo producto */}
        {showNew && (
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nuevo producto</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Nombre *</label>
                <input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Tacos"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Precio *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="50"
                    className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400"
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Categoría</label>
              <input
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="General, Bebidas, Antojitos..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-sm transition-colors disabled:opacity-40"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:border-slate-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de productos */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">Cargando...</div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No hay productos aún. Agrega el primero.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map(product => (
              <div
                key={product.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 transition-opacity ${
                  product.isActive
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-slate-200 dark:border-slate-800 opacity-50'
                }`}
              >
                {editingId === product.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.price}
                          onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                          className="w-full h-9 pl-6 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400"
                        />
                      </div>
                    </div>
                    <input
                      value={editValues.category}
                      onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-slate-400"
                      placeholder="Categoría"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(product.id)}
                        disabled={saving}
                        className="flex items-center gap-1 h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-semibold transition-colors disabled:opacity-40"
                      >
                        <Check className="w-3 h-3" /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs hover:border-slate-400 transition-colors"
                      >
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base text-slate-900 dark:text-slate-50 truncate">{product.name}</p>
                        {!product.isActive && (
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                            No disponible hoy
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{product.category}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xl font-bold text-slate-900 dark:text-slate-50">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => toggleAvailability(product)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                          product.isActive
                            ? 'border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        title={product.isActive ? 'Quitar del menú de hoy' : 'Poner en el menú de hoy'}
                      >
                        {product.isActive
                          ? <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      <button
                        onClick={() => startEdit(product)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
