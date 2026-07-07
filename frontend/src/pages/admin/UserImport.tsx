import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../lib/api';
import {
  Upload, CheckCircle, AlertCircle, Download,
  FileCheck, Loader, Users, FileSpreadsheet
} from 'lucide-react';

interface ImportRow {
  name: string;
  email: string;
  phone?: string;
  employeeNumber?: string;
  password?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export const UserImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [branch, setBranch] = useState('');
  const [parsed, setParsed] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<any[]>([]);

  React.useEffect(() => {
    api.get('/admin/branches').then(r => setBranches(r.data)).catch(console.error);
  }, []);

  const downloadTemplate = () => {
    const data = [
      { name: 'Juan Pérez', email: 'juan@empresa.com', phone: '5551234567', employeeNumber: '001', password: 'MealPay2024!' },
      { name: 'María García', email: 'maria@empresa.com', phone: '5559876543', employeeNumber: '002', password: 'MealPay2024!' },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'plantilla_usuarios_mealpay.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    setParsed([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(ws);
        const mapped: ImportRow[] = rows.map(r => ({
          name: String(r.name || r.nombre || r.Name || '').trim(),
          email: String(r.email || r.correo || r.Email || '').trim().toLowerCase(),
          phone: String(r.phone || r.telefono || r.Phone || '').trim(),
          employeeNumber: String(r.employeeNumber || r.numero || r.empleado || '').trim(),
          password: String(r.password || r.contrasena || r.Password || 'MealPay2024!').trim(),
        }));
        setParsed(mapped);
      } catch (err) {
        setError('No se pudo leer el archivo. Verifica que sea .xlsx o .csv válido.');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!parsed.length) { setError('Selecciona un archivo primero'); return; }
    if (!branch)         { setError('Selecciona una sucursal'); return; }

    setImporting(true);
    try {
      const { data } = await api.post('/admin/users/bulk-import', {
        branchId: branch,
        users: parsed,
      });
      setResult(data);
      setFile(null);
      setParsed([]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al importar usuarios');
    } finally {
      setImporting(false);
    }
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500';

  return (
    <div className="min-h-screen bg-slate-950 md:ml-64 pt-16 md:pt-0">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
            <Upload className="w-4 h-4 text-violet-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Importar Usuarios</h1>
        </div>
        <p className="text-sm text-slate-400 ml-11">Carga múltiples comensales desde Excel (.xlsx)</p>
      </div>

      <div className="p-6 max-w-2xl space-y-5">

        {/* Resultado */}
        {result && (
          <div className={`rounded-xl border p-4 ${
            result.failed === 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-start gap-3">
              <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${result.failed === 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Importación completada</p>
                <p className="text-sm text-slate-300 mt-1">
                  <span className="text-emerald-400 font-semibold">{result.success} creados</span>
                  {result.failed > 0 && <span className="text-red-400 font-semibold ml-2">{result.failed} con error</span>}
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-3 bg-slate-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-slate-400">Fila {e.row}: {e.error}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Plantilla */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-1">Formato requerido</p>
              <p className="text-xs text-slate-400 mb-3">
                Columnas: <code className="text-violet-400">name, email, phone, employeeNumber, password</code>
                <br/>La contraseña es opcional (default: MealPay2024!)
              </p>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar plantilla Excel
              </button>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <form onSubmit={handleImport} className="space-y-4">
            {/* Sucursal */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Sucursal destino *
              </label>
              <select value={branch} onChange={e => setBranch(e.target.value)} className={inputCls}>
                <option value="">Selecciona una sucursal</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Archivo Excel / CSV *
              </label>
              <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                file ? 'border-violet-500/50 bg-violet-500/5' : 'border-slate-700 hover:border-violet-500/40'
              }`}>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-violet-400' : 'text-slate-600'}`} />
                {file ? (
                  <>
                    <p className="text-sm font-medium text-slate-200">{file.name}</p>
                    <p className="text-xs text-violet-400 mt-1">{parsed.length} usuarios detectados</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-400">Haz clic para seleccionar o arrastra aquí</p>
                    <p className="text-xs text-slate-600 mt-1">.xlsx, .xls, .csv — máx. 5,000 usuarios</p>
                  </>
                )}
              </label>
            </div>

            {/* Preview */}
            {parsed.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-300">Vista previa ({Math.min(3, parsed.length)} de {parsed.length})</p>
                </div>
                <div className="divide-y divide-slate-700/60">
                  {parsed.slice(0, 3).map((u, i) => (
                    <div key={i} className="px-4 py-2 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-400 text-xs flex items-center justify-center font-bold">{i+1}</div>
                      <div>
                        <p className="text-sm text-slate-200">{u.name || <span className="text-red-400">Sin nombre</span>}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={importing || !file || !branch || parsed.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              {importing ? (
                <><Loader className="w-4 h-4 animate-spin" /> Importando...</>
              ) : (
                <><Upload className="w-4 h-4" /> Importar {parsed.length > 0 ? `${parsed.length} usuarios` : 'usuarios'}</>
              )}
            </button>
          </form>
        </div>

        {/* Tips */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Consejos</p>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li>• Usa la plantilla para evitar errores de columna</li>
            <li>• Los emails duplicados se omiten con un reporte de error</li>
            <li>• El QR se genera automáticamente por usuario</li>
            <li>• El # empleado se auto-genera si no lo incluyes</li>
            <li>• Para 5,000+ usuarios, divide en archivos de 1,000</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
