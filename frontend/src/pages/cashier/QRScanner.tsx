import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, Camera, Keyboard } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePanelBase } from '../../hooks/usePanelBase';

export const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const base = usePanelBase();
  const { user } = useAuthStore();
  const branchId = user?.branchId;
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const [manualQR, setManualQR] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanned, setScanned] = useState(false);

  const startCamera = async () => {
    try {
      const qr = new Html5Qrcode('qr-reader-container');
      html5QrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (scanned) return;
          setScanned(true);
          // Navegar directo — el cleanup del useEffect para la cámara al desmontar
          navigate(`${base}?qr=${encodeURIComponent(decoded)}`);
        },
        () => {}
      );
      setCameraActive(true);
      setCameraError('');
    } catch (err: any) {
      setCameraError('No se pudo activar la cámara. Verifica los permisos e intenta de nuevo.');
      setCameraActive(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
        html5QrRef.current = null;
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualQR.replace(/^#/, '').trim();
    if (!clean) return;
    navigate(`${base}?qr=${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 max-w-lg mx-auto space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
            Escanear QR
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Apunta al código QR del comensal
          </p>
        </div>

        {/* Error de cámara */}
        {cameraError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-2 text-sm underline font-medium"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {/* Visor de cámara */}
        <div className="bg-black rounded-xl overflow-hidden relative" style={{ aspectRatio: '1/1' }}>
          <div id="qr-reader-container" className="w-full h-full" />
          {!cameraActive && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm opacity-70">Iniciando cámara...</p>
              </div>
            </div>
          )}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-52 h-52 border-2 border-white/80 rounded-xl" style={{
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)'
              }} />
            </div>
          )}
        </div>

        {cameraActive && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Centra el QR dentro del cuadro amarillo
          </p>
        )}

        {/* Separador */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">O INGRESA MANUALMENTE</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Ingreso manual */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-slate-500" />
              Buscar comensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Nombre, # empleado, email o teléfono"
                value={manualQR}
                onChange={(e) => setManualQR(e.target.value)}
                className="flex-1 text-base"
              />
              <Button
                type="submit"
                disabled={!manualQR.trim()}
                className="bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-300 dark:text-slate-900 text-white font-semibold px-5"
              >
                Ir
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
