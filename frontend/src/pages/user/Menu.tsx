import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, Tag, AlertCircle, CalendarRange } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string | null;
  stock: number;
  isTracked: boolean;
  isActive: boolean;
}

interface RotationItem { subsidyTierId: string; tierName: string; cost: string; dishName: string | null }
interface RotationToday { active: boolean; week?: number; items?: RotationItem[] }

const fmt = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export const Menu: React.FC = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState<RotationToday | null>(null);

  useEffect(() => {
    if (!user?.branchId) return;
    api.get(`/products/branch/${user.branchId}`)
      .then(({ data }) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
    api.get(`/products/branch/${user.branchId}/rotation-today`)
      .then(({ data }) => setRotation(data))
      .catch(() => {});
  }, [user?.branchId]);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-600/20 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Menú del día</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 ml-11 capitalize">{today}</p>
      </div>

      {/* Menú de la semana (ciclo de 8 semanas) = el menú subsidiado de hoy, un platillo por nivel */}
      {rotation?.active && (
        <div className="px-6 pt-6">
          <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-5 shadow-lg shadow-emerald-500/20 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <CalendarRange className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-emerald-100 text-xs font-medium">Menú de la semana{rotation.week ? ` · Semana ${rotation.week}` : ''}</p>
                {!rotation.items || rotation.items.length === 0 ? (
                  <p className="text-white text-sm font-semibold mt-1">Aún no se definió el platillo de hoy</p>
                ) : (
                  <div className="mt-1.5 space-y-2.5">
                    {rotation.items.map(it => (
                      <div key={it.subsidyTierId}>
                        <span className="text-emerald-100 text-xs font-semibold">{it.tierName}</span>
                        <p className="text-white text-base font-extrabold leading-snug break-words">{it.dishName || 'Por definir'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Cargando menú...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Sin productos disponibles</p>
            <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">El menú se actualizará pronto</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{category}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.filter(p => p.category === category).map(product => {
                  const outOfStock = product.isTracked && product.stock === 0;
                  return (
                    <div
                      key={product.id}
                      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 transition-colors ${
                        outOfStock
                          ? 'border-slate-100 dark:border-slate-800 opacity-50'
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${outOfStock ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {product.name}
                          </p>
                          {outOfStock && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3 text-red-500 dark:text-red-400" />
                              <span className="text-xs text-red-500 dark:text-red-400">Agotado por hoy</span>
                            </div>
                          )}
                          {product.isTracked && product.stock > 0 && (
                            <p className="text-xs text-slate-500 mt-1">Disponibles: {product.stock}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-lg font-bold tabular-nums ${
                            outOfStock ? 'text-slate-300 dark:text-slate-600' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {fmt(product.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
