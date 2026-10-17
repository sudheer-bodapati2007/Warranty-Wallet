import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import NotificationDrawer from './components/NotificationDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { fetchNotifications } from './services/api';
import Dashboard from './pages/Dashboard';
import MyWarranties from './pages/MyWarranties';
import AddWarranty from './pages/AddWarranty';
import WarrantyDetails from './pages/WarrantyDetails';
import EditWarranty from './pages/EditWarranty';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications()
        .then((res) => {
          if (res.success) {
            setUnreadCount(res.unreadCount);
          }
        })
        .catch(() => {});
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 flex flex-col font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Bar */}
      <Navbar
        user={user}
        unreadCount={unreadCount}
        onLogout={logout}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />

      {/* Notification Center Slide-over */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadChange={(count) => setUnreadCount(count)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-12">
        <Routes>
          {/* Public Authentication Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicOnlyRoute>
                <ResetPassword />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warranties"
            element={
              <ProtectedRoute>
                <MyWarranties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddWarranty />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warranties/:id"
            element={
              <ProtectedRoute>
                <WarrantyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warranties/:id/edit"
            element={
              <ProtectedRoute>
                <EditWarranty />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-900 border-t border-slate-200 dark:border-dark-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Warranty Wallet. All rights reserved.</p>
          <p className="font-medium text-slate-600 dark:text-slate-300">
            🛡 Built for easy product & receipt tracking
          </p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
