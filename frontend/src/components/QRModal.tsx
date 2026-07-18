import React, { useRef } from 'react';
import QRCodeComponent from 'qrcode.react';
import { X, Download, Printer } from 'lucide-react';

interface QRModalProps {
  name: string;
  employeeNumber: string;
  qrCode: string;
  photoUrl?: string | null;
  position?: string | null;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ name, employeeNumber, qrCode, photoUrl, position, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const download = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `QR_${employeeNumber || name}.png`;
    link.click();
  };

  const print = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const w = window.open('', '', 'height=600,width=600');
    if (!w) return;
    const photoHtml = photoUrl
      ? `<img src="${photoUrl}" style="width:90px;height:90px;border-radius:12px;object-fit:cover;border:2px solid #059669;margin:0 auto 10px;display:block" />`
      : '';
    const posHtml = position ? `<div class="pos">${position}</div>` : '';
    w.document.write(`
      <html><head><title>QR - ${name}</title>
      <style>
        body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Arial;margin:0}
        .card{border:2px solid #059669;border-radius:16px;padding:28px;text-align:center}
        h1{color:#0f172a;margin:0 0 2px;font-size:22px}
        .pos{color:#059669;font-weight:700;font-size:13px;margin-bottom:6px}
        .num{font-size:34px;font-weight:800;color:#059669;letter-spacing:3px;margin:8px 0}
        .id{font-size:10px;color:#94a3b8;margin-top:8px;font-family:monospace}
      </style></head>
      <body><div class="card">
        ${photoHtml}
        <h1>${name}</h1>
        ${posHtml}
        <div class="num">${employeeNumber}</div>
        ${canvas.outerHTML}
        <div class="id">${qrCode}</div>
      </div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 150);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 px-6 py-5 flex items-center gap-3">
          {photoUrl && <img src={photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-white/50 flex-shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-lg truncate">{name}</p>
            <p className="text-emerald-100 text-xs">{position || 'Código QR'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div ref={qrRef} className="flex justify-center p-5 bg-white rounded-2xl border-2 border-slate-100 mb-4">
            <QRCodeComponent value={qrCode} size={200} level="H" includeMargin />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center mb-4">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-1">Número de empleado</p>
            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest">{employeeNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={download} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-full transition-colors cursor-pointer">
              <Download className="w-4 h-4" /> Descargar
            </button>
            <button onClick={print} className="flex items-center justify-center gap-2 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-full hover:border-emerald-400 transition-colors cursor-pointer">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
