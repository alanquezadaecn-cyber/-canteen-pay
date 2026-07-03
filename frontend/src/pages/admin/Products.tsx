import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Plus, Trash2, Edit2, ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  isActive: boolean;
}

export const Products: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'General' });

  useEffect(() => {
    fetchProducts();
  }, [branchId]);

  const fetchProducts = async () => {
    try {
      if (!branchId) return;
      const res = await api.get(`/products/branch/${branchId}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price) return;

    try {
      await api.post('/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        branchId
      });

      setShowNew(false);
      setNewProduct({ name: '', price: '', category: 'General' });
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;

    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">

        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(-1)} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Menú de Productos</h1>
        </div>

        <Card>
          <CardHeader borderBottom>
            <div className="flex justify-between items-center">
              <CardTitle>Productos ({products.filter(p => p.isActive).length})</CardTitle>
              <Button onClick={() => setShowNew(!showNew)} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {showNew && (
              <form onSubmit={handleCreate} className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="Tacos"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Precio *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="50.00"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Input
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="General"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Crear</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
                </div>
              </form>
            )}

            {products.filter(p => p.isActive).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4">Nombre</th>
                      <th className="text-left py-3 px-4">Categoría</th>
                      <th className="text-right py-3 px-4">Precio</th>
                      <th className="text-center py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => p.isActive).map((product) => (
                      <tr key={product.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-50">{product.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{product.category}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ${parseFloat(product.price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center flex gap-2 justify-center">
                          <Button
                            onClick={() => handleDelete(product.id)}
                            variant="outline"
                            size="sm"
                            className="px-3 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                Sin productos
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
