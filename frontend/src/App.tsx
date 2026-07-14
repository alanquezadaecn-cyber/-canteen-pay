import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, Panel } from './store/useAuthStore';
import { ThemeProvider } from './components/ThemeProvider';
import { AppNav } from './components/AppNav';
import { CashierNav } from './components/CashierNav';
import { AdminNav } from './components/AdminNav';

// Auth
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Impersonate } from './pages/auth/Impersonate';
import { Landing } from './pages/Landing';

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
import { CashierRegister } from './pages/cashier/CashierRegister';
import { CashierUsers } from './pages/cashier/CashierUsers';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BranchDetail } from './pages/admin/BranchDetail';
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
import { PaymentConfig } from './pages/admin/PaymentConfig';
import { CorteDeCaja } from './pages/cashier/CorteDeCaja';
import { Menu } from './pages/user/Menu';
import { Branding } from './pages/admin/Branding';

// ── Helpers ─────────────────────────────────────────────────────────────────

const MASTER_EMAIL = 'alejandro.qt92@gmail.com';

interface SessionUser {
  role?: string;
  email?: string;
  companySlug?: string | null;
  branchSlug?: string | null;
  branchId?: string;
}

// Devuelve la home del usuario SIEMPRE con prefijo empresa/sucursal cuando hay slugs
function getRoleHome(u?: SessionUser): string {
  if (!u) return '/login';
  if (u.role === 'MASTER_ADMIN' || u.email === MASTER_EMAIL) return '/master-admin';
  const c = u.companySlug, b = u.branchSlug;
  if (u.role === 'ADMIN')   return c ? `/${c}/admin` : '/admin';
  if (u.role === 'CASHIER') return c && b ? `/${c}/${b}/caja` : '/cashier';
  return c && b ? `/${c}/${b}/user` : '/dashboard';
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

// Self-healing: si la sesión activa no tiene slugs (sesión vieja), los rellena desde /users/me
function useSlugBackfill() {
  const { user, activePanel } = useAuthStore();
  React.useEffect(() => {
    if (!user) return;
    const needsBranch = activePanel === 'user' || activePanel === 'cashier';
    if (user.companySlug && (!needsBranch || user.branchSlug)) return;
    import('./lib/api').then(({ default: api }) => {
      api.get('/users/me').then(({ data }) => {
        if (data.companySlug || data.branchSlug) {
          useAuthStore.getState().patchUser({
            companySlug: data.companySlug,
            branchSlug: data.branchSlug,
            company: data.company || user.company
          });
        }
      }).catch(() => {});
    });
  }, [user?.id, activePanel]);
}

const PanelSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
  </div>
);

// Autocorrige la URL: si el slug de empresa/sucursal en la URL no coincide
// con el de la sesión (ej. link viejo), reescribe la URL al slug correcto.
function useSlugCorrection(kind: 'company' | 'branch') {
  const params = useParams<{ companySlug?: string; branchSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (!user) return;
    let target = location.pathname;
    if (params.companySlug && user.companySlug && params.companySlug !== user.companySlug) {
      target = target.replace(`/${params.companySlug}`, `/${user.companySlug}`);
    }
    if (kind === 'branch' && params.branchSlug && user.branchSlug && params.branchSlug !== user.branchSlug) {
      target = target.replace(`/${params.branchSlug}`, `/${user.branchSlug}`);
    }
    if (target !== location.pathname) {
      navigate(target + location.search, { replace: true });
    }
  }, [params.companySlug, params.branchSlug, user, location.pathname]);
}

// Layouts: renderizan nav + Outlet. Si no hay sesión, muestran el login inline
// (conservando la URL con empresa/sucursal).

const ComensalLayout: React.FC = () => {
  const { session, ready } = usePanelGuard('user');
  useSlugBackfill();
  useSlugCorrection('branch');
  if (!session) return <Login mode="branch" />;
  if (!ready) return <PanelSpinner />;
  return <><AppNav /><Outlet /></>;
};

