import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Users, BarChart3, LogOut, Menu, X,
  BarChart2, Bell, Check, Package
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBranding } from '../hooks/useBranding';
import api from '../lib/api';

interface Alert {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user?: { name: string; email: string };
}

export const AdminNav: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const branding = useBranding();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const navItems = [
    { path: '/admin/dashboard',    label: 'Dashboard',      icon: Home },
    { path: '/admin/users',        label: 'Usuarios',       icon: Users },
    { path: '/admin/transactions', label: 'Transacciones',  icon: BarChart3 },
    { path: '/admin/reports',      label: 'Reportes',       icon: BarChart2 },
    { path: '/admin/inventory',    label: 'Inventario',     icon: Package },
  ];

  const isActive = (path: string) => location.pathname === path;

  const fetchAlerts = async () => {
    try {
      const { data } = await api.get('/admin/alerts?unread=true');
      setAlerts(data);
    } catch {}
  };

  useEffect(() => {
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 30000);
    return () => clearInterval(iv);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/admin/alerts/read-all');
      setAlerts([]);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const AlertPanel = () => (
    <div className="absolute right-0 top-10 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Alertas ({unreadCount})</span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer">
            <Check className="w-3 h-3" /> Marcar todas
          </button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Sin alertas</p>
        ) : alerts.map(a => (
          <div key={a.id} className="px-4 py-3">
            <p className="text-xs font-semibold text-emerald-600">{a.user?.name || 'Usuario'}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{a.message}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(a.createdAt).toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar — claro */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:bg-white md:dark:bg-slate-900 md:border-r md:border-slate-100 md:dark:border-slate-800 z-40">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            {branding?.logoUrl && <img src={branding.logoUrl} alt="" className="w-7 h-7 object-contain rounded flex-shrink-0" />}
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{branding?.name || 'MealPay'}</h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex-shrink-0">Admin</span>
          </div>
          {/* Bell */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showAlerts && <AlertPanel />}
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-colors text-sm font-medium ${
                isActive(path)
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-3 tracking-wide">
            Powered by <span className="font-semibold text-slate-500">MealPay</span>
          </p>
        </div>
      </div>

      {/* Mobile Header — verde marca */}
      <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white md:hidden z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2 min-w-0">
            {branding?.logoUrl && <img src={branding.logoUrl} alt="" className="w-6 h-6 object-contain rounded bg-white/20 p-0.5 flex-shrink-0" />}
            <h1 className="text-base font-bold truncate">{branding?.name || 'MealPay'}</h1>
            <span className="px-2 py-0.5 bg-white/25 text-white text-[10px] font-bold rounded-full flex-shrink-0">Admin</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button onClick={() => setShowAlerts(!showAlerts)} className="relative p-1.5 text-emerald-100 cursor-pointer">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showAlerts && <AlertPanel />}
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 cursor-pointer">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed top-14 left-0 right-0 bg-white dark:bg-slate-900 md:hidden z-30 border-b border-slate-100 dark:border-slate-800 shadow-lg">
          <nav className="p-3 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-colors text-sm font-medium ${
                  isActive(path)
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-sm font-medium mt-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Nav — barra flotante redondeada */}
      <div className="fixed bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-[1.75rem] shadow-xl shadow-slate-900/10 border border-slate-100 dark:border-slate-800 md:hidden z-30">
        <div className="flex justify-around px-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-0.5 transition-colors ${
                isActive(path) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive(path) ? 2.2 : 1.8} />
              <span className={`text-[10px] ${isActive(path) ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Overlay para cerrar alertas */}
      {showAlerts && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAlerts(false)} />
      )}
    </>
  );
};
