import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminLayout from "./components/AdminLayout";
import DashboardPage from "./pages/DashboardPage";
import EnterprisePage from "./pages/EnterprisePage";
import EnterpriseVerificationPage from "./pages/EnterpriseVerificationPage";
import VerificationManagementPage from "./pages/VerificationManagementPage";
import InvoicesPage from "./pages/InvoicesPage";
import TransactionsPage from "./pages/TransactionsPage";
import KYCPage from "./pages/KYCPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DocumentsPage from "./pages/DocumentsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import UsersListPage from "./pages/UsersListPage";
import UserDetailPage from "./pages/UserDetailPage";
import ConsultantsListPage from "./pages/ConsultantsListPage";
import ConsultantDetailPage from "./pages/ConsultantDetailPage";
import EnterpriseDetailPage from "./pages/EnterpriseDetailPage";
import SettingsPage from "./pages/SettingsPage";
import { adminAuth } from "./services/api";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = localStorage.getItem("adminToken");
  return token ? element : <Navigate to="/login" replace />;
};

// Root route - redirect to admin if authenticated, otherwise to login
const RootRoute: React.FC = () => {
  const token = localStorage.getItem("adminToken");

  // If token exists, try to validate it, otherwise go to login
  if (token) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
};

// App wrapper with token validation
const AppContent = () => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // On mount, validate the token if it exists
    const validateToken = async () => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        try {
          await adminAuth.getProfile();
          setChecked(true);
        } catch (err) {
          // Token is invalid, clear it
          localStorage.removeItem("adminToken");
          setChecked(true);
        }
      } else {
        setChecked(true);
      }
    };

    validateToken();
  }, []);

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute element={<AdminLayout />} />
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="enterprise" element={<EnterprisePage />} />
        <Route path="enterprise-verify" element={<EnterpriseVerificationPage />} />
        <Route path="verification" element={<VerificationManagementPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="kyc" element={<KYCPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="users" element={<UsersListPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="consultants-list" element={<ConsultantsListPage />} />
        <Route path="consultants-list/:id" element={<ConsultantDetailPage />} />
        <Route path="enterprise/:id" element={<EnterpriseDetailPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
