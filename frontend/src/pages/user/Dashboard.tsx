import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionItem } from '../../components/TransactionItem';
import { useAuthStore } from '../../store/useAuthStore';
import { usePanelBase } from '../../hooks/usePanelBase';
import api from '../../lib/api';
import {
  QrCode, Plus, UtensilsCrossed, FileText, Download, Printer,
  ChevronRight, Receipt, X
} from 'lucide-react';
import QRCodeComponent from 'qrcode.react';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const base = usePanelBase();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await api.get('/transactions?limit=5');
        setTransactions(data.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `QR_${user?.id || 'mealpay'}.png`;
      link.click();
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '', 'height=600,width=600');
    if (printWindow && qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR - ${user?.name}</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; }
                .container { text-align: center; }
                h1 { color: #059669; margin: 20px 0; }
                p { color: #64748b; margin: 10px 0; }
                img, canvas { border: 2px solid #059669; padding: 10px; border-radius: 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Mi QR</h1>
                <p>${user?.name}</p>
                ${canvas.outerHTML}
                <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">ID: ${user?.qrCode}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 100);
      }
    }
  };

  const balance = parseFloat(user?.balance || '0');
  const [entero, decimales] = balance.toFixed(2).split('.');
  const firstName = user?.name?.split(' ')[0] || '';

  const quickActions = [
    { label: 'Mi QR', icon: QrCode, onClick: () => setShowQRModal(true), main: false },
    { label: 'Recargar', icon: Plus, onClick: () => navigate(`${base}/recharge/new`), main: true },
    { label: 'Menú', icon: UtensilsCrossed, onClick: () => navigate(`${base}/menu`), main: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:ml-64 pb-28 md:pb-8">

      {/* ── HERO: degradado verde con saldo protagonista ── */}
      <div className="relative bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-400 rounded-b-[2.5rem] pt-20 md:pt-10 pb-10 px-5 overflow-hidden">
        {/* brillo decorativo */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto">
          {/* Saludo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-full bg-white/25 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-lg leading-tight">¡Hola, {firstName}!</p>
              <p className="text-emerald-100 text-xs">{user?.company || 'MealPay'}</p>
            </div>
          </div>

          {/* Saldo */}
          <div className="text-center mb-8">
            <p className="text-emerald-50 text-sm font-medium mb-1">Saldo disponible</p>
            <div className="flex items-start justify-center text-white">
              <span className="text-3xl font-bold mt-2 mr-1">$</span>
              <span className="text-6xl font-extrabold tracking-tight" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>{entero}</span>
              <span className="text-2xl font-bold mt-2">.{decimales}</span>
              <span className="text-xs font-semibold mt-3 ml-1 text-emerald-100">MXN</span>
            </div>
          </div>

          {/* Acciones circulares */}
          <div className="flex items-center justify-center gap-8">
            {quickActions.map(({ label, icon: Icon, onClick, main }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className={`rounded-full flex items-center justify-center transition-transform group-active:scale-95 ${
                  main
                    ? 'w-16 h-16 bg-sky-500 shadow-lg shadow-sky-500/40'
                    : 'w-14 h-14 bg-white/25 backdrop-blur'
                }`}>
                  <Icon className={`text-white ${main ? 'w-7 h-7' : 'w-6 h-6'}`} />
                </div>
                <span className="text-white text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Pills de navegación */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => navigate(`${base}/purchases`)}
              className="flex-1 flex items-center justify-between bg-white/20 backdrop-blur rounded-full px-5 py-3 text-white text-sm font-semibold cursor-pointer hover:bg-white/30 transition-colors"
            >
              <span className="flex items-center gap-2"><Receipt className="w-4 h-4" /> Mis compras</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(`${base}/statement`)}
              className="flex-1 flex items-center justify-between bg-white/20 backdrop-blur rounded-full px-5 py-3 text-white text-sm font-semibold cursor-pointer hover:bg-white/30 transition-colors"
            >
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Estado de cuenta</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── HISTORIAL ── */}
      <div className="max-w-lg mx-auto px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Historial</h2>
          <button
            onClick={() => navigate(`${base}/purchases`)}
            className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer"
          >
            {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer h-14 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="px-4">
                <TransactionItem transaction={transaction} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-semibold text-lg">Aún no tienes movimientos</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              Cuando realices tu primera recarga o compra, verás tu historial aquí.
            </p>
          </div>
        )}
      </div>

      {/* ── QR MODAL ── */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
            <div className="bg-gradient-to-b from-emerald-600 to-emerald-500 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg">Mi Código QR</p>
                <p className="text-emerald-100 text-xs">Muéstralo en el comedor para pagar</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div
                ref={qrRef}
                className="flex justify-center p-5 bg-white rounded-2xl border-2 border-slate-100 mb-4"
              >
                <QRCodeComponent
                  value={user?.qrCode || ''}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3 mb-5 text-center">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono">{user?.qrCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadQR}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-full transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={printQR}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-full hover:border-emerald-400 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
