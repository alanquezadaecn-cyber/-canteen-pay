import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuthStore, Panel, sessionKey } from './store/useAuthStore';
import { ThemeProvider } from './components/ThemeProvider';
import { AppNav } from './components/AppNav';
import { CashierNav } from './components/CashierNav';
import { CashierLockScreen } from './components/CashierLockScreen';
import { useIdleLock } from './hooks/useIdleLock';
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
import { CashierInventory } from './pages/cashier/CashierInventory';
import { CashierAttendance } from './pages/cashier/CashierAttendance';
import { Attendance } from './pages/admin/Attendance';
import { Subsidy } from './pages/admin/Subsidy';
import { MenuRotation } from './pages/admin/MenuRotation';
import { FeatureGuard } from './components/FeatureGuard';

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
import { AccountSuspended } from './pages/admin/AccountSuspended';

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
// Cada guard busca la sesión de ESTA empresa/sucursal específica (según la URL),
// nunca "la sesión de admin que sea" — así abrir el link de otra empresa mientras
// ya tienes sesión abierta en una distinta muestra login, no los datos de la otra.

function usePanelGuard(panel: Panel) {
  const params = useParams<{ companySlug?: string; branchSlug?: string }>();
  const key = sessionKey(panel, params.companySlug, params.branchSlug);
  const { sessions, activeKey } = useAuthStore();
  const session = sessions[key];
  React.useEffect(() => {
    if (session && activeKey !== key) {
      useAuthStore.getState().activateSession(key);
    }
  }, [session, activeKey, key]);
  return { session, ready: activeKey === key };
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

// Layouts: renderizan nav + Outlet. Si no hay sesión, muestran el login inline
// (conservando la URL con empresa/sucursal).

const ComensalLayout: React.FC = () => {
  const { session, ready } = usePanelGuard('user');
  useSlugBackfill();
  if (!session) return <Login mode="branch" />;
  if (!ready) return <PanelSpinner />;
  return <><AppNav /><Outlet /></>;
};

const CajaLayout: React.FC = () => {
  const { session, ready } = usePanelGuard('cashier');
  useSlugBackfill();
  // El panel de caja se queda "siempre abierto": en vez de cerrar sesión por
  // inactividad (lo que obligaría a reloguearse y desgastaría el token), se
  // bloquea la pantalla y solo se desbloquea con la contraseña del cajero.
  const { locked, unlock } = useIdleLock(!!session && ready);
  if (!session) return <Login mode="branch" />;
  if (!ready) return <PanelSpinner />;
  return (
    <>
      <CashierNav />
      <Outlet />
      {locked && <CashierLockScreen onUnlock={unlock} />}
    </>
  );
};

const AdminLayout: React.FC = () => {
  const { session, ready } = usePanelGuard('admin');
  useSlugBackfill();
  if (!session) return <Login mode="admin" />;
  if (!ready) return <PanelSpinner />;
  // La empresa está suspendida (falta de pago, etc.): el admin sí puede entrar, pero
  // solo ve el aviso de suspensión — no el panel operativo.
  if (session.user.companyBlocked) return <AccountSuspended />;
  return <><AdminNav /><Outlet /></>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, ready } = usePanelGuard('master');
  if (!session) return <Navigate to="/login" replace />;
  if (!ready) return <PanelSpinner />;
  return <>{children}</>;
};

// Si dejas una pestaña abierta desde antes de un deploy, el JS viejo se queda
// corriendo en memoria indefinidamente (la SPA no vuelve a pedir index.html sola).
// Esto compara el "boot id" del servidor cada vez que la pestaña recupera foco y,
// si cambió (hubo un deploy), recarga la página para traer el código nuevo.
function useAutoReloadOnDeploy() {
  const bootIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const check = () => {
      fetch('/api/version').then(r => r.json()).then(({ bootId }) => {
        if (bootIdRef.current === null) { bootIdRef.current = bootId; return; }
        if (bootId && bootId !== bootIdRef.current) window.location.reload();
      }).catch(() => {});
    };
    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => { document.removeEventListener('visibilitychange', onVisible); clearInterval(interval); };
  }, []);
}

// Con claves compuestas (panel:empresa:sucursal), busca la primera sesión que exista
// para cada panel en orden de prioridad — sin importar de qué empresa/sucursal sea.
function findAnySession(sessions: Record<string, { user: any }>, order: Panel[] = ['master', 'admin', 'cashier', 'user']) {
  for (const panel of order) {
    const match = Object.entries(sessions).find(([k]) => k === panel || k.startsWith(`${panel}:`));
    if (match) return match[1];
  }
  return null;
}

// Redirige la raíz al panel con sesión activa (prioridad: master > admin > cajero > comensal)
const RootRedirect: React.FC = () => {
  const { sessions } = useAuthStore();
  const session = findAnySession(sessions);
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHome(session.user)} replace />;
};

// Raíz "/": landing informativa si no hay sesión; si hay, al panel correspondiente
const HomeRoute: React.FC = () => {
  const { sessions } = useAuthStore();
  const session = findAnySession(sessions);
  if (!session) return <Landing />;
  return <Navigate to={getRoleHome(session.user)} replace />;
};

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const { sessions, _hasHydrated } = useAuthStore();
  useAutoReloadOnDeploy();
  // Para /login y /register genéricos: redirigir solo si hay sesión de comensal
  const comensalHome = findAnySession(sessions, ['user']) ? '/dashboard' : null;

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
            <Route path="inventory"               element={<FeatureGuard feature="inventory"><Inventory /></FeatureGuard>} />
            <Route path="pagos"                   element={<FeatureGuard feature="payments"><PaymentConfig /></FeatureGuard>} />
            <Route path="asistencia"              element={<FeatureGuard feature="hr"><Attendance /></FeatureGuard>} />
            <Route path="subsidio"                element={<FeatureGuard feature="hr"><Subsidy /></FeatureGuard>} />
            <Route path="menu-semanal"             element={<MenuRotation />} />
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
            <Route path="inventario" element={<FeatureGuard feature="inventory"><CashierInventory /></FeatureGuard>} />
            <Route path="asistencia" element={<FeatureGuard feature="hr"><CashierAttendance /></FeatureGuard>} />
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
