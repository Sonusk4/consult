
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User as UserIcon, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../App';
import { SIDEBAR_LINKS } from '../constants';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = user ? SIDEBAR_LINKS[user.role as UserRole] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight">ConsultaPro</Link>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === link.path 
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center">
            <button className="lg:hidden mr-4" onClick={() => setIsSidebarOpen(true)}><Menu size={20} /></button>
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {/* Clickable Profile Navigation */}
            <Link to="/profile" className="flex items-center space-x-3 pl-4 border-l hover:bg-gray-50 p-1 px-2 rounded-xl transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-none">{user?.name}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-1">{user?.role.toLowerCase().replace('_', ' ')}</p>
              </div>
              <img src={user?.avatar} alt="Avatar" className="w-9 h-9 rounded-full ring-2 ring-blue-50 object-cover shadow-sm" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
