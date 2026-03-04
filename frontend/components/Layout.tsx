import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MessageCircle, LogOut, Lock, ChevronDown, User, CreditCard, Settings, HelpCircle, Search, LayoutDashboard, Wallet } from "lucide-react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { kycStatus } = useConsultantKycCheck();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current page name based on route
  const getCurrentPageName = () => {
    const pathname = location.pathname;
    
    // User routes
    if (pathname.includes('/user/dashboard')) return 'Dashboard';
    if (pathname.includes('/user/profile')) return 'Profile';
    if (pathname.includes('/user/wallet')) return 'Wallet';
    if (pathname.includes('/user/messages')) return 'Messages';
    if (pathname.includes('/user/search')) return 'Search';
    if (pathname.includes('/user/bookings')) return 'Bookings';
    if (pathname.includes('/user/subscription-plans')) return 'Subscription Plans';
    if (pathname.includes('/user/support')) return 'Support';
    if (pathname.includes('/user/settings')) return 'Settings';
    
    // Consultant routes
    if (pathname.includes('/consultant/dashboard')) return 'Dashboard';
    if (pathname.includes('/consultant/profile')) return 'Profile';
    if (pathname.includes('/consultant/earnings')) return 'Earnings';
    if (pathname.includes('/consultant/messages')) return 'Messages';
    if (pathname.includes('/consultant/bookings')) return 'Bookings';
    if (pathname.includes('/consultant/slots')) return 'Time Slots';
    if (pathname.includes('/consultant/plans')) return 'Plans';
    if (pathname.includes('/consultant/reviews')) return 'Reviews';
    if (pathname.includes('/consultant/support')) return 'Support';
    if (pathname.includes('/consultant/settings')) return 'Settings';
    
    // Enterprise routes
    if (pathname.includes('/enterprise/dashboard')) return 'Dashboard';
    if (pathname.includes('/enterprise/profile')) return 'Profile';
    if (pathname.includes('/enterprise/members')) return 'Members';
    if (pathname.includes('/enterprise/analytics')) return 'Analytics';
    if (pathname.includes('/enterprise/settings')) return 'Settings';
    
    // Member routes
    if (pathname.includes('/member/dashboard')) return 'Dashboard';
    if (pathname.includes('/member/profile')) return 'Profile';
    
    // Default
    return title;
  };

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
    {/* ================= SIDEBAR LAYOUT (FOR CONSULTANT & ENTERPRISE) ================= */}
    {(user?.role === UserRole.CONSULTANT || user?.role === UserRole.ENTERPRISE_ADMIN || user?.role === UserRole.ENTERPRISE_MEMBER) ? (
      <>
        {/* Sidebar */}
        <div className={`w-64 bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static h-full z-30`}>
          <div className="p-6">
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 tracking-tight"
            >
              ConsultaPro
            </Link>
          </div>
          
          <nav className="px-4 pb-6">
            {links.map((link) => {
              const isDisabled = disabledPaths.includes(link.path);
              return (
                <Link
                  key={link.path}
                  to={isDisabled ? "#" : link.path}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    location.pathname === link.path
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : isDisabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 pb-6 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {getCurrentPageName()}
              </h1>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </>
    ) : (
      /* ================= HEADER LAYOUT (FOR USER) ================= */
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b flex items-center px-8 sticky top-0 z-40">

          {/* LEFT SECTION */}
          <div className={`flex items-center min-w-fit ${user?.role === UserRole.USER ? 'gap-10' : 'gap-3'}`}>
            <Link
              to="/"
              className="text-3xl font-bold text-blue-600 tracking-tight"
            >
              ConsultaPro
            </Link>

            <span className={`text-xl font-semibold text-gray-700 ${user?.role === UserRole.USER ? 'uppercase tracking-wide' : ''}`}>
              {getCurrentPageName()}
            </span>
          </div>

          {/* CENTER SEARCH BAR */}
          <div className="flex-1 flex justify-center">
            <div
              onClick={() => navigate('/user/search')}
              className="relative w-full max-w-xl cursor-pointer group"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>

              <input
                type="text"
                placeholder="Search consultants..."
                readOnly
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/user/search');
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-500 bg-gray-50 hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center space-x-4">
            {/* Wallet */}
            <button 
              onClick={() => {
                if (user?.role === UserRole.USER) {
                  navigate('/user/wallet');
                } else if (user?.role === UserRole.CONSULTANT) {
                  navigate('/consultant/earnings');
                }
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              title="Wallet"
            >
              <Wallet size={22} />
            </button>

            {/* Messages */}
            <button 
              onClick={() => {
                if (user?.role === UserRole.USER) {
                  navigate('/user/messages');
                } else if (user?.role === UserRole.CONSULTANT) {
                  navigate('/consultant/messages');
                }
              }}
              className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full relative transition"
              title="Messages"
            >
              <MessageCircle size={22} />

              {user?.role === UserRole.CONSULTANT && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* PROFILE DROPDOWN */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
                    src={
                      user?.profile_photo ||
                      user?.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.name || user?.email || "User"
                      )}&background=0D8ABC&color=fff`
                    }
                    alt="Avatar"
                    className="w-9 h-9 rounded-full ring-2 ring-blue-50 object-cover shadow-sm"
                  />

                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />

                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Menu Items */}
                    <div className="py-2">
                      {/* Dashboard */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (user?.role === UserRole.USER) {
                            navigate('/user/dashboard');
                          } else if (user?.role === UserRole.CONSULTANT) {
                            navigate('/consultant/dashboard');
                          } else if (user?.role === UserRole.ENTERPRISE_ADMIN) {
                            navigate('/enterprise/dashboard');
                          } else if (user?.role === UserRole.ENTERPRISE_MEMBER) {
                            navigate('/member/dashboard');
                          }
                        }}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <LayoutDashboard size={16} className="text-gray-400" />
                        <span>Dashboard</span>
                      </button>

                      {/* Profile */}
                      <Link
                        to={profileRoute}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={16} className="text-gray-400" />
                        <span>Profile</span>
                      </Link>

                      {/* Subscriptions */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (user?.role === UserRole.USER) {
                            navigate('/user/subscription-plans');
                          } else if (user?.role === UserRole.CONSULTANT) {
                            navigate('/consultant/plans');
                          }
                        }}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <CreditCard size={16} className="text-gray-400" />
                        <span>Subscriptions</span>
                      </button>

                      {/* Support */}
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          // Navigate to support based on role
                          if (user?.role === UserRole.USER) {
                            navigate('/user/support');
                          } else if (user?.role === UserRole.CONSULTANT) {
                            navigate('/consultant/support');
                          }
                        }}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <HelpCircle size={16} className="text-gray-400" />
                        <span>Support</span>
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    )}
  </div>
);
};

export default Layout;
