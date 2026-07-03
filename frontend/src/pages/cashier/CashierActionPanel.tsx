import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertCircle, ShoppingCart, Plus } from 'lucide-react';
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
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<'select' | 'charge' | 'recharge'>('select');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos del usuario desde query param
  useEffect(() => {
    const qrCode = new URLSearchParams(window.location.search).get('qr');
    if (qrCode && branchId) {
      loadUser(qrCode);
      loadProducts();
    }
  }, [branchId]);

  const loadUser = async (qrCode: string) => {
    try {
      const { data } = await api.get(`/cashier/branch/${branchId}/scan/${qrCode}`);
      setUser(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Usuario no encontrado');
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Cargando...</CardTitle>
          </CardHeader>
          {error && (
            <CardContent>
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 p-4">
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
