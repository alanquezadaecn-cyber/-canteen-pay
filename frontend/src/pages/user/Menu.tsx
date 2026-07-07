import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, Tag, AlertCircle } from 'lucide-react';
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

const fmt = (n: string | number) =>
  `$${parseFloat(String(n)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

export const Menu: React.FC = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.branchId) return;
    api.get(`/products/branch/${user.branchId}`)
      .then(({ data }) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.branchId]);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <div className="min-h-screen bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Menú del día</h1>
        </div>
        <p className="text-sm text-slate-400 ml-11 capitalize">{today}</p>
      </div>

      <div className="p-6 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Cargando menú...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Sin productos disponibles</p>
            <p className="text-sm text-slate-600 mt-1">El menú se actualizará pronto</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{category}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.filter(p => p.category === category).map(product => {
                  const outOfStock = product.isTracked && product.stock === 0;
                  return (
                    <div
                      key={product.id}
                      className={`bg-slate-900 border rounded-xl p-4 transition-colors ${
                        outOfStock
                          ? 'border-slate-800 opacity-50'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${outOfStock ? 'text-slate-500' : 'text-white'}`}>
                            {product.name}
                          </p>
                          {outOfStock && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-red-400">Agotado por hoy</span>
                            </div>
                          )}
                          {product.isTracked && product.stock > 0 && (
                            <p className="text-xs text-slate-500 mt-1">Disponibles: {product.stock}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-lg font-bold tabular-nums ${
                            outOfStock ? 'text-slate-600' : 'text-emerald-400'
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