const CajaLayout: React.FC = () => {
  const { session, ready } = usePanelGuard('cashier');
  useSlugBackfill();
  useSlugCorrection('branch');
  if (!session) return <Login mode="branch" />;
  if (!ready) return <PanelSpinner />;
  return <><CashierNav /><Outlet /></>;
};

const AdminLayout: React.FC = () => {
  const { session, ready } = usePanelGuard('admin');
  useSlugBackfill();
  useSlugCorrection('company');
  if (!session) return <Login mode="admin" />;
  if (!ready) return <PanelSpinner />;
  return <><AdminNav /><Outlet /></>;
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
  return <Navigate to={getRoleHome(sessions[panel]!.user)} replace />;
};

// Raíz "/": landing informativa si no hay sesión; si hay, al panel correspondiente
const HomeRoute: React.FC = () => {
  const { sessions } = useAuthStore();
  const order: Panel[] = ['master', 'admin', 'cashier', 'user'];
  const panel = order.find(p => sessions[p]);
  if (!panel) return <Landing />;
  return <Navigate to={getRoleHome(sessions[panel]!.user)} replace />;
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

          {/* ── SUPER ADMINISTRADOR ─────────────────────────────────────── */}
          <Route path="/master-admin" element={<SuperAdminRoute><MasterAdminDashboard /></SuperAdminRoute>} />

          {/* ═══ URLS JERÁRQUICAS: empresa/sucursal en TODAS las páginas ═══ */}

          {/* ── ADMIN: /:empresa/admin/* ── */}
          <Route path="/:companySlug/admin" element={<AdminLayout />}>
            <Route index                          element={<AdminDashboard />} />
            <Route path="users"                   element={<UsersList />} />
            <Route path="users/:id"               element={<UserDetail />} />
            <Route path="transactions"            element={<TransactionsList />} />
            <Route path="reports"                 element={<AdminReports />} />
            <Route path="inventory"               element={<Inventory />} />
            <Route path="pagos"                   element={<PaymentConfig />} />
            <Route path="branding"                element={<Branding />} />
            <Route path="branches/:id"            element={<BranchDetail />} />
            <Route path="branches/:branchId/reports" element={<BranchReports />} />
            <Route path="branches/:branchId/import"  element={<UserImport />} />
          </Route>

          {/* ── CAJERO: /:empresa/:sucursal/caja/* ── */}
          <Route path="/:companySlug/:branchSlug/caja" element={<CajaLayout />}>
            <Route index            element={<CashierActionPanel />} />
            <Route path="scan"      element={<QRScanner />} />
            <Route path="recharge"  element={<CashRecharge />} />
            <Route path="registrar" element={<CashierRegister />} />
            <Route path="comensales" element={<CashierUsers />} />
            <Route path="products"  element={<CashierProducts />} />
            <Route path="history"   element={<CashierHistory />} />
            <Route path="corte"     element={<CorteDeCaja />} />
          </Route>

          {/* ── COMENSAL: /:empresa/:sucursal/user/* ── */}
          <Route path="/:companySlug/:branchSlug/user" element={<ComensalLayout />}>
            <Route index              element={<Dashboard />} />
            <Route path="qr"          element={<QRCode />} />
            <Route path="purchases"   element={<Purchases />} />
            <Route path="recharges"   element={<Recharges />} />
            <Route path="recharge/new" element={<RechargeNew />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="payment/failed"  element={<PaymentFailed />} />
            <Route path="statement"   element={<Statement />} />
            <Route path="profile"     element={<Profile />} />
            <Route path="menu"        element={<Menu />} />
          </Route>

          {/* Login de sucursal (cajero/comensal eligen su panel tras entrar) */}
          <Route path="/:companySlug/:branchSlug" element={<Login mode="branch" />} />

          {/* ── LEGACY: redirigen al home con prefijo (compat con links viejos) ── */}
          <Route path="/dashboard"      element={<RootRedirect />} />
          <Route path="/cashier"        element={<RootRedirect />} />
          <Route path="/caja/:branchId" element={<RootRedirect />} />
          <Route path="/admin/dashboard" element={<RootRedirect />} />

          {/* ── DEFAULT ─────────────────────────────────────────────────── */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="*" element={<RootRedirect />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
