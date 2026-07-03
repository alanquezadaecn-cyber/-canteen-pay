import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { branchId } = useParams<{ branchId?: string }>();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [branchName, setBranchName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Cargar nombre de sucursal si existe branchId
  useEffect(() => {
    if (branchId) {
      const loadBranchName = async () => {
        try {
          const { data } = await api.get(`/cashier/branch/${branchId}`);
          setBranchName(data.name);
        } catch (err) {
          console.error('Error cargando sucursal:', err);
        }
      };
      loadBranchName();
    }
  }, [branchId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email y contraseña requeridos');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
        branchId: branchId || undefined  // Enviar branchId si existe, para validación
      });

      setAuth(data.user, data.accessToken, data.refreshToken);

      // Redirigir según rol
      const destination =
        data.user.role === 'ADMIN' ? '/admin/dashboard' :
        data.user.role === 'CASHIER' ? `/caja/${data.user.branchId}` :
        '/dashboard';

      navigate(destination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className=" text-white rounded-t-xl">
          <CardTitle className="text-3xl">
            {branchName ? `${branchName} - Login` : 'MealPay'}
          </CardTitle>
          <p className="text-sm text-slate-300 mt-1">
            {branchName ? 'Acceso a tu sucursal' : 'Sistema de Pago Digital para Comedores'}
          </p>
        </CardHeader>

        <CardContent className="pt-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2 block">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-emerald-600 hover:underline font-medium">
              Regístrate aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
