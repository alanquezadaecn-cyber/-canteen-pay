import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';
import { ImagePlus, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// Redimensiona la imagen en canvas para mantener el payload liviano (máx 320px, PNG)
function resizeImage(file: File, maxSize = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No se pudo procesar la imagen'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Imagen inválida'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export const Branding: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/branding')
      .then(({ data }) => {
        setLogoUrl(data.logoUrl || null);
        setCompanyName(data.name || '');
      })
      .catch(() => setError('No se pudo cargar la información de la empresa'))
      .finally(() => setLoading(false));
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess(false);

    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen (PNG, JPG, SVG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado pesada. Usa un archivo menor a 5MB.');
      return;
    }

    try {
      const dataUrl = await resizeImage(file);
      setLogoUrl(dataUrl);
    } catch {
      setError('No se pudo procesar la imagen');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.put('/branding/logo', { logoUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el logo');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('¿Quitar el logo personalizado?')) return;
    setSaving(true);
    setError('');
    try {
      await api.put('/branding/logo', { logoUrl: null });
      setLogoUrl(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al quitar el logo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 md:ml-64 pt-16 md:pt-0 flex items-center justify-center">
        <Loader className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 md:ml-64 pt-16 md:pt-0">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
            <ImagePlus className="w-4 h-4 text-violet-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Marca / Logo</h1>
        </div>
        <p className="text-sm text-slate-400 ml-11">
          Personaliza el logo de <span className="text-violet-400 font-medium">{companyName}</span> en pantallas de login, panel y navegación
        </p>
      </div>

      <div className="p-6 max-w-lg space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-300">Logo guardado. Ya se verá en todas las pantallas.</p>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          {/* Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span className="text-3xl font-bold text-slate-600">{companyName?.[0] || 'M'}</span>
              )}
            </div>
            {!logoUrl && (
              <p className="text-xs text-slate-500 text-center max-w-xs">
                Sin logo personalizado — se muestra "CashFood" por defecto
              </p>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              {logoUrl ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
            {logoUrl && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-red-900 text-red-400 hover:bg-red-950 transition-colors cursor-pointer disabled:opacity-40"
                title="Quitar logo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 cursor-pointer"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar logo'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            Recomendado: imagen cuadrada, fondo transparente (PNG). Se ajusta automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};
