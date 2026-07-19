import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertCircle, ShoppingCart, Plus, Search } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { doCharge, doRecharge, findCachedComensal, cacheComensales, isOnline } from '../../lib/offline';

interface Subsidy { enabled: boolean; limit: number; usedToday: number; left: number }
interface User {
  id: string;
  name: string;
  email: string;
  balance: string;
  qrCode: string;
  subsidy?: Subsidy;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
}

export const CashierActionPanel: React.FC = () => {
  const { branchId: paramBranchId } = useParams<{ branchId?: string }>();
  const { user: cashierSession } = useAuthStore();
  const location = useLocation();

  // El cajero SIEMPRE opera sobre su propia sucursal (branchId de la sesión).
  // La URL /caja/:branchId legacy también se soporta. El slug es solo cosmético.
  const branchId = cashierSession?.branchId || paramBranchId;
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<'select' | 'charge' | 'recharge'>('select');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [chargeSubsidized, setChargeSubsidized] = useState(false);

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

  const loadUser = async (term: string) => {
    if (!branchId) { setError('No se pudo determinar la sucursal'); return; }
    const clean = term.replace(/^#/, '').trim();

    // Offline: buscar en el cache local de comensales
    if (!isOnline()) {
      const cached = findCachedComensal(branchId, clean);
      if (cached) { setUser(cached); setError(''); }
      else setError('Sin conexión: comensal no está en el cache local');
      return;
    }

    try {
      const { data } = await api.get(`/cashier/branch/${branchId}/scan/${encodeURIComponent(clean)}`);
      setUser(data);
      setError('');
    } catch (err: any) {
      // Si falló por red, intentar el cache local
      if (!err.response) {
        const cached = findCachedComensal(branchId, clean);
        if (cached) { setUser(cached); setError(''); return; }
      }
      setError(err.response?.data?.error || 'Comensal no encontrado');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
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
    // Cachear comensales para operar offline (en segundo plano, no bloquea)
    if (branchId && isOnline()) {
      api.get(`/cashier/branch/${branchId}/users`).then(r => cacheComensales(branchId, r.data)).catch(() => {});
    }
  };

  const handleCharge = async (product: Product, subsidized = false) => {
    if (!user || !branchId) return;
    setLoading(true);
    try {
      const res: any = await doCharge(branchId, user, product.price, `Compra: ${product.name}`, subsidized);
      if (subsidized) {
        setSuccess(`✅ ${product.name} SUBSIDIADO a ${user.name}. Le quedan ${res.subsidyLeft} hoy.`);
        setUser({ ...user, subsidy: user.subsidy ? { ...user.subsidy, usedToday: user.subsidy.usedToday + 1, left: res.subsidyLeft } : undefined });
      } else {
        setSuccess(res.offline
          ? `⚠️ Sin conexión: ${product.name} cobrado a ${user.name} (se sincronizará). Saldo: $${res.newBalance}`
          : `✅ ${product.name} cobrado a ${user.name}. Nuevo saldo: $${res.newBalance}`);
        setUser({ ...user, balance: res.newBalance });
      }
      setMode('select');
      setTimeout(() => { setSuccess(''); setUser(null); }, 2200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar cobro');
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!user || !branchId || !rechargeAmount) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoading(true);
    try {
      const { offline, newBalance } = await doRecharge(branchId, user, parseFloat(rechargeAmount));
      setSuccess(offline
        ? `⚠️ Sin conexión: recarga de $${rechargeAmount} guardada (se sincronizará). Saldo: $${newBalance}`
        : `✅ Recarga de $${rechargeAmount} completada. Nuevo saldo: $${newBalance}`);
      setUser({ ...user, balance: newBalance });
      setRechargeAmount('');
      setMode('select');
      setTimeout(() => { setSuccess(''); setUser(null); }, 2200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar recarga');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8">

        {/* Hero verde */}
        <div className="relative bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-400 rounded-b-[2.5rem] pt-20 md:pt-12 pb-16 px-5 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative max-w-lg mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white">Panel de Caja</h1>
            <p className="text-emerald-100 text-sm mt-2">Busca al comensal para cobrar o recargar</p>
          </div>
        </div>

        {/* Tarjeta de búsqueda flotante */}
        <div className="max-w-lg mx-auto px-5 -mt-10 relative space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-100 dark:border-slate-800 p-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" /> Buscar comensal
            </p>
            <form onSubmit={handleSearch} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre, # empleado, email, teléfono o QR..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoFocus
                disabled={searching}
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-base focus:outline-none focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
              <button
                type="submit"
                disabled={searching || !searchInput.trim()}
                className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors disabled:opacity-40 shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const balanceNum = parseFloat(user.balance);
  const [entero, decimales] = balanceNum.toFixed(2).split('.');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8">

      {/* Hero verde con el comensal y su saldo */}
      <div className="relative bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-400 rounded-b-[2.5rem] pt-20 md:pt-10 pb-10 px-5 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-white/25 backdrop-blur flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-lg leading-tight truncate">{user.name}</p>
                <p className="text-emerald-100 text-xs truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { setUser(null); setMode('select'); setError(''); }}
              className="flex-shrink-0 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 rounded-full px-4 py-2 transition-colors cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          <div className="text-center">
            <p className="text-emerald-50 text-sm font-medium mb-1">Saldo disponible</p>
            <div className={`flex items-start justify-center ${balanceNum < 50 ? 'text-amber-200' : 'text-white'}`}>
              <span className="text-2xl font-bold mt-1.5 mr-1">$</span>
              <span className="text-5xl font-extrabold tracking-tight" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>{entero}</span>
              <span className="text-xl font-bold mt-1.5">.{decimales}</span>
              <span className="text-xs font-semibold mt-2.5 ml-1 opacity-80">MXN</span>
            </div>
            {balanceNum < 50 && (
              <p className="text-amber-200 text-xs font-medium mt-1">Saldo bajo</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5 space-y-4">

        {/* Alertas */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm font-semibold">
            {success}
          </div>
        )}

        {/* Botones de acción */}
        {mode === 'select' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setMode('charge'); setError(''); setChargeSubsidized(false); }}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 h-28 rounded-3xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-40 shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <ShoppingCart className="w-7 h-7" />
              <span className="text-base md:text-lg">Cobrar</span>
            </button>
            <button
              onClick={() => { setMode('recharge'); setError(''); }}
              disabled={loading}
              className="flex flex-col items-center justify-center gap-2 h-28 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-semibold transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-7 h-7" />
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

            {/* Toggle de subsidio (si la empresa lo tiene habilitado) */}
            {user.subsidy?.enabled && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Comida subsidiada</p>
                  <p className="text-xs text-slate-500">
                    {user.subsidy.left > 0
                      ? `Le quedan ${user.subsidy.left} de ${user.subsidy.limit} hoy · no descuenta saldo`
                      : `Sin comidas subsidiadas hoy (${user.subsidy.usedToday}/${user.subsidy.limit})`}
                  </p>
                </div>
                <button
                  onClick={() => setChargeSubsidized(v => !v)}
                  disabled={user.subsidy.left <= 0}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${chargeSubsidized ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  {chargeSubsidized ? 'SUBSIDIANDO ✓' : 'Activar subsidio'}
                </button>
              </div>
            )}

            {products.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                No hay productos configurados para esta sucursal
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map(product => {
                  const sub = chargeSubsidized && (user.subsidy?.left ?? 0) > 0;
                  return (
                  <button
                    key={product.id}
                    onClick={() => handleCharge(product, sub)}
                    disabled={loading || (!sub && balanceNum < product.price)}
                    className={`flex flex-col items-start p-4 rounded-2xl border hover:shadow-md transition-all text-left disabled:opacity-40 ${sub ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}
                  >
                    <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-50 leading-tight">{product.name}</span>
                    <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                      {sub ? <span className="text-emerald-600 text-base">Subsidiado</span> : `$${product.price}`}
                    </span>
                    {product.category && (
                      <span className="text-xs text-slate-400 mt-1">{product.category}</span>
                    )}
                  </button>
                  );
                })}
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
                    className={`h-10 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                      rechargeAmount === String(amt)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
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
                className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-colors disabled:opacity-40 shadow-lg shadow-emerald-500/25 cursor-pointer"
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
