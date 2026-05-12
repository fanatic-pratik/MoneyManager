import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import SelectAccount from './pages/SelectAccount';
import CreateAccount from './pages/CreateAccount';
import JoinAccount from './pages/JoinAccount';
import Settings from './pages/Settings';
import { AccountProvider } from './context/AccountContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="categories" element={<Categories />} />
        <Route path="select-account" element={<SelectAccount />} />
        <Route path="create-account" element={<CreateAccount />} />
        <Route path="join-account" element={<JoinAccount />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AccountProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13.5px',
              borderRadius: '10px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)',
            },
          }}
        />
      </BrowserRouter>
      </AccountProvider>
    </AuthProvider>
  );
}

export default App;
