import React, { useState, createContext, useContext, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserRole, User } from "./types";
import { auth } from "./services/api";
import { ToastProvider } from "./context/ToastContext";

/* ================= PAGES ================= */

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";

/* USER */
import UserDashboard from "./pages/user/UserDashboard";
import SearchConsultantPage from "./pages/user/SearchConsultantPage";
import UserBooking from "./pages/user/UserBooking";
import UserCredit from "./pages/user/UserCredit";
import UserProfilePage from "./pages/user/UserProfilePage";
import UserSupportPage from "./pages/user/UserSupportPage";
import MessagesPage from "./pages/MessagesPage";

/* CONSULTANT */
import ConsultantDashboard from "./pages/ConsultantDashboard";
import BookingsPage from "./pages/BookingsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import EarningsPage from "./pages/EarningsPage";
import ProfilePage from "./pages/ProfilePage";

/* ENTERPRISE ADMIN */
import EnterpriseDashboard from "./pages/enterprise/EnterpriseDashboard";
import EnterpriseSupport from "./pages/enterprise/EnterpriseSupport";
import CompanyProfile from "./pages/enterprise/CompanyProfile";
import TeamManagement from "./pages/enterprise/TeamManagement";
import EnterpriseBookings from "./pages/enterprise/EnterpriseBookings";
import EnterpriseEarnings from "./pages/enterprise/EnterpriseEarnings";
import EnterpriseAnalytics from "./pages/enterprise/EnterpriseAnalytics";
import EnterpriseSettings from "./pages/enterprise/EnterpriseSettings";
import EnterpriseMessages from "./pages/enterprise/EnterpriseMessage";

/* ENTERPRISE MEMBER */
import MemberDashboard from "./pages/enterprise/member/MemberDashboard";
import MemberProfile from "./pages/enterprise/member/MemberProfile";
import MemberBookings from "./pages/enterprise/member/MemberBookings";
import MemberAvailability from "./pages/enterprise/member/MemberAvailability";
import MemberEarnings from "./pages/enterprise/member/MemberEarnings";
import MemberReviews from "./pages/enterprise/member/MemberReviews";
import MemberMessages from "./pages/enterprise/member/MemberMessages";

/* ===================================================== */

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, role?: UserRole, name?: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /* ================= LOGIN ================= */
  const login = async (email: string, role?: UserRole, name?: string) => {
    setLoading(true);
    try {
      const userData = await auth.login(email, role, name);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  /* ================= RESTORE SESSION ================= */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= ROLE FLAGS ================= */
  const isUser = user?.role === UserRole.USER;

  const isConsultant =
    user?.role === UserRole.CONSULTANT ||
    user?.role === UserRole.ENTERPRISE_ADMIN;

  const isEnterpriseAdmin = user?.role === UserRole.ENTERPRISE_ADMIN;
  const isEnterpriseMember = user?.role === UserRole.ENTERPRISE_MEMBER;
  const isPlatformAdmin = user?.role === UserRole.PLATFORM_ADMIN;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
        <Router>
          <Routes>
            {/* ================= PUBLIC ================= */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Navigate to="/login" />} />
            <Route path="/login" element={<AuthPage type="LOGIN" />} />
            <Route path="/signup" element={<AuthPage type="SIGNUP" />} />

            {/* ================= USER ================= */}
            <Route
              path="/user/dashboard"
              element={isUser ? <UserDashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/user/search"
              element={
                isUser ? <SearchConsultantPage /> : <Navigate to="/auth" />
              }
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

            {/* ================= CONSULTANT ================= */}
            <Route
              path="/consultant/dashboard"
              element={
                isConsultant ? <ConsultantDashboard /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/consultant/bookings"
              element={
                isConsultant ? <BookingsPage /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/consultant/messages"
              element={
                isConsultant ? <MessagesPage /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/consultant/slots"
              element={
                isConsultant ? <AvailabilityPage /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/consultant/earnings"
              element={
                isConsultant ? <EarningsPage /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/consultant/profile"
              element={isConsultant ? <ProfilePage /> : <Navigate to="/auth" />}
            />

            {/* ================= ENTERPRISE ADMIN ================= */}
            <Route
              path="/enterprise/dashboard"
              element={
                isEnterpriseAdmin ? (
                  <EnterpriseDashboard />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            <Route
              path="/enterprise/profile"
              element={
                isEnterpriseAdmin ? <CompanyProfile /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/enterprise/team"
              element={
                isEnterpriseAdmin ? <TeamManagement /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/enterprise/bookings"
              element={
                isEnterpriseAdmin ? (
                  <EnterpriseBookings />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/enterprise/earnings"
              element={
                isEnterpriseAdmin ? (
                  <EnterpriseEarnings />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/enterprise/analytics"
              element={
                isEnterpriseAdmin ? (
                  <EnterpriseAnalytics />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/enterprise/settings"
              element={
                isEnterpriseAdmin ? (
                  <EnterpriseSettings />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/enterprise/messages"
              element={
                isEnterpriseAdmin ? (
                  <EnterpriseMessages />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/enterprise/support"
              element={
                isEnterpriseAdmin ? (
                  <EnterpriseSupport />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            {/* ================= ENTERPRISE MEMBER ================= */}
            <Route
              path="/member/dashboard"
              element={
                isEnterpriseMember ? (
                  <MemberDashboard />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/member/profile"
              element={
                isEnterpriseMember ? <MemberProfile /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/member/bookings"
              element={
                isEnterpriseMember ? (
                  <MemberBookings />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/member/availability"
              element={
                isEnterpriseMember ? (
                  <MemberAvailability />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/member/earnings"
              element={
                isEnterpriseMember ? (
                  <MemberEarnings />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/member/reviews"
              element={
                isEnterpriseMember ? <MemberReviews /> : <Navigate to="/auth" />
              }
            />
            <Route
              path="/member/messages"
              element={
                isEnterpriseMember ? (
                  <MemberMessages />
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            {/* ================= ADMIN ================= */}
            <Route
              path="/admin/dashboard"
              element={
                isPlatformAdmin ? (
                  <div>Admin Dashboard</div>
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />

            {/* ================= FALLBACK ================= */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ToastProvider>
  );
};

export default App;
