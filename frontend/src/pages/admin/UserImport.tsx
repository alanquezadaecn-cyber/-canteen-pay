import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import api from '../../lib/api';
import { Upload, CheckCircle, AlertCircle, Download, Users, FileCheck, Loader } from 'lucide-react';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export const UserImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [branch, setBranch] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<any[]>([]);

  React.useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/admin/branches');
      setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const downloadTemplate = () => {
    const csv = `email,name,phone,company,employeeNumber,branchId
juan@example.com,Juan Pérez,5551234567,Acme Corp,12345,${branches[0]?.id || 'branch-id'}
maria@example.com,María García,5559876543,Acme Corp,12346,${branches[0]?.id || 'branch-id'}
pedro@example.com,Pedro López,5555555555,Acme Corp,12347,${branches[0]?.id || 'branch-id'}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_usuarios.csv';
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file) {
      setError('Por favor selecciona un archivo CSV');
      return;
    }

    if (!branch) {
      setError('Por favor selecciona una sucursal');
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('branchId', branch);

      const { data } = await api.post('/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(data);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al importar usuarios');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Importar Usuarios 📥
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Carga múltiples usuarios de forma masiva desde CSV
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <Card
            variant={result.failed === 0 ? 'elevated' : 'default'}
            className={`border-l-4 ${
              result.failed === 0
                ? 'border-l-emerald-500 dark:border-l-emerald-400'
                : 'border-l-amber-500 dark:border-l-amber-400'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  result.failed === 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  <CheckCircle className={`w-6 h-6 ${
                    result.failed === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${
                    result.failed === 0
                      ? 'text-emerald-900 dark:text-emerald-50'
                      : 'text-amber-900 dark:text-amber-50'
                  }`}>
                    Importación Completada
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className={`text-sm ${
                      result.failed === 0
                        ? 'text-emerald-800 dark:text-emerald-300'
                        : 'text-amber-800 dark:text-amber-300'
                    }`}>
                      ✅ <strong>{result.success}</strong> usuarios importados exitosamente
                    </p>
                    {result.failed > 0 && (
                      <p className="text-sm text-red-800 dark:text-red-300">
                        ❌ <strong>{result.failed}</strong> usuarios con errores
                      </p>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mt-4 bg-slate-100 dark:bg-slate-800 rounded p-3">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Errores encontrados:</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.errors.map((err, idx) => (
                          <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                            Row {err.row}: {err.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Info */}
        <Card variant="flat">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Formato requerido</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  El archivo CSV debe contener las siguientes columnas:
                </p>
                <div className="bg-slate-900 dark:bg-slate-950 rounded p-3 text-xs font-mono text-emerald-400 overflow-x-auto mb-3">
                  <pre>email,name,phone,company,employeeNumber,branchId</pre>
                </div>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Plantilla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Form */}
        <Card variant="elevated">
          <CardHeader borderBottom>
            <CardTitle>Cargar Usuarios</CardTitle>
            <CardDescription>Máximo 5000 usuarios por importación</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleImport} className="space-y-6">
              <div>
                <Label htmlFor="branch" className="mb-2 block font-medium">
                  Sucursal *
                </Label>
                <select
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Selecciona una sucursal</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="file" className="mb-2 block font-medium">
                  Archivo CSV *
                </Label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-violet-400 dark:hover:border-violet-500 transition-colors">
                  <input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file"
                    className="cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {file ? file.name : 'Haz clic para seleccionar archivo'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      o arrastra aquí (máximo 10MB)
                    </p>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={importing || !file || !branch}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white flex items-center justify-center gap-2"
                size="lg"
              >
                {importing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importar Usuarios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card variant="flat">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">💡 Consejos para importación masiva</h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>✅ Usa la plantilla descargable como base</li>
              <li>✅ Verifica que los emails sean únicos</li>
              <li>✅ El employeeNumber debe ser único por sucursal</li>
              <li>✅ Para 5000 usuarios, divide en archivos de 1000 cada uno</li>
              <li>✅ QR se genera automáticamente por usuario</li>
              <li>✅ Los usuarios reciben contraseña temporal por email</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
