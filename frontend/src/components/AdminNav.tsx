import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Users, BarChart3, LogOut, Menu, X,
  BarChart2, Upload, Bell, Check, Package
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
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
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const navItems = [
    { path: '/admin/dashboard',    label: 'Dashboard',      icon: Home },
    { path: '/admin/users',        label: 'Usuarios',       icon: Users },
    { path: '/admin/transactions', label: 'Transacciones',  icon: BarChart3 },
    { path: '/admin/reports',      label: 'Reportes',       icon: BarChart2 },
    { path: '/admin/inventory',    label: 'Inventario',     icon: Package },
    { path: '/admin/import',       label: 'Importar',       icon: Upload },
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
    <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <span className="text-sm font-semibold text-white">Alertas ({unreadCount})</span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer">
            <Check className="w-3 h-3" /> Marcar todas
          </button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-700">
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Sin alertas</p>
        ) : alerts.map(a => (
          <div key={a.id} className="px-4 py-3">
            <p className="text-xs font-semibold text-violet-400">{a.user?.name || 'Usuario'}</p>
            <p className="text-xs text-slate-300 mt-0.5">{a.message}</p>
            <p className="text-xs text-slate-600 mt-1">
              {new Date(a.createdAt).toLocaleString('es-MX', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:bg-slate-900 md:text-white">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">MealPay</h1>
            <span className="px-2 py-0.5 bg-violet-600 text-white text-xs font-bold rounded">Admin</span>
          </div>
          {/* Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                isActive(path)
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900 text-white md:hidden z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">MealPay</h1>
            <span className="px-2 py-0.5 bg-violet-600 text-white text-xs font-bold rounded">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowAlerts(!showAlerts)} className="relative p-1.5 text-slate-400 cursor-pointer">
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
        <div className="fixed top-14 left-0 right-0 bg-slate-900 text-white md:hidden z-30 border-b border-slate-800">
          <nav className="p-3 space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive(path) ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors text-sm mt-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 md:hidden z-30">
        <div className="flex justify-around">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 ${
                isActive(path) ? 'text-violet-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
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
