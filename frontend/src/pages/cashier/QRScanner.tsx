import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AlertCircle, Zap, Keyboard } from 'lucide-react';

export const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement>(null);
  const [manualQR, setManualQR] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!scannerRef.current) return;

    const html5Scanner = new Html5QrcodeScanner(
      scannerRef.current.id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        disableFlip: false
      },
      false
    );

    html5Scanner.render(
      (qrCode) => {
        navigate(`/cashier/action?qr=${encodeURIComponent(qrCode)}`);
      },
      (err) => {
        if (!err.includes('NotFound') && !err.includes('NotFoundException')) {
          console.error('Scanner error:', err);
        }
      }
    );

    return () => {
      html5Scanner.stop().catch(() => {});
    };
  }, [navigate]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQR.trim()) {
      setError('Ingresa un código QR válido');
      return;
    }
    setError('');
    navigate(`/cashier/action?qr=${encodeURIComponent(manualQR)}`);
  };

  return (
    <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold  dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
            Escanear QR 📸
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Apunta la cámara al código QR del cliente
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Scanner Card */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader borderBottom className=" dark:from-amber-900/20 dark:to-orange-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg  dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Scanner QR Activo</CardTitle>
                <CardDescription>Cámara lista</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              id="html5-qrcode-container"
              ref={scannerRef}
              style={{
                width: '100%',
                height: '400px'
              }}
              className="bg-black"
            />
            <div className="p-4  text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-300" />
                <span className="font-semibold">Scanner activo</span>
              </div>
              <p className="text-sm text-amber-100">
                Asegúrate de que el QR esté bien iluminado y dentro del cuadro
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card variant="elevated">
          <CardHeader borderBottom>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg  dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-slate-700 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Ingreso Manual</CardTitle>
                <CardDescription>Si el scanner no funciona</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Código QR del cliente..."
                value={manualQR}
                onChange={(e) => setManualQR(e.target.value)}
                autoFocus
                className="text-base"
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full  hover:from-amber-600 hover:to-orange-600"
                size="lg"
              >
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card variant="flat">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-900 dark:text-slate-50">💡 Tips para mejor escaneo:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Mantén el QR dentro del cuadro rojo</li>
                <li>Asegúrate de buena iluminación</li>
                <li>No muevas el dispositivo rápidamente</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
