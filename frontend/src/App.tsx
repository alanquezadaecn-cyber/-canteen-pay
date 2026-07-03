import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { ThemeProvider } from './components/ThemeProvider';
import { AppNav } from './components/AppNav';
import { CashierNav } from './components/CashierNav';
import { AdminNav } from './components/AdminNav';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/user/Dashboard';
import { QRCode } from './pages/user/QRCode';
import { Purchases } from './pages/user/Purchases';
import { Recharges } from './pages/user/Recharges';
import { RechargeNew } from './pages/user/RechargeNew';
import { Statement } from './pages/user/Statement';
import { Profile } from './pages/user/Profile';
import { PaymentSuccess } from './pages/user/PaymentSuccess';
import { PaymentFailed } from './pages/user/PaymentFailed';

import { CashierDashboard } from './pages/cashier/CashierDashboard';
import { QRScanner } from './pages/cashier/QRScanner';
import { ActionSelector } from './pages/cashier/ActionSelector';
import { ChargeUser } from './pages/cashier/ChargeUser';
import { CashRecharge } from './pages/cashier/CashRecharge';
import { CashierHistory } from './pages/cashier/CashierHistory';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersList } from './pages/admin/UsersList';
import { UserDetail } from './pages/admin/UserDetail';
import { TransactionsList } from './pages/admin/TransactionsList';
import { AdminReports } from './pages/admin/AdminReports';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface CashierRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { accessToken } = useAuthStore();

  if (!accessToken) {
    // Mostrar Login en lugar de redirigir
    return <Login />;
  }

  return (
    <>
      <AppNav />
      {children}
    </>
  );
};

const CashierRoute: React.FC<CashierRouteProps> = ({ children }) => {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) {
    // Mostrar Login en lugar de redirigir
    return <Login />;
  }

  if (!user || (user.role !== 'CASHIER' && user.role !== 'ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <CashierNav />
      {children}
    </>
  );
};

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) {
    // Mostrar Login en lugar de redirigir
    return <Login />;
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
};

function App() {
  const { accessToken } = useAuthStore();

  return (
    <ThemeProvider>
      <Router>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={accessToken ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={accessToken ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr"
          element={
            <ProtectedRoute>
              <QRCode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <Purchases />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recharges"
          element={
            <ProtectedRoute>
              <Recharges />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recharge/new"
          element={
            <ProtectedRoute>
              <RechargeNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/failed"
          element={
            <ProtectedRoute>
              <PaymentFailed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statement"
          element={
            <ProtectedRoute>
              <Statement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Cashier Routes */}
        <Route
          path="/cashier/dashboard"
          element={
            <CashierRoute>
              <CashierDashboard />
            </CashierRoute>
          }
        />
        <Route
          path="/cashier/scan"
          element={
            <CashierRoute>
              <QRScanner />
            </CashierRoute>
          }
        />
        <Route
          path="/cashier/action"
          element={
            <CashierRoute>
              <ActionSelector />
            </CashierRoute>
          }
        />
        <Route
          path="/cashier/charge"
          element={
            <CashierRoute>
              <ChargeUser />
            </CashierRoute>
          }
        />
        <Route
          path="/cashier/recharge"
          element={
            <CashierRoute>
              <CashRecharge />
            </CashierRoute>
          }
        />
        <Route
          path="/cashier/history"
          element={
            <CashierRoute>
              <CashierHistory />
            </CashierRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UsersList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <AdminRoute>
              <UserDetail />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/transactions"
          element={
            <AdminRoute>
              <TransactionsList />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          }
        />

        {/* Main Role Routes - Las 3 URLs principales */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caja"
          element={
            <CashierRoute>
              <CashierDashboard />
            </CashierRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
