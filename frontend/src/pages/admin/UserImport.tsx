import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePanelBase } from '../../hooks/usePanelBase';
import api from '../../lib/api';
import { BulkImportComensales } from '../../components/BulkImportComensales';
import { Upload, ArrowLeft } from 'lucide-react';

export const UserImport: React.FC = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const base = usePanelBase();
  const [branchName, setBranchName] = useState('');

  React.useEffect(() => {
    if (!branchId) return;
    api.get(`/branches/${branchId}`).then(r => setBranchName(r.data.name)).catch(() => {});
  }, [branchId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-5 space-y-5">
        <button
          onClick={() => navigate(`${base}/branches/${branchId}`)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a la sucursal
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Importar comensales</h1>
            <p className="text-sm text-slate-500">
              Sucursal: <span className="text-emerald-600 font-medium">{branchName || '...'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6">
          {branchId && (
            <BulkImportComensales
              endpoint="/admin/users/bulk-import"
              extraBody={{ branchId }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
