import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { ThemeProvider } from './components/ThemeProvider';
import { AppNav } from './components/AppNav';
import { CashierNav } from './components/CashierNav';
import { AdminNav } from './components/AdminNav';

// Auth
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Comensal
import { Dashboard } from './pages/user/Dashboard';
import { QRCode } from './pages/user/QRCode';
import { Purchases } from './pages/user/Purchases';
import { Recharges } from './pages/user/Recharges';
import { RechargeNew } from './pages/user/RechargeNew';
import { Statement } from './pages/user/Statement';
import { Profile } from './pages/user/Profile';
import { PaymentSuccess } from './pages/user/PaymentSuccess';
import { PaymentFailed } from './pages/user/PaymentFailed';

// Vendedor
import { QRScanner } from './pages/cashier/QRScanner';
import { CashRecharge } from './pages/cashier/CashRecharge';
import { CashierHistory } from './pages/cashier/CashierHistory';
import { CashierActionPanel } from './pages/cashier/CashierActionPanel';
import { CashierProducts } from './pages/cashier/CashierProducts';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BranchDetail } from './pages/admin/BranchDetail';
import { Products } from './pages/admin/Products';
import { BranchReports } from './pages/admin/BranchReports';
import { UsersList } from './pages/admin/UsersList';
import { UserDetail } from './pages/admin/UserDetail';
import { TransactionsList } from './pages/admin/TransactionsList';
import { AdminReports } from './pages/admin/AdminReports';
import { UserImport } from './pages/admin/UserImport';

// Super Admin
import { MasterAdminDashboard } from './pages/master-admin/MasterAdminDashboard';

// Nuevas páginas
import { Inventory } from './pages/admin/Inventory';
import { CorteDeCaja } from './pages/cashier/CorteDeCaja';
import { Menu } from './pages/user/Menu';

// ── Helpers ─────────────────────────────────────────────────────────────────

const MASTER_EMAIL = 'alejandro.qt92@gmail.com';

function getRoleHome(role?: string, branchId?: string, email?: string): string {
  if (role === 'MASTER_ADMIN' || email === MASTER_EMAIL) return '/master-admin';
  switch (role) {
    case 'CASHIER': return `/caja/${branchId || ''}`;
    case 'ADMIN':   return '/admin/dashboard';
    default:        return '/dashboard';
  }
}

// ── Guards ───────────────────────────────────────────────────────────────────

const ComensalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken || user?.role !== 'USER') return <Navigate to="/login" replace />;
  return <><AppNav />{children}</>;
};

const VendedorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken || user?.role !== 'CASHIER') return <Navigate to="/login" replace />;
  return <><CashierNav />{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || user?.email === MASTER_EMAIL;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <><AdminNav />{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  const isMaster = user?.role === 'MASTER_ADMIN' || user?.email === MASTER_EMAIL;
  if (!isMaster) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const { accessToken, user, _hasHydrated, setAuth } = useAuthStore();
  const roleHome = getRoleHome(user?.role, user?.branchId, user?.email);

  // Impersonación: master admin abre panel de empresa con ?t=TOKEN
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    if (!t) return;
    try {
      // Decodificar sin verificar (la verificación ocurre en cada request al backend)
      const payload = JSON.parse(atob(t.split('.')[1]));
      setAuth(
        { id: payload.sub, name: payload.name || payload.email, email: payload.email, role: payload.role, companyId: payload.companyId, branchId: payload.branchId },
        t,
        t
      );
    } catch {}
    // Limpiar el token de la URL
    const clean = new URL(window.location.href);
    clean.searchParams.delete('t');
    window.history.replaceState({}, '', clean.toString());
  }, []);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>

          {/* ── PÚBLICO ─────────────────────────────────────────────────── */}
          <Route
            path="/login/:branchId"
            element={accessToken ? <Navigate to={roleHome} replace /> : <Login />}
          />
          <Route
            path="/login"
            element={accessToken ? <Navigate to={roleHome} replace /> : <Login />}
          />
          <Route
            path="/register"
            element={accessToken ? <Navigate to={roleHome} replace /> : <Register />}
          />
          <Route
            path="/register/:branchId"
            element={accessToken ? <Navigate to={roleHome} replace /> : <Register />}
          />
          <Route
            path="/login/admin/:companySlug"
            element={<Login />}
          />
          <Route
            path="/login/:companySlug/:branchSlug"
            element={<Login />}
          />

          {/* ── COMENSAL ────────────────────────────────────────────────── */}
          <Route path="/dashboard"       element={<ComensalRoute><Dashboard /></ComensalRoute>} />
          <Route path="/qr"              element={<ComensalRoute><QRCode /></ComensalRoute>} />
          <Route path="/purchases"       element={<ComensalRoute><Purchases /></ComensalRoute>} />
          <Route path="/recharges"       element={<ComensalRoute><Recharges /></ComensalRoute>} />
          <Route path="/recharge/new"    element={<ComensalRoute><RechargeNew /></ComensalRoute>} />
          <Route path="/payment/success" element={<ComensalRoute><PaymentSuccess /></ComensalRoute>} />
          <Route path="/payment/failed"  element={<ComensalRoute><PaymentFailed /></ComensalRoute>} />
          <Route path="/statement"       element={<ComensalRoute><Statement /></ComensalRoute>} />
          <Route path="/profile"         element={<ComensalRoute><Profile /></ComensalRoute>} />
          <Route path="/menu"            element={<ComensalRoute><Menu /></ComensalRoute>} />

          {/* ── VENDEDOR ────────────────────────────────────────────────── */}
          <Route path="/caja/:branchId"    element={<VendedorRoute><CashierActionPanel /></VendedorRoute>} />
          <Route path="/cashier/scan"      element={<VendedorRoute><QRScanner /></VendedorRoute>} />
          <Route path="/cashier/recharge"  element={<VendedorRoute><CashRecharge /></VendedorRoute>} />
          <Route path="/cashier/products"  element={<VendedorRoute><CashierProducts /></VendedorRoute>} />
          <Route path="/cashier/history"   element={<VendedorRoute><CashierHistory /></VendedorRoute>} />
          <Route path="/cashier/corte"     element={<VendedorRoute><CorteDeCaja /></VendedorRoute>} />

          {/* ── ADMINISTRADOR ────────────────────────────────────────────── */}
          <Route path="/admin/dashboard"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/branches/:id"                 element={<AdminRoute><BranchDetail /></AdminRoute>} />
          <Route path="/admin/branches/:branchId/products"  element={<AdminRoute><Products /></AdminRoute>} />
          <Route path="/admin/branches/:branchId/reports"   element={<AdminRoute><BranchReports /></AdminRoute>} />
          <Route path="/admin/users"                        element={<AdminRoute><UsersList /></AdminRoute>} />
          <Route path="/admin/users/:id"                    element={<AdminRoute><UserDetail /></AdminRoute>} />
          <Route path="/admin/transactions"                 element={<AdminRoute><TransactionsList /></AdminRoute>} />
          <Route path="/admin/reports"                        element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin/import"                         element={<AdminRoute><UserImport /></AdminRoute>} />
          <Route path="/admin/inventory"                      element={<AdminRoute><Inventory /></AdminRoute>} />

          {/* ── SUPER ADMINISTRADOR ─────────────────────────────────────── */}
          <Route path="/master-admin" element={<SuperAdminRoute><MasterAdminDashboard /></SuperAdminRoute>} />

          {/* ── DEFAULT ─────────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to={accessToken ? roleHome : '/login'} replace />} />
          <Route path="*" element={<Navigate to={accessToken ? roleHome : '/login'} replace />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
