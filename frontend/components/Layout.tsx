import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, MessageCircle, LogOut, Lock, ChevronDown, User, CreditCard, Settings, HelpCircle, Search, LayoutDashboard, Wallet, Calendar, Send, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "../App";
import { SIDEBAR_LINKS } from "../constants";
import { UserRole } from "../types";
import useConsultantKycCheck from "../hooks/useConsultantKycCheck";
import { useUserSessions } from "../hooks/useUserSessions";
import { useUserUsage } from "../hooks/useUserUsage";
import { useUserTransactions } from "../hooks/useUserTransactions"
import { useWalletBalance } from "../hooks/useWalletBalance";

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
  const [isHoverOpen, setIsHoverOpen] = useState(false);
const [isClickOpen, setIsClickOpen] = useState(false);
  
  // Fetch user data for the hover panel
  const { sessions } = useUserSessions();
  const { usage } = useUserUsage();
  const { transactions } = useUserTransactions();
  const { balance } = useWalletBalance();

  // Close dropdown when clicking outside
 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsClickOpen(false);
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
              const isNotificationLink = link.path.includes('#notifications');
              
              return (
                <Link
                  key={link.path}
                  to={isDisabled ? "#" : link.path}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                    } else if (isNotificationLink && location.pathname === '/consultant/dashboard') {
                      // If already on dashboard, scroll to notifications
                      e.preventDefault();
                      const element = document.getElementById('notifications');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    location.pathname === link.path || (isNotificationLink && location.pathname === '/consultant/dashboard')
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

          {/* Profile Section */}
          <div className="px-4 pb-4 mt-auto border-t border-gray-200 pt-4">
            <Link
              to={profileRoute}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <img
                src={
                  user?.profile_photo ||
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || user?.email || "User"
                  )}&background=0D8ABC&color=fff`
                }
                alt="Profile"
                className="w-10 h-10 rounded-full ring-2 ring-blue-100 object-cover shadow-sm group-hover:ring-blue-200 transition-all"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.name || user?.email || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  View Profile
                </p>
              </div>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="px-4 pb-6">
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

            {/* PROFILE ICON - TOP RIGHT */}
            {user && (
              <button
                onClick={() => navigate(profileRoute)}
                className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Profile"
              >
                <img
                  src={
                    user?.profile_photo ||
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || user?.email || "User"
                    )}&background=0D8ABC&color=fff`
                  }
                  alt="Profile"
                  className="w-10 h-10 rounded-full ring-2 ring-blue-50 object-cover shadow-sm"
                />
              </button>
            )}
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </>
    ) : (
      /* ================= HEADER LAYOUT (FOR USER) ================= */
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40">
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
             <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => setIsHoverOpen(true)}
                onMouseLeave={() => {
                if (!isClickOpen) {
                  setIsHoverOpen(false);
                }
              }}
              >
                <button
                
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsClickOpen(!isClickOpen);
                      setIsHoverOpen(false);
                   
                  }}
                  className={`text-gray-500 transition-transform cursor-pointer ${
                    isClickOpen ? "rotate-180" : ""
                  }`}
                />

                </button>

                {/* HOVER PANEL - SAME CONTENT */}
                {isHoverOpen && (
                  <div className="absolute right-0 mt-2 w-[1100px] max-w-[98vw]
                    bg-gradient-to-br from-slate-50 via-white to-indigo-50/30
                    rounded-3xl shadow-2xl border border-indigo-200/50 z-50 backdrop-blur-sm
                    transition-all duration-300 ease-out
                    transform origin-top scale-95 animate-[scaleIn_0.25s_ease-out]">
                      <div className="grid grid-cols-10 gap-0">
                      
                      {/* LEFT COLUMN - 70% - SUBSCRIPTION USAGE & RECENT ACTIVITY */}
                      <div className="col-span-7 p-5 border-r border-indigo-200/50 bg-gradient-to-br from-indigo-50/50 via-blue-50/30 to-purple-50/20 backdrop-blur-sm">
                        {/* Wallet Balance Section */}
                        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-3 rounded-xl border border-emerald-300/50 shadow-lg mb-3 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl group">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white/90 mb-0.5">Wallet Balance</p>
                              <p className="text-2xl font-bold text-white">₹{balance || 0}</p>
                            </div>
                            <Wallet className="w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" />
                          </div>
                        </div>

                        {/* Subscription Usage Section */}
                        <h3 className="text-base font-bold mb-1 text-indigo-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          Your Subscription Plan
                        </h3>
                        <p className="text-xs text-indigo-600 mb-3 font-medium">Track your plan usage and limits</p>
                        
                        {usage ? (
                          <div className="mb-3">
                            {/* Chat Usage */}
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl border border-blue-400/30 shadow-lg mb-2 hover:scale-[1.01] transition-all duration-300 hover:shadow-xl group">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                    <Send className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">Chat Messages</p>
                                    <p className="text-xs text-blue-100">Messages sent to consultants</p>
                                  </div>
                                </div>
                                <p className="text-base font-bold text-white bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">{usage.chat_messages_used}/{usage.chat_limit}</p>
                              </div>
                              <div className="w-full bg-blue-300/30 rounded-full h-2.5 backdrop-blur-sm">
                                <div
                                  className="bg-gradient-to-r from-white to-blue-100 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (usage.chat_messages_used / usage.chat_limit) * 100
                                    )}%`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-white mt-1.5 font-semibold">
                                {usage.chat_limit - usage.chat_messages_used} remaining ({Math.round((usage.chat_messages_used / usage.chat_limit) * 100)}% used)
                              </p>
                            </div>

                            {/* Bookings & Days in a Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Bookings */}
                              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl border border-purple-400/30 shadow-lg hover:scale-[1.03] transition-all duration-300 hover:shadow-xl group">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <p className="text-xs font-bold text-white">Total Bookings</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{usage.bookings_made || 0}</p>
                                <p className="text-xs text-purple-100 mt-0.5">sessions booked</p>
                              </div>

                              {/* Days Remaining */}
                              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl border border-cyan-400/30 shadow-lg hover:scale-[1.03] transition-all duration-300 hover:shadow-xl group">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                    <Clock className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <p className="text-xs font-bold text-white">Plan Validity</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{usage.days_remaining}</p>
                                <p className="text-xs text-cyan-100 mt-0.5">days left</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-indigo-700 text-xs mb-3 font-semibold">No subscription data available</p>
                        )}

                        {/* Recent Activity Section */}
                        <h3 className="text-base font-bold mb-2 text-indigo-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          Recent Activity
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Last Booking */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-indigo-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-500" />
                              Last Booking
                            </p>
                            <p className="text-xs font-bold text-indigo-600 truncate">
                              {sessions?.length > 0
                                ? sessions[0]?.consultant?.domain || 'Consultant'
                                : 'No bookings yet'}
                            </p>
                          </div>

                          {/* Last Payment */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-emerald-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
                              <Wallet className="w-3 h-3 text-emerald-500" />
                              Last Payment
                            </p>
                            <p className="text-xs font-bold text-emerald-600">
                              {transactions?.length > 0
                                ? `₹${transactions[0]?.amount}`
                                : 'No payments'}
                            </p>
                          </div>

                          {/* Last Review */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-amber-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-amber-500" />
                              Last Review
                            </p>
                            <p className="text-xs font-bold text-amber-600">
                              {sessions?.some(s => s.review)
                                ? `${sessions.find(s => s.review)?.review?.rating}★`
                                : 'No reviews'}
                            </p>
                          </div>

                          {/* Last Chat */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-blue-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-blue-500" />
                              Last Chat
                            </p>
                            <p className="text-xs font-bold text-blue-600 truncate">
                              {sessions?.some(s => s.chat_started)
                                ? sessions.find(s => s.chat_started)?.consultant?.domain
                                : 'No chats'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN - 30% - MENU ITEMS */}
                      <div className="col-span-3 py-6 px-4 flex flex-col items-center bg-gradient-to-b from-indigo-600 to-indigo-800 gap-3">
                        {/* Profile Icon */}
                        <div className="mb-2 pb-3 border-b border-indigo-400 w-full flex justify-center">
                          <img
                            src={
                              user?.profile_photo ||
                              user?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user?.name || user?.email || "User"
                              )}&background=5B5BFF&color=fff`
                            }
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                          />
                        </div>

                        {/* Menu Items - Icon Only */}
                        <div className="space-y-4 flex-1 flex flex-col items-center w-full">
                          {/* My Dashboard */}
                          <button
                            onClick={() => {
                              setIsHoverOpen(false);
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
                          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500
                            backdrop-blur-sm
                            transition-all duration-300 ease-out
                            hover:scale-105 hover:-translate-y-1
                            hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                          title="Dashboard"
                        >
                          <LayoutDashboard className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-125 group-hover:rotate-3" />
                          <span className="text-white text-sm font-medium transition-all duration-300">
                            Dashboard
                          </span>
                        </button>

                          {/* My Bookings */}
                          <button
                            onClick={() => {
                              setIsHoverOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/bookings');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/bookings');
                              } else if (user?.role === UserRole.ENTERPRISE_ADMIN) {
                                navigate('/enterprise/bookings');
                              } else if (user?.role === UserRole.ENTERPRISE_MEMBER) {
                                navigate('/member/bookings');
                              }
                            }}
                            className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500
                            backdrop-blur-sm
                            transition-all duration-300 ease-out
                            hover:scale-105 hover:-translate-y-1
                            hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                            title="Bookings"
                          >
                            <Calendar className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-3" />
                            <span className="text-white text-sm font-medium transition-all duration-300">
                              Bookings
                            </span>
                          </button>

                          {/* My Profile */}
                          <Link
                            to={profileRoute}
                            onClick={() => setIsHoverOpen(false)}
                             className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500
                            backdrop-blur-sm
                            transition-all duration-300 ease-out
                            hover:scale-105 hover:-translate-y-1
                            hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                            title="Profile"
                          >
                           <User className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" />

                            <span className="text-white text-sm font-medium transition-all duration-300 group-hover:tracking-wide">
                              Profile
                            </span>
                          </Link>

                          {/* Messages */}
                          <button
                            onClick={() => {
                              setIsHoverOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/messages');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/messages');
                              }
                            }}
                             className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500
                            backdrop-blur-sm
                            transition-all duration-300 ease-out
                            hover:scale-105 hover:-translate-y-1
                            hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                            title="Messages"
                          >
                            <MessageCircle className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6" />

                          <span className="text-white text-sm font-medium transition-all duration-300 group-hover:tracking-wide">
                            Messages
                          </span>
                          </button>

                          {/* My Plans */}
                          <button
                            onClick={() => {
                              setIsHoverOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/subscription-plans');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/plans');
                              }
                            }}
                             className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500
                            backdrop-blur-sm
                            transition-all duration-300 ease-out
                            hover:scale-105 hover:-translate-y-1
                            hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                            title="Plans"
                          >
                           <CreditCard className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-125 group-hover:rotate-3" />
                          <span className="text-white text-sm font-medium transition-all duration-300 group-hover:tracking-wide">
                            Plans
                          </span>
                          </button>

                          {/* Support */}
                          <button
                            onClick={() => {
                              setIsHoverOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/support');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/support');
                              }
                            }}
                             className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            bg-white/10 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500
                            backdrop-blur-sm
                            transition-all duration-300 ease-out
                            hover:scale-105 hover:-translate-y-1
                            hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                            title="Support"
                          >
                           <HelpCircle className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-3" />

                              <span className="text-white text-sm font-medium transition-all duration-300 group-hover:tracking-wide">
                                Support
                              </span>
                          </button>

                          {/* Logout */}
                          <div className="border-t border-indigo-400 pt-3 mt-auto w-full">
  <button
    onClick={() => {
      setIsHoverOpen(false);
      handleLogout();
    }}
    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
    bg-red-500/80 hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-600
    backdrop-blur-sm
    transition-all duration-300 ease-out
    hover:scale-105 hover:-translate-y-1
    hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
    title="Logout"
  >
    <LogOut className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" />

    <span className="text-white text-sm font-medium transition-all duration-300 group-hover:tracking-wide">
      Logout
    </span>
  </button>
