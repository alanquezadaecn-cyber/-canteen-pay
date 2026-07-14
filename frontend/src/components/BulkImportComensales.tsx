import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../lib/api';
import {
  Upload, CheckCircle, AlertCircle, Download, Loader, Users, FileSpreadsheet, X
} from 'lucide-react';

interface Row {
  name: string;
  employeeNumber?: string;
  phone?: string;
  email?: string;
  password?: string;
}

interface Result {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  created?: Array<{ name: string; email: string; employeeNumber: string; qrCode: string; password: string }>;
}

interface Props {
  endpoint: string;                 // ej. /admin/users/bulk-import  o  /cashier/branch/:id/bulk-import
  extraBody?: Record<string, any>;  // ej. { branchId }
  onClose?: () => void;
}

export const BulkImportComensales: React.FC<Props> = ({ endpoint, extraBody = {}, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const data = [
      { nombre: 'Juan Pérez', numero: '1001', telefono: '5551234567' },
      { nombre: 'María García', numero: '', telefono: '' },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Comensales');
    XLSX.writeFile(wb, 'plantilla_comensales_cashfood.xlsx');
  };

  const downloadResults = () => {
    if (!result?.created?.length) return;
    const data = result.created.map(u => ({
      nombre: u.name, numeroEmpleado: u.employeeNumber, contrasena: u.password, codigoQR: u.qrCode
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 24 }, { wch: 15 }, { wch: 15 }, { wch: 32 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Comensales');
    XLSX.writeFile(wb, `comensales_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setResult(null); setError(''); setParsed([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]]);
        const mapped: Row[] = rows.map(r => ({
          name: String(r.nombre || r.name || r.Nombre || r.NOMBRE || '').trim(),
          employeeNumber: String(r.numero || r.employeeNumber || r.empleado || r['numero empleado'] || r.numeroEmpleado || '').trim(),
          phone: String(r.telefono || r.phone || r.Telefono || '').trim(),
          email: String(r.email || r.correo || '').trim(),
          password: String(r.password || r.contrasena || '').trim(),
        })).filter(r => r.name);
        setParsed(mapped);
        if (mapped.length === 0) setError('No se encontraron filas con nombre. Revisa que la columna se llame "nombre".');
      } catch {
        setError('No se pudo leer el archivo. Debe ser .xlsx o .csv válido.');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!parsed.length) { setError('Selecciona un archivo con comensales'); return; }
    setImporting(true); setError('');
    try {
      const { data } = await api.post(endpoint, { ...extraBody, users: parsed });
      setResult(data);
      setFile(null); setParsed([]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resultado */}
      {result && (
        <div className={`rounded-2xl border p-4 ${result.failed === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
          <div className="flex items-start gap-3">
            <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${result.failed === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">Importación completada</p>
              <p className="text-sm mt-1">
                <span className="text-emerald-600 font-semibold">{result.success} creados</span>
                {result.failed > 0 && <span className="text-red-500 font-semibold ml-2">{result.failed} con error</span>}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-3 bg-white dark:bg-slate-900 rounded-lg p-3 max-h-28 overflow-y-auto">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <p key={i} className="text-xs text-slate-500">Fila {e.row}: {e.error}</p>
                  ))}
                </div>
              )}
              {(result.created?.length ?? 0) > 0 && (
                <button onClick={downloadResults} className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-full transition-colors cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Descargar Excel con # empleado y QR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl p-3 flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {/* Instrucción mínima + plantilla */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex items-start gap-3">
        <FileSpreadsheet className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Solo necesitas la columna <span className="text-emerald-600">nombre</span></p>
          <p className="text-xs text-slate-500 mt-0.5">Opcionales: <b>numero</b> (# empleado, se genera si falta), teléfono. La contraseña por defecto es el # de empleado.</p>
          <button onClick={downloadTemplate} className="mt-2 flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 text-xs rounded-full transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Descargar plantilla
          </button>
        </div>
      </div>

      {/* Dropzone */}
      <label className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${file ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}>
        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
        <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-emerald-500' : 'text-slate-300'}`} />
        {file ? (
          <>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{file.name}</p>
            <p className="text-xs text-emerald-600 mt-1">{parsed.length} comensales detectados</p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500">Haz clic para seleccionar el Excel</p>
            <p className="text-xs text-slate-400 mt-1">.xlsx, .xls o .csv</p>
          </>
        )}
      </label>

      {/* Preview */}
      {parsed.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <Users className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vista previa ({Math.min(3, parsed.length)} de {parsed.length})</p>
          </div>
          <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            {parsed.slice(0, 3).map((u, i) => (
              <div key={i} className="px-4 py-2 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-bold">{i + 1}</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{u.name}</p>
                {u.employeeNumber && <p className="text-xs text-slate-400">#{u.employeeNumber}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleImport}
          disabled={importing || parsed.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors disabled:opacity-40 cursor-pointer"
        >
          {importing ? <><Loader className="w-4 h-4 animate-spin" /> Importando...</> : <><Upload className="w-4 h-4" /> Importar {parsed.length > 0 ? `${parsed.length}` : ''} comensales</>}
        </button>
        {onClose && (
          <button onClick={onClose} className="px-5 py-3 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:border-slate-400 transition-colors cursor-pointer">
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};
