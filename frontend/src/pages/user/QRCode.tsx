import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Download, Printer, Share2, Copy, CheckCircle, Loader } from 'lucide-react';
import QRCodeComponent from 'qrcode.react';
import api from '../../lib/api';

interface QRData {
  qrCode: string;
  name: string;
  employeeNumber: string;
}

export const QRCode: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('large');
  const qrRef = useRef<HTMLDivElement>(null);

  // Datos frescos del backend — el store puede tener una sesión vieja sin QR
  const [qrData, setQrData] = useState<QRData>({
    qrCode: user?.qrCode || '',
    name: user?.name || '',
    employeeNumber: user?.employeeNumber || ''
  });

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => {
        setQrData({
          qrCode: data.qrCode || '',
          name: data.name || '',
          employeeNumber: data.employeeNumber || ''
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isNumericCode = /^\d{5}$/.test(qrData.employeeNumber);

  const sizeMap = { small: 150, medium: 250, large: 350 };

  const downloadQR = (format: 'png' | 'svg' = 'png') => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL(`image/${format}`);
      link.download = `QR_${user?.id || 'canteen'}.${format}`;
      link.click();
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (printWindow && qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Mi Código QR - CashFood</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  background: #f8fafc;
                  margin: 0;
                  padding: 20px;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 16px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                }
                h1 {
                  color: #059669;
                  margin: 0 0 10px 0;
                  font-size: 28px;
                }
                .user-info {
                  background: linear-gradient(135deg, #059669 0%, #14b8a6 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 12px;
                  margin: 20px 0;
                }
                .user-info h2 {
                  margin: 0 0 5px 0;
                  font-size: 20px;
                }
                .user-info p {
                  margin: 0;
                  opacity: 0.9;
                  font-size: 14px;
                }
                .qr-box {
                  background: #f1f5f9;
                  padding: 20px;
                  border-radius: 12px;
                  margin: 20px 0;
                  display: inline-block;
                }
                .qr-box img, .qr-box canvas {
                  width: 300px;
                  height: 300px;
                }
                .footer {
                  color: #64748b;
                  font-size: 12px;
                  margin-top: 20px;
                  text-align: center;
                }
                .qr-id {
                  font-family: monospace;
                  background: #e2e8f0;
                  padding: 8px 12px;
                  border-radius: 6px;
                  margin-top: 10px;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🎫 Mi Código QR</h1>
                <div class="user-info">
                  <h2>${qrData.name}</h2>
                  <p>${qrData.employeeNumber}</p>
                </div>
                <p style="color: #64748b; font-size: 14px;">Usa este código en el comedor</p>
                <div class="qr-box">
                  ${canvas.outerHTML}
                </div>
                <div class="qr-id">
                  ID: ${qrData.qrCode}
                </div>
                <div class="footer">
                  <p>Impreso desde CashFood</p>
                  <p>${new Date().toLocaleDateString('es-MX')}</p>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 100);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 flex items-center justify-center">
        <Loader className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!qrData.qrCode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">QR no disponible</p>
          <p className="text-sm text-slate-500">Tu código QR aún no está generado. Contacta al administrador del comedor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-lg space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Mi Código QR
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Comparte este código para realizar pagos en el comedor
            </p>
          </div>

          {/* Main Card */}
          <Card variant="elevated" className="shadow-2xl animate-scale-in">
            <CardHeader borderBottom>
              <CardTitle className="text-center">Tu Código QR Personal</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              {/* QR Display */}
              <div
                ref={qrRef}
                className="flex justify-center p-6 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700"
              >
                <QRCodeComponent
                  value={qrData.qrCode}
                  size={sizeMap[size]}
                  level="H"
                  includeMargin={true}
                  renderAs="canvas"
                />
              </div>

              {/* Código numérico destacado */}
              {isNumericCode && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-1">
                    Tu código de acceso
                  </p>
                  <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest">
                    {qrData.employeeNumber}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Díselo al cajero si no pueden escanear el QR
                  </p>
                </div>
              )}

              {/* User Info */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{qrData.name}</h3>
                {!isNumericCode && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Empleado #{qrData.employeeNumber}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-700 p-3 rounded mt-2">
                  <code className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                    {qrData.qrCode}
                  </code>
                  <Button size="iconSm" variant="ghost" onClick={copyToClipboard}>
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tamaño del QR
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map(s => (
                    <Button
                      key={s}
                      variant={size === s ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSize(s)}
                      className="capitalize"
                    >
                      {s === 'small' && 'Pequeño'}
                      {s === 'medium' && 'Medio'}
                      {s === 'large' && 'Grande'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => downloadQR('png')}
                >
                  <Download className="w-4 h-4" />
                  Descargar como Imagen
                </Button>
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={printQR}
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    const text = `Mi código QR: ${qrData.qrCode}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'CashFood QR',
                        text: text
                      });
                    } else {
                      copyToClipboard();
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              </div>

              {/* Tips */}
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ten este QR a mano en el comedor para pagos rápidos. Puedes guardar la imagen en tu teléfono o imprimirlo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
