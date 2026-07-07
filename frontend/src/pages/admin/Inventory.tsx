import React, { useEffect, useState } from 'react';
import {
  Package, Plus, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Loader, ChevronDown, ChevronUp, History, Building2
} from 'lucide-react';
import api from '../../lib/api';

interface Branch { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  stock: number;
  minStock: number;
  isTracked: boolean;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  prevStock: number;
  newStock: number;
  note: string | null;
  createdAt: string;
}

const fmt = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

function StockBadge({ product }: { product: Product }) {
  if (!product.isTracked) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600">
        Sin control
      </span>
    );
  }
  if (product.stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle className="w-3 h-3" /> Agotado
      </span>
    );
  }
  if (product.stock <= product.minStock && product.minStock > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3" /> Stock bajo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle className="w-3 h-3" /> OK
    </span>
  );
}

export const Inventory: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [restockModal, setRestockModal] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [movements, setMovements] = useState<Record<string, Movement[]>>({});
  const [loadingMovements, setLoadingMovements] = useState<string | null>(null);

  useEffect(() => {
    api.get('/inventory/branches').then(({ data }) => {
      setBranches(data);
      if (data.length === 1) setSelectedBranch(data[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;
    setLoading(true);
    api.get(`/inventory/branch/${selectedBranch}`)
      .then(({ data }) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBranch]);

  const toggleTracking = async (product: Product) => {
    try {
      await api.put(`/inventory/${product.id}/stock`, { isTracked: !product.isTracked });
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, isTracked: !p.isTracked } : p
      ));
    } catch (err) { console.error(err); }
  };

  const updateMinStock = async (product: Product, minStock: number) => {
    try {
      await api.put(`/inventory/${product.id}/stock`, { minStock });
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, minStock } : p
      ));
    } catch (err) { console.error(err); }
  };

  const handleRestock = async () => {
    if (!restockModal || !restockQty) return;
    setRestocking(true);
    try {
      const { data } = await api.post(`/inventory/${restockModal.id}/restock`, {
        quantity: restockQty,
        note: restockNote || undefined
      });
      setProducts(prev => prev.map(p =>
        p.id === restockModal.id ? { ...p, stock: data.newStock, isTracked: true } : p
      ));
      setRestockModal(null);
      setRestockQty('');
      setRestockNote('');
    } catch (err) { console.error(err); }
    finally { setRestocking(false); }
  };

  const toggleHistory = async (productId: string) => {
    if (expandedId === productId) { setExpandedId(null); return; }
    setExpandedId(productId);
    if (movements[productId]) return;
    setLoadingMovements(productId);
    try {
      const { data } = await api.get(`/inventory/${productId}/movements`);
      setMovements(prev => ({ ...prev, [productId]: data }));
    } catch (err) { console.error(err); }
    finally { setLoadingMovements(null); }
  };

  const categories = [...new Set(products.map(p => p.category))].sort();
  const lowStockCount = products.filter(p => p.isTracked && p.stock > 0 && p.stock <= p.minStock && p.minStock > 0).length;
  const outOfStockCount = products.filter(p => p.isTracked && p.stock === 0).length;

  const inputCls = 'w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500';

  return (
    <div className="min-h-screen bg-slate-950 md:ml-64 pt-16 md:pt-0">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Inventario</h1>
            <p className="text-xs text-slate-400">Productos físicos — bebidas, snacks, artículos empaquetados</p>
          </div>
        </div>

        {/* Branch selector */}
        {branches.length > 1 && (
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={selectedBranch}
              onChange={e => { setSelectedBranch(e.target.value); setExpandedId(null); }}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value="">Selecciona una sucursal</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">

        {!selectedBranch ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Selecciona una sucursal</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Productos</p>
                <p className="text-2xl font-bold text-white">{products.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Controlados</p>
                <p className="text-2xl font-bold text-violet-400">{products.filter(p => p.isTracked).length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Stock bajo</p>
                <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-600'}`}>{lowStockCount}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Agotados</p>
                <p className={`text-2xl font-bold ${outOfStockCount > 0 ? 'text-red-400' : 'text-slate-600'}`}>{outOfStockCount}</p>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-violet-500 rounded-full animate-spin" />
                <span className="text-sm text-slate-400">Cargando inventario...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
                <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Sin productos de inventario</p>
                <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                  Para que aparezcan aquí, en la gestión de sucursales marca el producto con tipo <strong className="text-slate-400">Producto físico</strong> (bebidas, snacks, etc.)
                </p>
              </div>
            ) : (
              categories.map(category => (
                <div key={category} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-300">{category}</h2>
                  </div>
                  <div className="divide-y divide-slate-800/60">
                    {products.filter(p => p.category === category).map(product => (
                      <div key={product.id}>
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="font-medium text-slate-200">{product.name}</p>
                                <StockBadge product={product} />
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{fmt(product.price)}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {product.isTracked ? (
                                <p className={`text-lg font-bold tabular-nums ${
                                  product.stock === 0 ? 'text-red-400' :
                                  product.stock <= product.minStock && product.minStock > 0 ? 'text-amber-400' :
                                  'text-emerald-400'
                                }`}>{product.stock}</p>
                              ) : (
                                <p className="text-sm text-slate-600">—</p>
                              )}
                              <p className="text-xs text-slate-600">unidades</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <button
                              onClick={() => toggleTracking(product)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                                product.isTracked
                                  ? 'bg-violet-600/20 text-violet-400 border-violet-600/30 hover:bg-violet-600/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {product.isTracked ? <CheckCircle className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                              {product.isTracked ? 'Controlado' : 'Activar control'}
                            </button>

                            {product.isTracked && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">Mín:</span>
                                <input
                                  type="number"
                                  min="0"
                                  defaultValue={product.minStock}
                                  onBlur={e => updateMinStock(product, parseInt(e.target.value) || 0)}
                                  className="w-16 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                />
                              </div>
                            )}

                            <button
                              onClick={() => { setRestockModal(product); setRestockQty(''); setRestockNote(''); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-lg text-xs font-medium hover:bg-emerald-600/30 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Reabastecer
                            </button>

                            <button
                              onClick={() => toggleHistory(product.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer ml-auto"
                            >
                              <History className="w-3 h-3" />
                              {expandedId === product.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {expandedId === product.id && (
                          <div className="bg-slate-950/50 border-t border-slate-800 px-4 py-3">
                            {loadingMovements === product.id ? (
                              <div className="flex items-center gap-2 py-2">
                                <Loader className="w-3.5 h-3.5 animate-spin text-slate-500" />
                                <span className="text-xs text-slate-500">Cargando movimientos...</span>
                              </div>
                            ) : !movements[product.id]?.length ? (
                              <p className="text-xs text-slate-600 py-2">Sin movimientos registrados</p>
                            ) : (
                              <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Últimos movimientos</p>
                                {movements[product.id].map(m => (
                                  <div key={m.id} className="flex items-center gap-3 text-xs">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      m.type === 'RESTOCK' ? 'bg-emerald-500/10 text-emerald-400' :
                                      m.type === 'SALE' ? 'bg-red-500/10 text-red-400' :
                                      'bg-blue-500/10 text-blue-400'
                                    }`}>{m.type}</span>
                                    <span className="text-slate-400">
                                      {m.type === 'RESTOCK' ? '+' : '-'}{m.quantity} ud.
                                    </span>
                                    <span className="text-slate-600">{m.prevStock} → {m.newStock}</span>
                                    {m.note && <span className="text-slate-500 italic">{m.note}</span>}
                                    <span className="text-slate-700 ml-auto">
                                      {new Date(m.createdAt).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Restock Modal */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Reabastecer</p>
                <p className="text-xs text-slate-400">{restockModal.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Cantidad a agregar *
                </label>
                <input
                  type="number" min="1" value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  placeholder="Ej: 50" className={inputCls} autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nota (opcional)
                </label>
                <input
                  type="text" value={restockNote}
                  onChange={e => setRestockNote(e.target.value)}
                  placeholder="Ej: Entrega proveedor" className={inputCls}
                />
              </div>
            </div>

            {restockModal.isTracked && restockModal.stock >= 0 && (
              <div className="mt-4 bg-slate-800 rounded-lg p-3 flex justify-between text-sm">
                <span className="text-slate-400">Stock actual:</span>
                <span className="text-white font-semibold">{restockModal.stock} ud.</span>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRestockModal(null)}
                className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestock}
                disabled={restocking || !restockQty}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-40 cursor-pointer"
              >
                {restocking ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
