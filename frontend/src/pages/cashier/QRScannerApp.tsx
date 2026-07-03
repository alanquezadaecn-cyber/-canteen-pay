import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AlertCircle, Wifi, WifiOff, Zap, Copy, CheckCircle } from 'lucide-react';
import io from 'socket.io-client';

interface Connection {
  connected: boolean;
  sessionId: string | null;
  cashierId: string | null;
  lastScanned: string | null;
}

export const QRScannerApp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  const [connection, setConnection] = useState<Connection>({
    connected: false,
    sessionId: null,
    cashierId: null,
    lastScanned: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  // Obtener sessionId de URL o generar uno
  useEffect(() => {
    const sessionId = searchParams.get('session') || generateSessionId();
    setConnection(prev => ({ ...prev, sessionId }));

    // Conectar con WebSocket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      query: {
        type: 'cashier-scanner',
        sessionId
      }
    });

    socket.on('connect', () => {
      console.log('✓ Conectado al servidor');
      setConnection(prev => ({ ...prev, connected: true }));
      setError('');
    });

    socket.on('disconnect', () => {
      console.log('✗ Desconectado');
      setConnection(prev => ({ ...prev, connected: false }));
    });

    socket.on('cashier-paired', (data: any) => {
      console.log('✓ Emparejado con cajero:', data);
      setConnection(prev => ({
        ...prev,
        cashierId: data.cashierId,
        sessionId: data.sessionId
      }));
    });

    socket.on('error', (err: any) => {
      setError(err.message || 'Error de conexión');
    });

    socketRef.current = socket;
    setLoading(false);

    return () => {
      socket.disconnect();
    };
  }, []);

  // Inicializar scanner
  useEffect(() => {
    if (!scannerRef.current || !connection.connected) return;

    const html5Scanner = new Html5QrcodeScanner(
      scannerRef.current.id,
      {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        disableFlip: false
      },
      false
    );

    html5Scanner.render(
      (qrCode) => {
        console.log('✓ QR escaneado:', qrCode);

        // Enviar QR al panel del cajero
        if (socketRef.current) {
          socketRef.current.emit('qr-scanned', {
            qrCode,
            timestamp: new Date().toISOString()
          });
        }

        // Mostrar feedback
        setConnection(prev => ({ ...prev, lastScanned: qrCode }));
        setScannedCount(prev => prev + 1);

        // Vibrar (si disponible)
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        // Reproducir sonido
        playSuccessSound();
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
  }, [connection.connected]);

  const generateSessionId = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const copySessionId = () => {
    if (connection.sessionId) {
      navigator.clipboard.writeText(connection.sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Inicializando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50  dark:from-amber-900 dark:to-orange-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">🏪 Caja QR</h1>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connection.connected
                ? 'bg-emerald-500'
                : 'bg-red-500'
            }`}>
              {connection.connected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs font-semibold">En línea</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs font-semibold">Desconectado</span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-amber-100">Escanea QR de clientes</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Status Card */}
        <Card variant="elevated" className="bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            {error ? (
              <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error de conexión</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : connection.connected && connection.cashierId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <p className="font-semibold">Conectado al Panel</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded p-3 text-sm">
                  <p className="text-slate-600 dark:text-slate-400">Cajero ID: <code className="font-mono">{connection.cashierId}</code></p>
                </div>
                <div className="text-center text-2xl font-bold text-amber-600">
                  📊 {scannedCount} QR escaneados
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  Esperando emparejamiento con panel...
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-semibold">
                    Mi Código de Sesión:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white dark:bg-slate-700 p-2 rounded text-center font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                      {connection.sessionId}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copySessionId}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Ingresa este código en el panel del escritorio
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scanner */}
        {connection.connected ? (
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className=" dark:from-amber-900/30 dark:to-orange-900/30">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Escanea QR del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div
                id="html5-qrcode-container"
                ref={scannerRef}
                style={{ width: '100%', height: '400px' }}
                className="bg-black"
              />
              <div className="p-4 bg-amber-900 text-white text-center text-sm">
                <p className="font-semibold">🎯 Apunta al QR del cliente</p>
                <p className="text-xs text-amber-100 mt-1">El panel se actualizará automáticamente</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card variant="flat">
            <CardContent className="pt-12 pb-12 text-center">
              <WifiOff className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Esperando conexión...
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Asegúrate que el panel del escritorio tenga esta aplicación abierta
              </p>
            </CardContent>
          </Card>
        )}

        {/* Last Scanned */}
        {connection.lastScanned && (
          <Card variant="flat" className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-2">
                Último QR escaneado:
              </p>
              <code className="block bg-slate-900 dark:bg-black text-emerald-400 p-3 rounded text-xs font-mono break-all">
                {connection.lastScanned}
              </code>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card variant="flat">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3 text-sm">
              💡 Cómo funciona:
            </h3>
            <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>1️⃣ Abre esta app en tu móvil</li>
              <li>2️⃣ Copia el código de sesión</li>
              <li>3️⃣ Ingresa el código en el panel del escritorio</li>
              <li>4️⃣ Escanea QR aquí → Se actualiza en escritorio</li>
              <li>5️⃣ Panel procesa el pago automáticamente</li>
            </ol>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button
          onClick={() => navigate('/cashier')}
          variant="outline"
          className="w-full"
        >
          ← Volver al Panel
        </Button>
      </div>
    </div>
  );
};
