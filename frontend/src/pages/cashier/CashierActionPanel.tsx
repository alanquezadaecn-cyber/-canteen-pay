import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertCircle, ShoppingCart, Plus, Search, Play, Square, Clock, UtensilsCrossed } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { doCharge, doCashSale, doRecharge, findCachedComensal, cacheComensales, isOnline } from '../../lib/offline';

interface CashDrawer {
  initialFloat: string;
  cashSalesCount: number;
  cashSalesAmount: string;
  cashRechargesCount: number;
  cashRechargesAmount: string;
  totalChangeGiven: string;
  expected: string;
}
interface Shift {
  id: string;
  shiftNumber: number;
  openedAt: string;
  closedAt?: string | null;
  finalBalance?: string | null;
  dishesSoFar?: number;
  cashDrawer?: CashDrawer;
}

const MAX_SHIFTS = 3;

interface SubsidyTier { id: string; name: string; cost: number }
interface Subsidy { enabled: boolean; limit: number; usedToday: number; left: number; tiers?: SubsidyTier[] }
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
  productType?: 'PLATILLO' | 'PRODUCTO' | 'INSUMO';
  stock?: number;
  isTracked?: boolean;
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
  const [chargeTab, setChargeTab] = useState<'MENU' | 'SNACKS'>('MENU');
  const [payWithCash, setPayWithCash] = useState(false);
  const [cashProduct, setCashProduct] = useState<Product | null>(null);
  const [cashReceivedInput, setCashReceivedInput] = useState('');

  // Turno de operación: apertura/cierre de barra
  const [openShift, setOpenShift] = useState<Shift | null>(null);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const todayShiftsCount = todayShifts.length;
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shiftError, setShiftError] = useState('');
  const [initialFloatInput, setInitialFloatInput] = useState('');
  const [closingShift, setClosingShift] = useState(false);
  const [countedCashInput, setCountedCashInput] = useState('');

  const loadShift = () => {
    if (!branchId) return;
    api.get(`/cashier-sessions/today/${branchId}`).then(({ data }) => {
      setTodayShifts(data);
      // Al abrir el siguiente turno del día, se sugiere como fondo inicial lo que se
      // contó físicamente al cerrar el turno anterior — así el efectivo no se pierde
      // en la entrega y el siguiente cajero arranca con el fondo real.
      const lastClosed = [...data].reverse().find((s: Shift) => s.finalBalance != null);
      if (lastClosed && !initialFloatInput) setInitialFloatInput(String(lastClosed.finalBalance));
    }).catch(() => {});
    api.get(`/cashier-sessions/current/${branchId}`).then(({ data }) => setOpenShift(data)).catch(() => setOpenShift(null));
  };
  useEffect(() => { loadShift(); }, [branchId]);

  const openShiftAction = async () => {
    if (!branchId) return;
    setShiftBusy(true); setShiftError('');
    try {
      await api.post('/cashier-sessions/open', { branchId, initialFloat: parseFloat(initialFloatInput) || 0 });
      setInitialFloatInput('');
      loadShift();
    } catch (err: any) {
      setShiftError(err.response?.data?.error || 'Error al abrir turno');
    } finally { setShiftBusy(false); }
  };

  const confirmCloseShift = async () => {
    if (!openShift) return;
    setShiftBusy(true); setShiftError('');
    try {
      await api.post(`/cashier-sessions/${openShift.id}/close`, { finalBalance: countedCashInput || undefined });
      setClosingShift(false);
      setCountedCashInput('');
      loadShift();
    } catch (err: any) {
      setShiftError(err.response?.data?.error || 'Error al cerrar turno');
    } finally { setShiftBusy(false); }
  };

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

  const handleCharge = async (product: Product) => {
    if (!user || !branchId) return;
    setLoading(true);
    try {
      const res: any = await doCharge(branchId, user, product.price, `Compra: ${product.name}`, false, product.id);
      setSuccess(res.offline
        ? `⚠️ Sin conexión: ${product.name} cobrado a ${user.name} (se sincronizará). Saldo: $${res.newBalance}`
        : `✅ ${product.name} cobrado a ${user.name}. Nuevo saldo: $${res.newBalance}`);
      setUser({ ...user, balance: res.newBalance });
      setMode('select');
      setTimeout(() => { setSuccess(''); setUser(null); }, 2200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar cobro');
    } finally {
      setLoading(false);
    }
  };

  const handleChargeSubsidized = async (tier: SubsidyTier) => {
    if (!user || !branchId) return;
    setLoading(true);
    try {
      const res: any = await doCharge(branchId, user, tier.cost, `Subsidiado (${tier.name})`, true, undefined, tier.id);
      setSuccess(`✅ ${tier.name} SUBSIDIADO a ${user.name}. Le quedan ${res.subsidyLeft} hoy.`);
      setUser({ ...user, subsidy: user.subsidy ? { ...user.subsidy, usedToday: user.subsidy.usedToday + 1, left: res.subsidyLeft } : undefined });
      setMode('select');
      setTimeout(() => { setSuccess(''); setUser(null); }, 2200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar cobro subsidiado');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCashSale = async () => {
    if (!user || !branchId || !cashProduct) return;
    const cashReceived = parseFloat(cashReceivedInput);
    if (!cashReceived || cashReceived < cashProduct.price) {
      setError('El efectivo recibido debe cubrir el precio');
      return;
    }
    setLoading(true);
    try {
      const res = await doCashSale(branchId, user, cashProduct.price, cashReceived, `Compra: ${cashProduct.name}`, cashProduct.id);
      setSuccess(`✅ ${cashProduct.name} pagado en efectivo. Cambio a dar: $${res.change}`);
      setCashProduct(null);
      setCashReceivedInput('');
      setMode('select');
      setTimeout(() => { setSuccess(''); setUser(null); }, 3500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar el cobro en efectivo');
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

          {/* Apertura / cierre de barra */}
          <div className={`rounded-3xl shadow-xl shadow-slate-900/10 border p-5 ${openShift ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-slate-900 dark:bg-slate-900 border-slate-800'}`}>
            {shiftError && <p className="text-xs text-red-500 mb-2">{shiftError}</p>}
            {openShift && closingShift ? (
              // Cambio de turno: cuenta el efectivo físico contra lo que el sistema espera
              // (fondo inicial + ventas/recargas en efectivo) antes de cerrar la barra.
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Cerrar turno {openShift.shiftNumber}</p>
                {openShift.cashDrawer && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between"><span>Fondo inicial</span><span className="font-semibold text-slate-700 dark:text-slate-300">${openShift.cashDrawer.initialFloat}</span></div>
                    <div className="flex justify-between"><span>Ventas en efectivo ({openShift.cashDrawer.cashSalesCount})</span><span className="font-semibold text-slate-700 dark:text-slate-300">${openShift.cashDrawer.cashSalesAmount}</span></div>
                    <div className="flex justify-between"><span>Recargas en efectivo ({openShift.cashDrawer.cashRechargesCount})</span><span className="font-semibold text-slate-700 dark:text-slate-300">${openShift.cashDrawer.cashRechargesAmount}</span></div>
                    <div className="flex justify-between pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Debe haber en caja</span>
                      <span className="font-extrabold text-emerald-600">${openShift.cashDrawer.expected}</span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Efectivo contado físicamente (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number" min="0" step="0.01" value={countedCashInput} autoFocus
                      onChange={e => setCountedCashInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 pl-8 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  {countedCashInput && openShift.cashDrawer && (() => {
                    const diff = parseFloat(countedCashInput) - parseFloat(openShift.cashDrawer.expected);
                    return (
                      <p className={`text-xs font-semibold mt-1.5 ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                        {diff === 0 ? 'Cuadra exacto ✓' : diff > 0 ? `Sobran $${diff.toFixed(2)}` : `Faltan $${Math.abs(diff).toFixed(2)}`}
                      </p>
                    );
                  })()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setClosingShift(false); setCountedCashInput(''); }}
                    disabled={shiftBusy}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold cursor-pointer disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmCloseShift}
                    disabled={shiftBusy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" /> {shiftBusy ? 'Cerrando...' : 'Confirmar cierre'}
                  </button>
                </div>
              </div>
            ) : openShift ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" /> Turno {openShift.shiftNumber} en operación
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> desde las {new Date(openShift.openedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}</span>
                    <span className="flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> {openShift.dishesSoFar ?? 0} platillos</span>
                  </p>
                  {openShift.cashDrawer && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">💵 Debe haber en caja: ${openShift.cashDrawer.expected}</p>
                  )}
                </div>
                <button
                  onClick={() => setClosingShift(true)}
                  disabled={shiftBusy}
                  className="flex-shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" /> Cerrar barra
                </button>
              </div>
            ) : todayShiftsCount >= MAX_SHIFTS ? (
              <button disabled className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-700 text-white font-bold text-sm opacity-40 cursor-not-allowed">
                <Play className="w-4 h-4" /> Ya se abrieron los {MAX_SHIFTS} turnos de hoy
              </button>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fondo inicial para dar cambio (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number" min="0" step="0.01" value={initialFloatInput}
                      onChange={e => setInitialFloatInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 pl-8 pr-4 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
                <button
                  onClick={openShiftAction}
                  disabled={shiftBusy}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  {shiftBusy ? 'Abriendo...' : `Apertura de barra${todayShiftsCount > 0 ? ` · turno ${todayShiftsCount + 1}` : ''}`}
                </button>
              </div>
            )}
          </div>

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
              onClick={() => { setMode('charge'); setError(''); setChargeSubsidized(false); setPayWithCash(false); setCashProduct(null); setCashReceivedInput(''); setChargeTab('MENU'); }}
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
                  onClick={() => { setChargeSubsidized(v => !v); setPayWithCash(false); setCashProduct(null); }}
                  disabled={user.subsidy.left <= 0}
                  className={`h-9 px-4 rounded-full text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${chargeSubsidized ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  {chargeSubsidized ? 'SUBSIDIANDO ✓' : 'Activar subsidio'}
                </button>
              </div>
            )}

            {/* Toggle de pago en efectivo: el comensal paga en mano, no se toca su saldo */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Pago en efectivo</p>
                <p className="text-xs text-slate-500">El comensal paga en mano, no descuenta su saldo de la app</p>
              </div>
              <button
                onClick={() => { setPayWithCash(v => !v); setChargeSubsidized(false); setCashProduct(null); setCashReceivedInput(''); }}
                className={`h-9 px-4 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${payWithCash ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                {payWithCash ? 'EFECTIVO ✓' : 'Activar efectivo'}
              </button>
            </div>

            {payWithCash && cashProduct ? (
              // Paso 2 del pago en efectivo: cuánto pagó y cuánto cambio dar
              (() => {
                const received = parseFloat(cashReceivedInput) || 0;
                const change = received - cashProduct.price;
                const quickAmounts = Array.from(new Set([cashProduct.price, 50, 100, 200, 500].filter(a => a >= cashProduct.price))).sort((a, b) => a - b);
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{cashProduct.name}</p>
                        <p className="text-xs text-slate-500">Precio: ${cashProduct.price}</p>
                      </div>
                      <button onClick={() => { setCashProduct(null); setCashReceivedInput(''); }} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Cambiar</button>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">¿Con cuánto pagó?</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                        <input
                          type="number" min={cashProduct.price} step="0.01" autoFocus
                          value={cashReceivedInput}
                          onChange={e => setCashReceivedInput(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-14 pl-8 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-2xl font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {quickAmounts.map(a => (
                          <button key={a} onClick={() => setCashReceivedInput(a.toString())} className="h-9 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
                            ${a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={`rounded-2xl p-4 flex items-center justify-between ${received >= cashProduct.price ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cambio a dar</span>
                      <span className={`text-2xl font-extrabold ${received >= cashProduct.price ? 'text-amber-600' : 'text-slate-400'}`}>
                        ${received >= cashProduct.price ? change.toFixed(2) : '0.00'}
                      </span>
                    </div>

                    <button
                      onClick={handleConfirmCashSale}
                      disabled={loading || received < cashProduct.price}
                      className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-40 cursor-pointer"
                    >
                      {loading ? 'Procesando...' : 'Confirmar cobro en efectivo'}
                    </button>
                  </div>
                );
              })()
            ) : chargeSubsidized && (user.subsidy?.left ?? 0) > 0 ? (
              // Cobro subsidiado: solo se puede elegir uno de los niveles que definió la
              // empresa (ej. Estándar $75, Especial $120), nunca un platillo cualquiera.
              (user.subsidy?.tiers?.length ?? 0) === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Esta empresa aún no tiene niveles de subsidio configurados. Pide al administrador que los cree en Subsidio.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {user.subsidy!.tiers!.map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => handleChargeSubsidized(tier)}
                      disabled={loading}
                      className="flex flex-col items-start p-4 rounded-2xl border hover:shadow-md transition-all text-left disabled:opacity-40 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400"
                    >
                      <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-50 leading-tight">{tier.name}</span>
                      <span className="text-emerald-600 text-base font-bold mt-2">Subsidiado</span>
                      <span className="text-xs text-slate-400 mt-1">Costo empresa: ${tier.cost}</span>
                    </button>
                  ))}
                </div>
              )
            ) : (() => {
              const menuItems = products.filter(p => p.productType !== 'PRODUCTO');
              const snackItems = products.filter(p => p.productType === 'PRODUCTO');
              const activeList = snackItems.length > 0 && chargeTab === 'SNACKS' ? snackItems : menuItems;

              return (
                <>
                  {/* Siempre visibles: Menú y Snacks, en todas las sucursales (aunque aún no tengan productos cargados) */}
                  <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                    <button
                      onClick={() => setChargeTab('MENU')}
                      className={`flex-1 h-9 rounded-full text-sm font-semibold cursor-pointer transition-colors ${chargeTab === 'MENU' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Menú ({menuItems.length})
                    </button>
                    <button
                      onClick={() => setChargeTab('SNACKS')}
                      className={`flex-1 h-9 rounded-full text-sm font-semibold cursor-pointer transition-colors ${chargeTab === 'SNACKS' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      Snacks / Tiendita ({snackItems.length})
                    </button>
                  </div>

                  {activeList.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {chargeTab === 'SNACKS'
                        ? 'Aún no hay snacks cargados. Ve a Inventario → "Para vender" y agrega el primero.'
                        : 'Aún no hay platillos cargados. Ve a Menú y agrega el primero.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {activeList.map(product => {
                        const outOfStock = product.productType === 'PRODUCTO' && product.isTracked && (product.stock ?? 0) <= 0;
                        return (
                        <button
                          key={product.id}
                          onClick={() => payWithCash ? setCashProduct(product) : handleCharge(product)}
                          disabled={loading || outOfStock || (!payWithCash && balanceNum < product.price)}
                          className={`flex flex-col items-start p-4 rounded-2xl border hover:shadow-md transition-all text-left disabled:opacity-40 ${payWithCash ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'}`}
                        >
                          <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-50 leading-tight">{product.name}</span>
                          <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-2">${product.price}</span>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {product.category && (
                              <span className="text-xs text-slate-400">{product.category}</span>
                            )}
                            {product.productType === 'PRODUCTO' && product.isTracked && (
                              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${outOfStock ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                {outOfStock ? 'Agotado' : `Quedan ${product.stock}`}
                              </span>
                            )}
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
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
