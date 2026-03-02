import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bell, LogOut, Lock } from "lucide-react";
import { useAuth } from "../App";
import { SIDEBAR_LINKS } from "../constants";
import { UserRole } from "../types";
import useConsultantKycCheck from "../hooks/useConsultantKycCheck";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { kycStatus } = useConsultantKycCheck();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = user ? SIDEBAR_LINKS[user.role as UserRole] || [] : [];
  
  // Determine which links should be disabled based on KYC status for consultants
  const isKycApproved = user?.role === UserRole.CONSULTANT && kycStatus === "APPROVED";
  const disabledPaths = user?.role === UserRole.CONSULTANT && !isKycApproved 
    ? ["/consultant/bookings", "/consultant/messages", "/consultant/slots", "/consultant/earnings", "/consultant/plans", "/consultant/reviews", "/consultant/profile", "/consultant/support"] 
    : [];

  // ✅ Role-based profile routing
  const profileRoute = (() => {
    switch (user?.role) {
      case UserRole.USER:
        return "/user/profile";
      case UserRole.CONSULTANT:
        return "/consultant/profile";
      case UserRole.ENTERPRISE_ADMIN:
        return "/enterprise/profile";
      case UserRole.ENTERPRISE_MEMBER:
        return "/member/profile";
      default:
        return "/";
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r
        transition-transform duration-300 transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${isSidebarOpen ? "lg:translate-x-0 lg:static" : ""}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 tracking-tight"
            >
              ConsultaPro
            </Link>
          </div>

          {/* Sidebar Links */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const isDisabled = disabledPaths.includes(link.path);
              return (
                <div
                  key={link.path}
                  title={isDisabled ? "Available after KYC approval" : ""}
                  className={isDisabled ? "relative group" : ""}
                >
                  {isDisabled ? (
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 cursor-not-allowed opacity-60">
                      <Lock size={20} />
                      <span>{link.label}</span>
                    </div>
                  ) : (
                    <Link
                      to={link.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        location.pathname === link.path
                          ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center">
            <button
              className="mr-4 p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Icon */}
            {user?.role === 'CONSULTANT' && (
              <button 
                onClick={() => navigate('/consultant/dashboard')}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors"
                title="View Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            )}

            {/* ✅ Profile Navigation (Dynamic) */}
            {user && (
              <Link
                to={profileRoute}
                className="flex items-center space-x-3 pl-4 border-l hover:bg-gray-50 p-1 px-2 rounded-xl transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-none">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-1">
                    {user?.role?.toLowerCase().replace("_", " ")}
                  </p>
                </div>

                <img
                  src={user?.profile_photo || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=0D8ABC&color=fff`}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full ring-2 ring-blue-50 object-cover shadow-sm"
                />
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
