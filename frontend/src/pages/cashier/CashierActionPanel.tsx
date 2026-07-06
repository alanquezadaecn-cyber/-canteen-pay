import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertCircle, ShoppingCart, Plus, Search } from 'lucide-react';
import api from '../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  balance: string;
  qrCode: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
}

export const CashierActionPanel: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<'select' | 'charge' | 'recharge'>('select');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);

  // Cargar productos al montar
  useEffect(() => {
    if (branchId) loadProducts();
  }, [branchId]);

  // Reaccionar cuando llega ?qr= en la URL (viene del scanner)
  useEffect(() => {
    const qrCode = new URLSearchParams(location.search).get('qr');
    if (qrCode && branchId) {
      setUser(null);
      setError('');
      setMode('select');
      loadUser(qrCode);
    }
  }, [location.search, branchId]);

  const loadUser = async (qrCode: string) => {
    try {
      const { data } = await api.get(`/cashier/branch/${branchId}/scan/${qrCode}`);
      setUser(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Usuario no encontrado');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || !branchId) return;
    setSearching(true);
    setError('');
    await loadUser(searchInput.trim());
    setSearching(false);
  };

  const loadProducts = async () => {
    try {
      const { data } = await api.get(`/products/branch/${branchId}`);
      setProducts(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const handleCharge = async (product: Product) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/cashier/branch/${branchId}/charge`, {
        qrCode: user.qrCode,
        amount: product.price,
        description: `Compra: ${product.name}`
      });

      setSuccess(`✅ ${product.name} cobrado a ${user.name}. Nuevo balance: $${data.newBalance}`);
      setUser({ ...user, balance: data.newBalance });
      setMode('select');
      setTimeout(() => {
        setSuccess('');
        navigate(`/caja/${branchId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar cobro');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!user || !rechargeAmount) {
      setError('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/cashier/branch/${branchId}/recharge`, {
        qrCode: user.qrCode,
        amount: parseFloat(rechargeAmount)
      });

      setSuccess(`✅ Recarga de $${rechargeAmount} completada. Nuevo balance: $${data.newBalance}`);
      setUser({ ...user, balance: data.newBalance });
      setRechargeAmount('');
      setMode('select');
      setTimeout(() => {
        setSuccess('');
        navigate(`/caja/${branchId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar recarga');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
        <div className="max-w-lg mx-auto p-4 md:p-8 pt-8 md:pt-16 space-y-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">Panel de Caja</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Busca al comensal para cobrar o recargar</p>
          </div>

          {error && (
            <div className="p-3 md:p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-2 text-sm md:text-base">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" /> Buscar comensal
            </p>
            <form onSubmit={handleSearch} className="space-y-3">
              <Input
                type="text"
                placeholder="Código (10001), email o QR..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoFocus
                disabled={searching}
                className="text-base h-12 rounded-xl"
              />
              <button
                type="submit"
                disabled={searching || !searchInput.trim()}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-base transition-colors disabled:opacity-40"
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const balanceNum = parseFloat(user.balance);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-16 md:pt-0 pb-24 md:pb-0">
      <div className="max-w-lg mx-auto p-4 md:p-8 space-y-4">

        {/* Tarjeta del comensal */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comensal</p>
              <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">{user.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <button
              onClick={() => { setUser(null); setMode('select'); setError(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Cambiar
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Saldo disponible</p>
            <p className={`text-3xl md:text-4xl font-bold mt-1 ${balanceNum < 50 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-50'}`}>
              ${parseFloat(user.balance).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium">
            {success}
          </div>
        )}

        {/* Botones de acción */}
        {mode === 'select' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setMode('charge'); setError(''); }}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 h-24 md:h-28 rounded-2xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-semibold transition-colors disabled:opacity-40"
            >
              <ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />
              <span className="text-base md:text-lg">Cobrar</span>
            </button>
            <button
              onClick={() => { setMode('recharge'); setError(''); }}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 h-24 md:h-28 rounded-2xl bg-slate-600 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold transition-colors disabled:opacity-40"
            >
              <Plus className="w-6 h-6 md:w-7 md:h-7" />
              <span className="text-base md:text-lg">Recargar</span>
            </button>
          </div>
        )}

        {/* Productos */}
        {mode === 'charge' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('select')}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              ← Volver
            </button>
            {products.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                No hay productos configurados para esta sucursal
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleCharge(product)}
                    disabled={loading || balanceNum < product.price}
                    className="flex flex-col items-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all text-left disabled:opacity-40"
                  >
                    <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-50 leading-tight">{product.name}</span>
                    <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">${product.price}</span>
                    {product.category && (
                      <span className="text-xs text-slate-400 mt-1">{product.category}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recarga */}
        {mode === 'recharge' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('select')}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              ← Volver
            </button>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monto a recargar</p>
              {/* Montos rápidos */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setRechargeAmount(String(amt))}
                    className={`h-10 rounded-xl text-sm font-semibold border transition-colors ${
                      rechargeAmount === String(amt)
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Otro monto..."
                step="0.01"
                min="1"
                disabled={loading}
                className="h-12 rounded-xl text-base"
              />
              {rechargeAmount && parseFloat(rechargeAmount) > 0 && (
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 px-1">
                  <span>Saldo actual</span>
                  <span>${balanceNum.toFixed(2)}</span>
                </div>
              )}
              {rechargeAmount && parseFloat(rechargeAmount) > 0 && (
                <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-50 px-1">
                  <span>Nuevo saldo</span>
                  <span>${(balanceNum + parseFloat(rechargeAmount)).toFixed(2)}</span>
                </div>
              )}
              <button
                onClick={handleRecharge}
                disabled={loading || !rechargeAmount || parseFloat(rechargeAmount) <= 0}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold text-base transition-colors disabled:opacity-40"
              >
                {loading ? 'Procesando...' : `Recargar $${rechargeAmount || '0'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
