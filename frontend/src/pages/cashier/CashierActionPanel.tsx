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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 flex items-start justify-center p-4 md:p-8">
        <div className="w-full max-w-md mt-8 md:mt-16 space-y-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Panel de Caja</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Busca al usuario para cobrar o recargar</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-500" />
                Buscar Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Email o código QR del usuario..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                  disabled={searching}
                  className="text-base"
                />
                <Button
                  type="submit"
                  disabled={searching || !searchInput.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-12 text-base"
                >
                  {searching ? 'Buscando...' : 'Buscar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Perfil del Usuario */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-100">
            <CardTitle className="text-xl">👤 {user.name}</CardTitle>
            <p className="text-sm text-gray-600">{user.email}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Balance Actual</p>
                <p className="text-2xl font-bold text-blue-600">${user.balance}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Estado</p>
                <p className="text-2xl font-bold text-green-600">✅ Activo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            {success}
          </div>
        )}

        {/* Seleccionar Acción */}
        {mode === 'select' && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setMode('charge')}
              className="h-24 text-lg flex flex-col gap-2 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <ShoppingCart className="w-6 h-6" />
              💳 COBRAR
            </Button>
            <Button
              onClick={() => setMode('recharge')}
              className="h-24 text-lg flex flex-col gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              <Plus className="w-6 h-6" />
              💵 RECARGAR
            </Button>
          </div>
        )}

        {/* Menú de Productos */}
        {mode === 'charge' && (
          <>
            <Button
              variant="outline"
              onClick={() => setMode('select')}
              className="w-full"
              disabled={loading}
            >
              ← Volver
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map(product => (
                <Button
                  key={product.id}
                  onClick={() => handleCharge(product)}
                  disabled={loading}
                  className="h-20 flex flex-col gap-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <span className="font-semibold text-sm">{product.name}</span>
                  <span className="text-lg font-bold">${product.price}</span>
                </Button>
              ))}
            </div>
          </>
        )}

        {/* Recarga */}
        {mode === 'recharge' && (
          <>
            <Button
              variant="outline"
              onClick={() => setMode('select')}
              className="w-full"
              disabled={loading}
            >
              ← Volver
            </Button>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Monto a Recargar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-600 text-lg">$</span>
                    <Input
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="pl-8"
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleRecharge}
                  disabled={loading || !rechargeAmount}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                >
                  ✅ Procesar Recarga
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
