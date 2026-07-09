import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  QrCode,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  UtensilsCrossed
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBranding } from '../hooks/useBranding';

export const AppNav: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const branding = useBranding();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Inicio', icon: Home },
    { path: '/menu', label: 'Menú', icon: UtensilsCrossed },
    { path: '/purchases', label: 'Compras', icon: ShoppingCart },
    { path: '/qr', label: 'Mi QR', icon: QrCode },
    { path: '/recharges', label: 'Recargas', icon: CreditCard },
    { path: '/profile', label: 'Perfil', icon: User }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:bg-slate-900 md:text-white">
        <div className="flex items-center justify-center gap-2 h-16 border-b border-slate-800">
          {branding?.logoUrl && <img src={branding.logoUrl} alt="" className="w-7 h-7 object-contain rounded" />}
          <h1 className="text-xl font-bold">{branding?.name || 'MealPay'}</h1>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(path)
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
          <p className="text-center text-[10px] text-slate-600 mt-3 tracking-wide">
            Powered by <span className="font-semibold text-slate-500">MealPay</span>
          </p>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900 text-white md:hidden z-40">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            {branding?.logoUrl && <img src={branding.logoUrl} alt="" className="w-6 h-6 object-contain rounded" />}
            <h1 className="text-lg font-bold">{branding?.name || 'MealPay'}</h1>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed top-16 left-0 right-0 bg-slate-900 text-white md:hidden z-30">
          <nav className="p-4 space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-emerald-600'
                    : 'hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </button>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden">
        <div className="flex justify-around">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center py-3 text-xs ${
                isActive(path)
                  ? 'text-emerald-600 border-t-2 border-emerald-600'
                  : 'text-slate-600'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
