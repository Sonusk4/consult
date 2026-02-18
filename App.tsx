
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, User } from './types';
import { auth } from './services/api';
import { ToastProvider } from './context/ToastContext';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import ConsultantDashboard from './pages/ConsultantDashboard';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import BookingsPage from './pages/BookingsPage';
import CreditsPage from './pages/CreditsPage';
import MessagesPage from './pages/MessagesPage';
import AvailabilityPage from './pages/AvailabilityPage';
import EarningsPage from './pages/EarningsPage';

interface AuthContextType {
  user: User | null;
  login: (email: string, role?: UserRole) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const login = async (email: string, role?: UserRole) => {
    setLoading(true);
    try {
      const userData = await auth.login(email, role);
      setUser(userData);
      // Persist to local storage for dev convenience
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    // Check for persisted user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Navigate to="/login" />} />
            <Route path="/login" element={<AuthPage type="LOGIN" />} />
            <Route path="/signup" element={<AuthPage type="SIGNUP" />} />

            {/* User Routes */}
            <Route
              path="/user/dashboard"
              element={user?.role === UserRole.USER ? <UserDashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/search"
              element={user?.role === UserRole.USER ? <SearchPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/bookings"
              element={user?.role === UserRole.USER ? <BookingsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/credits"
              element={user?.role === UserRole.USER ? <CreditsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/messages"
              element={user?.role === UserRole.USER ? <MessagesPage /> : <Navigate to="/auth" />}
            />

            {/* Consultant Routes */}
            <Route
              path="/consultant/dashboard"
              element={(user?.role === UserRole.CONSULTANT || user?.role === UserRole.ENTERPRISE_ADMIN) ? <ConsultantDashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/slots"
              element={user ? <AvailabilityPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/earnings"
              element={user ? <EarningsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/reviews"
              element={user ? <EarningsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/profile"
              element={user ? <ProfilePage /> : <Navigate to="/auth" />}
            />

            {/* Shared Routes */}
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <Navigate to="/auth" />}
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ToastProvider>
  );
};

export default App;
