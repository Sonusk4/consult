import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserRole, User } from './types';
import { auth } from './services/api';
import { ToastProvider } from './context/ToastContext';
// Pages
import LandingPage from './pages/LandingPage';
import UserCredit from './pages/user/UserCredit';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/user/UserDashboard';
import ConsultantDashboard from './pages/ConsultantDashboard';
import UserProfilePage from './pages/user/UserProfilePage';
import ProfilePage from './pages/ProfilePage';
import SearchConsultantPage from './pages/user/SearchConsultantPage';
import UserBooking from './pages/user/UserBooking';
import BookingsPage from './pages/BookingsPage';
import CreditsPage from './pages/CreditsPage';
import MessagesPage from './pages/MessagesPage';
import AvailabilityPage from './pages/AvailabilityPage';
import EarningsPage from './pages/EarningsPage';
import { Wallet } from 'lucide-react';
import UserSupportPage from './pages/user/UserSupportPage';

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
  const [loading, setLoading] = useState<boolean>(true); // start true for restore phase

  // ---------------- LOGIN ----------------
  const login = async (email: string, role?: UserRole) => {
    setLoading(true);
    try {
      const userData = await auth.login(email, role);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // ---------------- RESTORE USER ON REFRESH ----------------
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error restoring user:", error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false); // allow routes to render
    }
  }, []);

  // ---------------- ROLE CHECKS ----------------
  const isUser = user?.role === UserRole.USER;

  const isConsultant =
    user?.role === UserRole.CONSULTANT ||
    user?.role === UserRole.ENTERPRISE_ADMIN;

  // ---------------- LOADING SCREEN ----------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        <Router>
          <Routes>

            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Navigate to="/login" />} />
            <Route path="/login" element={<AuthPage type="LOGIN" />} />
            <Route path="/signup" element={<AuthPage type="SIGNUP" />} />

            {/* ---------------- USER ROUTES ---------------- */}
            <Route
              path="/user/dashboard"
              element={isUser ? <UserDashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/search"
              element={isUser ? <SearchConsultantPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/bookings"
              element={isUser ? <UserBooking /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/credits"
              element={isUser ? <UserCredit /> : <Navigate to="/auth" />}
            />

            <Route
              path="/user/wallet"
              element={isUser ? <UserCredit /> : <Navigate to="/auth" />}
            />



            <Route
              path="/user/messages"
              element={isUser ? <MessagesPage /> : <Navigate to="/auth" />}
            />

            <Route
              path="/user/profile"
              element={isUser ? <UserProfilePage /> : <Navigate to="/auth" />}
            />

            <Route
              path="/user/support"
              element={isUser ? <UserSupportPage /> : <Navigate to="/auth" />}
            />


            {/* ---------------- CONSULTANT ROUTES ---------------- */}
            <Route
              path="/consultant/dashboard"
              element={isConsultant ? <ConsultantDashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/bookings"
              element={isConsultant ? <BookingsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/slots"
              element={isConsultant ? <AvailabilityPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/earnings"
              element={isConsultant ? <EarningsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/reviews"
              element={isConsultant ? <EarningsPage /> : <Navigate to="/auth" />}
            />
            <Route
              path="/consultant/profile"
              element={isConsultant ? <ProfilePage /> : <Navigate to="/auth" />}
            />

            {/* Shared Route */}
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <Navigate to="/auth" />}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />

          </Routes>
        </Router>
      </AuthContext.Provider>
    </ToastProvider>
  );
};

export default App;