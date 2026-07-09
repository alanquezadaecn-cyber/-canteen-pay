import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, Panel } from './store/useAuthStore';
import { ThemeProvider } from './components/ThemeProvider';
import { AppNav } from './components/AppNav';
import { CashierNav } from './components/CashierNav';
import { AdminNav } from './components/AdminNav';

// Auth
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Impersonate } from './pages/auth/Impersonate';

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
// Cada guard lee SU propia sesión (multi-sesión por panel) y solo renderiza
// cuando su panel está activo, garantizando que los hijos usen el token correcto.

function usePanelGuard(panel: Panel) {
  const { sessions, activePanel } = useAuthStore();
  const session = sessions[panel];
  React.useEffect(() => {
    if (session && activePanel !== panel) {
      useAuthStore.getState().activatePanel(panel);
    }
  }, [session, activePanel, panel]);
  return { session, ready: activePanel === panel };
}

const PanelSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
  </div>
);

const ComensalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, ready } = usePanelGuard('user');
  if (!session) return <Navigate to="/login" replace />;
  if (!ready) return <PanelSpinner />;
  return <><AppNav />{children}</>;
};

const VendedorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, ready } = usePanelGuard('cashier');
  if (!session) return <Navigate to="/login" replace />;
  if (!ready) return <PanelSpinner />;
  return <><CashierNav />{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, ready } = usePanelGuard('admin');
  if (!session) return <Navigate to="/login" replace />;
  if (!ready) return <PanelSpinner />;
  return <><AdminNav />{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, ready } = usePanelGuard('master');
  if (!session) return <Navigate to="/login" replace />;
  if (!ready) return <PanelSpinner />;
  return <>{children}</>;
};

// Redirige la raíz al panel con sesión activa (prioridad: master > admin > cajero > comensal)
const RootRedirect: React.FC = () => {
  const { sessions } = useAuthStore();
  const order: Panel[] = ['master', 'admin', 'cashier', 'user'];
  const panel = order.find(p => sessions[p]);
  if (!panel) return <Navigate to="/login" replace />;
  const u = sessions[panel]!.user;
  return <Navigate to={getRoleHome(u.role, u.branchId, u.email)} replace />;
};

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const { sessions, _hasHydrated } = useAuthStore();
  // Para /login y /register genéricos: redirigir solo si hay sesión de comensal
  const comensalHome = sessions.user ? '/dashboard' : null;

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
          <Route path="/impersonate" element={<Impersonate />} />
          <Route
            path="/login/:branchId"
            element={comensalHome ? <Navigate to={comensalHome} replace /> : <Login />}
          />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/register"
            element={comensalHome ? <Navigate to={comensalHome} replace /> : <Register />}
          />
          <Route
            path="/register/:branchId"
            element={comensalHome ? <Navigate to={comensalHome} replace /> : <Register />}
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
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
