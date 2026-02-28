import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FileText,
  ShieldCheck,
  LogOut,
  Menu,
  FileCheck,
  User,
  ArrowLeftRight,
  UserCheck,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { adminAuth } from "../services/api";

interface AdminProfile {
  id: number;
  name: string;
  profile_pic?: string;
}

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/admin/users", icon: User, label: "Users" },
  { to: "/admin/consultants-list", icon: UserCheck, label: "Consultants" },
  { to: "/admin/verification", icon: FileCheck, label: "Consultant Approvals" },
  { to: "/admin/enterprise", icon: Building2, label: "Enterprises" },
  { to: "/admin/enterprise-verify", icon: ShieldCheck, label: "Enterprise Approvals" },
  { to: "/admin/invoices", icon: FileText, label: "Invoices" },
  { to: "/admin/kyc", icon: ShieldCheck, label: "Identity KYC" },
  { to: "/admin/documents", icon: FileText, label: "Documents" },
  { to: "/admin/settings", icon: Settings, label: "Global Settings" },
  { to: "/admin/profile", icon: User, label: "Admin Profile" },
];

const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await adminAuth.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    adminAuth.logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Always Visible */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-gray-200 lg:relative ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-gray-900">ConsultPro</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700"
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 w-full transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-600"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div
            onClick={() => navigate("/admin/profile")}
            className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity"
          >
            {profile?.profile_pic ? (
              <img
                src={profile.profile_pic}
                alt={profile.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {profile?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
