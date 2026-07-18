import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';
import {
  QrCode, DollarSign, TrendingUp, Clock, Zap, RefreshCw, Smartphone,
  Wifi, WifiOff, AlertCircle, CheckCircle, Copy, LogOut, User
} from 'lucide-react';
import io from 'socket.io-client';

interface Summary {
  totalTransactions: number;
  totalCharges: number;
  totalChargesAmount: string;
  averageCharge: string;
  totalRecharges: number;
  totalRechargesAmount: string;
  date: string;
}

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
  user: {
    name: string;
    employeeNumber: string;
  };
}

interface CashierSession {
  sessionId: string;
  connected: boolean;
  scannerConnected: boolean;
  lastScanned: string | null;
  isMobile: boolean;
}

export const CashierDashboardMobile: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // WebSocket & Pairing
  const [session, setSession] = useState<CashierSession>({
    sessionId: '',
    connected: false,
    scannerConnected: false,
    lastScanned: null,
    isMobile: /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  });
  const [pairingCode, setPairingCode] = useState('');
  const socketRef = React.useRef<any>(null);
  const [copied, setCopied] = useState(false);

  // Inicializar sesión y WebSocket
  useEffect(() => {
    const sessionId = generateSessionId();
    setSession(prev => ({ ...prev, sessionId }));

    // Conectar WebSocket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      query: {
        type: 'cashier-panel',
        sessionId
      }
    });

    socket.on('connect', () => {
      setSession(prev => ({ ...prev, connected: true }));
      setError('');
      console.log('✓ Panel conectado al servidor');
    });

    socket.on('disconnect', () => {
      setSession(prev => ({ ...prev, connected: false, scannerConnected: false }));
      console.log('✗ Panel desconectado');
    });

    // Cuando el scanner se conecta
    socket.on('scanner-paired', (data: any) => {
      setSession(prev => ({ ...prev, scannerConnected: true }));
      console.log('✓ Scanner emparejado');
    });

    // Cuando el scanner envía un QR
    socket.on('qr-scanned', async (data: any) => {
      console.log('📱 QR recibido:', data.qrCode);
      setSession(prev => ({ ...prev, lastScanned: data.qrCode }));

      // Auto-ir a procesar cobro
      navigate(`/cashier/action?qr=${encodeURIComponent(data.qrCode)}`);
    });

    socket.on('error', (err: any) => {
      setError(err.message || 'Error de conexión');
    });

    socketRef.current = socket;

    // Fetch inicial de datos
    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [navigate]);

  const generateSessionId = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const fetchData = async () => {
    try {
      const [summaryRes, historyRes] = await Promise.all([
        api.get('/cashier/summary'),
        api.get('/cashier/history?limit=5')
      ]);

      setSummary(summaryRes.data);
      setTransactions(historyRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cashier data:', err);
      setLoading(false);
    }
  };

  const handlePairingCode = async (code: string) => {
    if (socketRef.current && code.trim().length === 9) {
      socketRef.current.emit('pair-scanner', { code });
      setPairingCode('');
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(session.sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openScannerApp = () => {
    window.open(
      `/cashier/scanner?session=${session.sessionId}`,
      session.isMobile ? '_self' : '_blank',
      session.isMobile ? '' : 'width=500,height=800'
    );
  };

  if (loading && !session.sessionId) {
    return (
      <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Inicializando...</p>
        </div>
      </div>
    );
  }

  // Layout móvil
  if (session.isMobile) {
    return (
      <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900">
        {/* Header Móvil */}
        <div className="sticky top-0 z-50  dark:from-amber-900 dark:to-orange-900 text-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">🏪 Mi Caja</h1>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              session.connected ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
              {session.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {session.connected ? 'En línea' : 'Offline'}
            </div>
          </div>

          {/* Connection Status */}
          {session.scannerConnected ? (
            <div className="bg-emerald-500/30 rounded p-2 flex items-center gap-2 text-xs">
              <Smartphone className="w-4 h-4" />
              <span>Scanner conectado ✓</span>
            </div>
          ) : (
            <div className="bg-orange-500/30 rounded p-2 flex items-center gap-2 text-xs">
              <Smartphone className="w-4 h-4" />
              <span>Scanner desconectado</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 pb-20">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones de Acción Principales - Grande en móvil */}
          <div className="space-y-3">
            <Button
              onClick={openScannerApp}
              className="w-full h-16  hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-center gap-3 text-lg font-bold rounded-xl"
            >
              <QrCode className="w-6 h-6" />
              {session.isMobile ? 'Abrir Scanner' : 'Scanner en otra ventana'}
            </Button>

            <Button
              onClick={() => navigate('/cashier/recharge')}
              className="w-full h-14  hover:from-emerald-600 hover:to-teal-600 text-white flex items-center justify-center gap-2 text-base font-semibold rounded-xl"
            >
              <DollarSign className="w-5 h-5" />
              Recarga Efectivo
            </Button>
          </div>

          {/* Stats Compacto */}
          {summary && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 space-y-3">
              <h2 className="font-bold text-slate-900 dark:text-slate-50">Estadísticas Hoy</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className=" dark:from-red-900/20 dark:to-orange-900/20 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Cobros</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    ${summary.totalChargesAmount}
                  </p>
                  <p className="text-xs text-slate-500">x{summary.totalCharges}</p>
                </div>

                <div className=" dark:from-emerald-900/20 dark:to-teal-900/20 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Recargas</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${summary.totalRechargesAmount}
                  </p>
                  <p className="text-xs text-slate-500">x{summary.totalRecharges}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pairing Card */}
          <Card variant="flat" className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-2">
                📱 Conectar Scanner
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Mi código de sesión:
              </p>
              <div className="flex gap-2 mb-3">
                <code className="flex-1 bg-slate-100 dark:bg-slate-900 p-2 rounded font-mono font-bold text-center text-emerald-600 dark:text-emerald-400">
                  {session.sessionId}
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
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                O ingresa código de scanner:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="ABC123XYZ"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  maxLength={9}
                  className="text-center font-mono text-lg tracking-widest"
                />
                <Button
                  onClick={() => handlePairingCode(pairingCode)}
                  disabled={pairingCode.length !== 9}
                  variant="primary"
                >
                  OK
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Últimas Transacciones */}
          {transactions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm px-1">
                Últimas operaciones
              </h3>
              {transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-slate-800 p-3 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-50 text-sm truncate">
                      {tx.user.name}
                    </p>
                    <p className="text-xs text-slate-500">#{tx.user.employeeNumber}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className={`font-bold text-sm ${
                      tx.type === 'PURCHASE'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {tx.type === 'PURCHASE' ? '-' : '+'}${parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 flex gap-1">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            <User className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => navigate('/cashier')}
            variant="primary"
            size="sm"
            className="flex-1 text-xs"
          >
            <Zap className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Layout Desktop (original)
  return (
    <div className="min-h-screen  dark:from-slate-950 dark:to-slate-900 md:ml-64 pt-20 md:pt-0 pb-24 md:pb-0">
      <div className="p-4 md:p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold  dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
              Panel de Caja 🏪
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {summary?.date ? new Date(summary.date).toLocaleDateString('es-MX', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              }) : 'Hoy'}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
            session.connected
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {session.connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            {session.connected ? 'En línea' : 'Desconectado'}
          </div>
        </div>

        {/* Conexión con Scanner */}
        {!session.scannerConnected && (
          <Card variant="elevated" className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">
                    Conectar Scanner Móvil
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Abre la app en tu móvil e ingresa este código:
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-slate-100 dark:bg-slate-900 p-3 rounded font-mono font-bold text-center text-emerald-600 dark:text-emerald-400 text-lg">
                      {session.sessionId}
                    </code>
                    <Button
                      onClick={copySessionId}
                      size="sm"
                      variant="outline"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resto del contenido original */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="elevated" className="animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Cobros Hoy</p>
                    <p className="text-3xl font-bold  bg-clip-text text-transparent mt-2">
                      ${summary.totalChargesAmount}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg  opacity-10">
                    <DollarSign className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Qty Cobros</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                      {summary.totalCharges}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg  opacity-10">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Recargas</p>
                    <p className="text-3xl font-bold  bg-clip-text text-transparent mt-2">
                      ${summary.totalRechargesAmount}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg  opacity-10">
                    <TrendingUp className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase">Promedio</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                      ${summary.averageCharge}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg  opacity-10">
                    <DollarSign className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
