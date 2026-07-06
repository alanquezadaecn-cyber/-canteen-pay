import React from 'react';
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

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BranchDetail } from './pages/admin/BranchDetail';
import { Products } from './pages/admin/Products';
import { BranchReports } from './pages/admin/BranchReports';
import { UsersList } from './pages/admin/UsersList';
import { UserDetail } from './pages/admin/UserDetail';
import { TransactionsList } from './pages/admin/TransactionsList';
import { AdminReports } from './pages/admin/AdminReports';

// Super Admin
import { MasterAdminDashboard } from './pages/master-admin/MasterAdminDashboard';

// ── Helpers ─────────────────────────────────────────────────────────────────

const MASTER_EMAIL = 'alejandro.qt92@gmail.com';

function getRoleHome(role?: string, branchId?: string): string {
  switch (role) {
    case 'CASHIER':      return `/caja/${branchId || ''}`;
    case 'ADMIN':        return '/admin/dashboard';
    case 'MASTER_ADMIN': return '/master-admin';
    default:             return '/dashboard';
  }
}

// ── Guards ───────────────────────────────────────────────────────────────────

const ComensalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (user?.role !== 'USER') return <Navigate to={getRoleHome(user?.role, user?.branchId)} replace />;
  return <><AppNav />{children}</>;
};

const VendedorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (user?.role !== 'CASHIER') return <Navigate to={getRoleHome(user?.role, user?.branchId)} replace />;
  return <><CashierNav />{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN' || user?.email === MASTER_EMAIL;
  if (!isAdmin) return <Navigate to={getRoleHome(user?.role, user?.branchId)} replace />;
  return <><AdminNav />{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  const isMaster = user?.role === 'MASTER_ADMIN' || user?.email === MASTER_EMAIL;
  if (!isMaster) return <Navigate to={getRoleHome(user?.role, user?.branchId)} replace />;
  return <>{children}</>;
};

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const { accessToken, user } = useAuthStore();
  const roleHome = getRoleHome(user?.role, user?.branchId);

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

          {/* ── VENDEDOR ────────────────────────────────────────────────── */}
          <Route path="/caja/:branchId"    element={<VendedorRoute><CashierActionPanel /></VendedorRoute>} />
          <Route path="/cashier/scan"      element={<VendedorRoute><QRScanner /></VendedorRoute>} />
          <Route path="/cashier/recharge"  element={<VendedorRoute><CashRecharge /></VendedorRoute>} />
          <Route path="/cashier/history"   element={<VendedorRoute><CashierHistory /></VendedorRoute>} />

          {/* ── ADMINISTRADOR ────────────────────────────────────────────── */}
          <Route path="/admin/dashboard"                    element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/branches/:id"                 element={<AdminRoute><BranchDetail /></AdminRoute>} />
          <Route path="/admin/branches/:branchId/products"  element={<AdminRoute><Products /></AdminRoute>} />
          <Route path="/admin/branches/:branchId/reports"   element={<AdminRoute><BranchReports /></AdminRoute>} />
          <Route path="/admin/users"                        element={<AdminRoute><UsersList /></AdminRoute>} />
          <Route path="/admin/users/:id"                    element={<AdminRoute><UserDetail /></AdminRoute>} />
          <Route path="/admin/transactions"                 element={<AdminRoute><TransactionsList /></AdminRoute>} />
          <Route path="/admin/reports"                      element={<AdminRoute><AdminReports /></AdminRoute>} />

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