</div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Dropdown Menu - Subscription & Activity Focus - CLICK ACTIVATED */}
                {isClickOpen && (
                  <div className="absolute right-0 mt-2 w-[1100px] max-w-[98vw] bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 rounded-3xl shadow-2xl border border-indigo-200/50 z-50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-10 gap-0">
                      
                      {/* LEFT COLUMN - 70% - SUBSCRIPTION USAGE & RECENT ACTIVITY */}
                      <div className="col-span-7 p-5 border-r border-indigo-200/50 bg-gradient-to-br from-indigo-50/50 via-blue-50/30 to-purple-50/20 backdrop-blur-sm">
                        {/* Wallet Balance Section */}
                        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 p-3 rounded-xl border border-emerald-300/50 shadow-lg mb-3 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl group">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-white/90 mb-0.5">Wallet Balance</p>
                              <p className="text-2xl font-bold text-white">₹{balance || 0}</p>
                            </div>
                            <Wallet className="w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" />
                          </div>
                        </div>

                        {/* Subscription Usage Section */}
                        <h3 className="text-base font-bold mb-1 text-indigo-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                          Your Subscription Plan
                        </h3>
                        <p className="text-xs text-indigo-600 mb-3 font-medium">Track your plan usage and limits</p>
                        
                        {usage ? (
                          <div className="mb-3">
                            {/* Chat Usage */}
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl border border-blue-400/30 shadow-lg mb-2 hover:scale-[1.01] transition-all duration-300 hover:shadow-xl group">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                    <Send className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">Chat Messages</p>
                                    <p className="text-xs text-blue-100">Messages sent to consultants</p>
                                  </div>
                                </div>
                                <p className="text-base font-bold text-white bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">{usage.chat_messages_used}/{usage.chat_limit}</p>
                              </div>
                              <div className="w-full bg-blue-300/30 rounded-full h-2.5 backdrop-blur-sm">
                                <div
                                  className="bg-gradient-to-r from-white to-blue-100 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (usage.chat_messages_used / usage.chat_limit) * 100
                                    )}%`
                                  }}
                                />
                              </div>
                              <p className="text-xs text-white mt-1.5 font-semibold">
                                {usage.chat_limit - usage.chat_messages_used} remaining ({Math.round((usage.chat_messages_used / usage.chat_limit) * 100)}% used)
                              </p>
                            </div>

                            {/* Bookings & Days in a Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Bookings */}
                              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl border border-purple-400/30 shadow-lg hover:scale-[1.03] transition-all duration-300 hover:shadow-xl group">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <p className="text-xs font-bold text-white">Total Bookings</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{usage.bookings_made || 0}</p>
                                <p className="text-xs text-purple-100 mt-0.5">sessions booked</p>
                              </div>

                              {/* Days Remaining */}
                              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl border border-cyan-400/30 shadow-lg hover:scale-[1.03] transition-all duration-300 hover:shadow-xl group">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                    <Clock className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <p className="text-xs font-bold text-white">Plan Validity</p>
                                </div>
                                <p className="text-2xl font-bold text-white">{usage.days_remaining}</p>
                                <p className="text-xs text-cyan-100 mt-0.5">days left</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-indigo-700 text-xs mb-3 font-semibold">No subscription data available</p>
                        )}

                        {/* Recent Activity Section */}
                        <h3 className="text-base font-bold mb-2 text-indigo-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          Recent Activity
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Last Booking */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-indigo-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-500" />
                              Last Booking
                            </p>
                            <p className="text-xs font-bold text-indigo-600 truncate">
                              {sessions?.length > 0
                                ? sessions[0]?.consultant?.domain || 'Consultant'
                                : 'No bookings yet'}
                            </p>
                          </div>

                          {/* Last Payment */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-emerald-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
                              <Wallet className="w-3 h-3 text-emerald-500" />
                              Last Payment
                            </p>
                            <p className="text-xs font-bold text-emerald-600">
                              {transactions?.length > 0
                                ? `₹${transactions[0]?.amount}`
                                : 'No payments'}
                            </p>
                          </div>

                          {/* Last Review */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-amber-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-amber-500" />
                              Last Review
                            </p>
                            <p className="text-xs font-bold text-amber-600">
                              {sessions?.some(s => s.review)
                                ? `${sessions.find(s => s.review)?.review?.rating}★`
                                : 'No reviews'}
                            </p>
                          </div>

                          {/* Last Chat */}
                          <div className="bg-white/60 backdrop-blur-md p-3 rounded-xl border border-blue-200/50 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group">
                            <p className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-blue-500" />
                              Last Chat
                            </p>
                            <p className="text-xs font-bold text-blue-600 truncate">
                              {sessions?.some(s => s.chat_started)
                                ? sessions.find(s => s.chat_started)?.consultant?.domain
                                : 'No chats'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN - 30% - MENU ITEMS */}
                      <div className="col-span-3 py-6 px-4 flex flex-col items-center bg-gradient-to-b from-indigo-600 to-indigo-800 gap-3">
                        {/* Profile Icon */}
                        <div className="mb-2 pb-3 border-b border-indigo-400 w-full flex flex-col items-center">
                          <img
                            src={
                              user?.profile_photo ||
                              user?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user?.name || user?.email || "User"
                              )}&background=5B5BFF&color=fff`
                            }
                            alt="Profile"
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg"
                          />
                          <p className="text-white font-semibold text-sm mt-2 text-center truncate w-full px-1">{user?.name || 'User'}</p>
                        </div>

                        {/* Menu Items - With Labels */}
                        <div className="space-y-3 flex-1 flex flex-col w-full">
                          {/* My Dashboard */}
                          <button
                            onClick={() => {
                              setIsClickOpen(false);
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
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                            title="Dashboard"
                          >
                            <LayoutDashboard className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Dashboard</span>
                          </button>

                          {/* My Bookings */}
                          <button
                            onClick={() => {
                              setIsClickOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/bookings');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/bookings');
                              } else if (user?.role === UserRole.ENTERPRISE_ADMIN) {
                                navigate('/enterprise/bookings');
                              } else if (user?.role === UserRole.ENTERPRISE_MEMBER) {
                                navigate('/member/bookings');
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                            title="Bookings"
                          >
                            <Calendar className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Bookings</span>
                          </button>

                          {/* My Profile */}
                          <Link
                            to={profileRoute}
                            onClick={() => setIsClickOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                            title="Profile"
                          >
                            <User className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Profile</span>
                          </Link>

                          {/* Messages */}
                          <button
                            onClick={() => {
                              setIsClickOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/messages');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/messages');
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                            title="Messages"
                          >
                            <MessageCircle className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Messages</span>
                          </button>

                          {/* My Plans */}
                          <button
                            onClick={() => {
                              setIsClickOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/subscription-plans');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/plans');
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                            title="Plans"
                          >
                            <CreditCard className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Plans</span>
                          </button>

                          {/* Support */}
                          <button
                            onClick={() => {
                              setIsClickOpen(false);
                              if (user?.role === UserRole.USER) {
                                navigate('/user/support');
                              } else if (user?.role === UserRole.CONSULTANT) {
                                navigate('/consultant/support');
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all"
                            title="Support"
                          >
                            <HelpCircle className="w-5 h-5 text-white" />
                            <span className="text-white text-sm font-medium">Support</span>
                          </button>

                          {/* Logout */}
                          <div className="border-t border-indigo-400 pt-3 mt-auto w-full">
                            <button
                              onClick={() => {
                                setIsClickOpen(false);
                                handleLogout();
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-600 backdrop-blur-sm transition-all"
                              title="Logout"
                            >
                              <LogOut className="w-5 h-5 text-white" />
                              <span className="text-white text-sm font-medium">Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>

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