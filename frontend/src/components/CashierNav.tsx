import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  QrCode,
  DollarSign,
  History,
  LogOut,
  ShoppingBag,
  ClipboardList,
  Users
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBranding } from '../hooks/useBranding';
import { usePanelBase } from '../hooks/usePanelBase';

export const CashierNav: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const branding = useBranding();
  const base = usePanelBase();
  const navItems = [
    { path: base, label: 'Inicio', icon: Home },
    { path: `${base}/scan`, label: 'Escanear', icon: QrCode },
    { path: `${base}/comensales`, label: 'Comensales', icon: Users },
    { path: `${base}/products`, label: 'Menú', icon: ShoppingBag },
    { path: `${base}/history`, label: 'Historial', icon: History },
    { path: `${base}/corte`, label: 'Corte', icon: ClipboardList }
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname === path + '/';

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Desktop Sidebar — claro */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:bg-white md:dark:bg-slate-900 md:border-r md:border-slate-100 md:dark:border-slate-800 z-40">
        <div className="flex items-center justify-center gap-2 h-16 border-b border-slate-100 dark:border-slate-800 px-4">
          {branding?.logoUrl && <img src={branding.logoUrl} alt="" className="w-7 h-7 object-contain rounded" />}
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{branding?.name || 'CashFood'}</h1>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex-shrink-0">
            Caja
          </span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors text-sm font-medium ${
                isActive(path)
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-3 tracking-wide">
            by <span className="font-semibold text-slate-500">th3seo.com</span>
          </p>
        </div>
      </div>

      {/* Mobile Header — verde marca */}
      <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white md:hidden z-40">
        <div className="flex items-center justify-between h-14 px-5">
          <div className="flex items-center gap-2">
            {branding?.logoUrl && <img src={branding.logoUrl} alt="" className="w-6 h-6 object-contain rounded bg-white/20 p-0.5" />}
            <h1 className="text-base font-bold truncate max-w-[180px]">{branding?.name || 'CashFood'}</h1>
            <span className="px-2 py-0.5 bg-white/25 text-white text-[10px] font-bold rounded-full">
              Caja
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav — barra flotante redondeada */}
      <div className="fixed bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-[1.75rem] shadow-xl shadow-slate-900/10 border border-slate-100 dark:border-slate-800 md:hidden z-40">
        <div className="flex justify-around px-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-0.5 transition-colors ${
                isActive(path)
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive(path) ? 2.2 : 1.8} />
              <span className={`text-[10px] ${isActive(path) ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
