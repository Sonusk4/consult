import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Lock, Search, MessageSquare, Plus } from "lucide-react";
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

  // Hide sidebar for user pages
  const isUserPage = location.pathname.startsWith("/user");
  const isConsultantPage = location.pathname.startsWith("/consultant");
  const showSidebar = !isUserPage && (user?.role === UserRole.CONSULTANT || user?.role === UserRole.ENTERPRISE_ADMIN);
  const showTopbar = !isConsultantPage;

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
      {/* ================= SIDEBAR (Hidden for User Pages) ================= */}
      {showSidebar && (
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
      )}

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ========== TOP NAVBAR ========== */}
        {showTopbar && (
        <header className="h-20 bg-white border-b sticky top-0 z-40 px-6 flex items-center gap-8">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {showSidebar && (
              <button
                className="mr-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                E
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-gray-900">ExpertConnect</span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center">
            <div className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for experts, categories or skills..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all cursor-pointer"
                onClick={() => {
                  if (user?.role === UserRole.USER) {
                    navigate("/user/search");
                  }
                }}
                readOnly
              />
            </div>
          </div>

          {/* Right: Actions and Profile */}
          <div className="flex items-center gap-6 ml-auto">
            {/* Wallet Balance */}
            {user?.role === UserRole.USER && (
              <button
                onClick={() => navigate("/user/credits")}
                className="flex items-center gap-3 px-4 py-2 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
                title="View Credits"
              >
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">WALLET BALANCE</p>
                  <p className="text-sm font-bold text-gray-900">₹2,450.00</p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/user/subscription-plans");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate("/user/subscription-plans");
                    }
                  }}
                  className="p-1.5 bg-purple-200 text-purple-700 rounded-lg hover:bg-purple-300 transition-colors flex-shrink-0"
                  title="Add funds"
                >
                  <Plus size={16} />
                </span>
              </button>
            )}

            {/* Messages Icon */}
            <button
              onClick={() => navigate("/user/messages")}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors flex-shrink-0"
              title="Messages"
            >
              <MessageSquare size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            {/* User Profile */}
            {user && (
              <Link
                to={profileRoute}
                className="flex items-center gap-3 pl-4 border-l hover:bg-gray-50 py-1 px-3 rounded-xl transition-colors flex-shrink-0 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {user?.name?.split(" ")[0] || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-purple-600 font-bold uppercase tracking-tight">
                    {user?.role === UserRole.USER ? "Premium Member" : user?.role?.replace(/_/g, " ")}
                  </p>
                </div>

                {/* Avatar with Status Indicator */}
                <div className="relative flex-shrink-0">
                  <img
                    src={user?.profile_photo || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || "User")}&background=8B5CF6&color=fff`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full ring-2 ring-purple-100 object-cover shadow-sm"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
              </Link>
            )}
          </div>
        </header>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
