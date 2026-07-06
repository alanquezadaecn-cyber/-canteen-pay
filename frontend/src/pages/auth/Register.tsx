import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branchId: '',
    employeeNumber: '',
    phone: ''
  });

  // Cargar sucursales al montar
  React.useEffect(() => {
    const loadBranches = async () => {
      try {
        // Obtener sucursales de ASINMEX (hardcoded por ahora)
        const { data } = await api.get('/branches');
        setBranches(data);
      } catch (err) {
        console.error('Error cargando sucursales:', err);
        // Datos de fallback
        setBranches([
          { id: 'cmr4fwm2j000e2ep6oxls9o7i', name: 'AIVY', location: 'México City' },
          { id: 'cmr4fwm42000g2ep67c851kg0', name: 'BOCH', location: 'México City' }
        ]);
      } finally {
        setLoadingBranches(false);
      }
    };
    loadBranches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.branchId || !formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.company || !formData.employeeNumber || !formData.phone) {
      setError('Todos los campos son requeridos');
      return false;
    }
    setError('');
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        branchId: formData.branchId,
        employeeNumber: formData.employeeNumber,
        phone: formData.phone
      });

      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="bg-emerald-600 text-white rounded-t-xl">
          <CardTitle className="text-2xl">
            {step === 1 ? 'Crear Cuenta' : 'Datos de Empresa'}
          </CardTitle>
          <p className="text-sm text-slate-300 mt-1">
            Paso {step} de 2
          </p>
        </CardHeader>

        <CardContent className="pt-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    🏪 Selecciona tu Sucursal
                  </Label>
                  {loadingBranches ? (
                    <p className="text-gray-500">Cargando sucursales...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {branches.map((branch) => (
                        <button
                          key={branch.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, branchId: branch.id }))}
                          className={`p-3 rounded-lg border-2 transition ${
                            formData.branchId === branch.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-semibold text-sm">{branch.name}</div>
                          <div className="text-xs text-gray-500">{branch.location}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="name" className="mb-2 block">
                    Nombre Completo
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                  />
                </div>

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

                <div>
                  <Label htmlFor="confirmPassword" className="mb-2 block">
                    Confirmar Contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full mt-6"
                  size="lg"
                >
                  Siguiente
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company" className="mb-2 block">
                    Empresa
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Mi Empresa S.A."
                  />
                </div>

                <div>
                  <Label htmlFor="employeeNumber" className="mb-2 block">
                    Número de Empleado
                  </Label>
                  <Input
                    id="employeeNumber"
                    name="employeeNumber"
                    type="text"
                    value={formData.employeeNumber}
                    onChange={handleChange}
                    placeholder="EMP-2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="mb-2 block">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+55 5555-5555"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    size="lg"
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                    size="lg"
                  >
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-emerald-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
