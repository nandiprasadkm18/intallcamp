import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import {
  LayoutDashboard, Tv, Brain, QrCode, FolderOpen, Settings, LogOut,
  User as UserIcon, Circle, GraduationCap, Calendar, BookOpen,
  Building2, Users as UsersIcon, Shield, CreditCard, Star, HardDrive, 
  BarChart, Megaphone, FileText, Ticket, DollarSign, Activity, Bell, Search, Video
} from 'lucide-react';
import ProfileModal from './ProfileModal';

const Layout = () => {
  const { user, logout } = useAuth();
  const { activeClassroom } = useClassroom();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const location = useLocation();
  
  // Helper to format the path for header title
  const currentPathName = location.pathname.split('/').pop() || 'dashboard';

  const navigation = [
    // --- SUPER ADMIN ENTERPRISE SIDEBAR ---
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', roles: ['Super Admin'] },
    { name: 'Colleges', icon: Building2, page: 'admin/colleges', roles: ['Super Admin'] },
    { name: 'Users', icon: UsersIcon, page: 'admin/users', roles: ['Super Admin'] },
    { name: 'Roles & Permissions', icon: Shield, page: 'admin/roles', roles: ['Super Admin'] },
    { name: 'Subscriptions', icon: CreditCard, page: 'admin/subs', roles: ['Super Admin'] },
    { name: 'Feature Management', icon: Star, page: 'admin/features', roles: ['Super Admin'] },
    { name: 'Storage', icon: HardDrive, page: 'admin/storage', roles: ['Super Admin'] },
    { name: 'Analytics', icon: BarChart, page: 'admin/analytics', roles: ['Super Admin'] },
    { name: 'AI Usage', icon: Brain, page: 'admin/ai', roles: ['Super Admin'] },
    { name: 'Platform Announcements', icon: Megaphone, page: 'admin/announcements', roles: ['Super Admin'] },
    { name: 'Audit Logs', icon: FileText, page: 'admin/logs', roles: ['Super Admin'] },
    { name: 'Support Tickets', icon: Ticket, page: 'admin/support', roles: ['Super Admin'] },
    { name: 'Billing', icon: DollarSign, page: 'admin/billing', roles: ['Super Admin'] },
    { name: 'System Health', icon: Activity, page: 'admin/health', roles: ['Super Admin'] },
    { name: 'Platform Settings', icon: Settings, page: 'admin/settings', roles: ['Super Admin'] },

    // --- STANDARD ACADEMIC SIDEBAR ---
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', roles: ['Student', 'Teacher', 'College Admin'] },
    { name: 'Live Classroom', icon: Tv, page: 'live', roles: ['Student', 'Teacher', 'College Admin'], showLiveDot: true },
    { name: 'Academic Timetable', icon: Calendar, page: 'timetable', roles: ['Student'] },
    { name: 'AI Observability', icon: Brain, page: 'analytics', roles: ['College Admin'] },
    { name: 'Attendance', icon: QrCode, page: 'attendance', roles: ['Student', 'Teacher'] },
    { name: 'Records', icon: Video, page: 'records', roles: ['Student', 'Teacher', 'College Admin'] },
    { name: 'Resources', icon: FolderOpen, page: 'resources', roles: ['Student', 'Teacher', 'College Admin'] },
    { name: 'Settings', icon: Settings, page: 'settings', roles: ['Student', 'Teacher', 'College Admin'] },
  ];

  const visibleNav = navigation.filter(item => item.roles.includes(user?.role));

  return (
    <div className="h-screen flex bg-white text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
        {/* Brand Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-black" />
          <div>
            <span className="font-medium text-lg tracking-tight text-black">INTELLCAMP</span>
            <p className="text-[9px] uppercase font-medium text-gray-500 tracking-widest">Smart Classroom</p>
          </div>
        </div>

        {/* User Card */}
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="p-4 border-b border-gray-200 flex items-center space-x-3 bg-gray-100/40 hover:bg-gray-200/50 transition-colors w-full text-left"
        >
          <img
            src={user?.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=User"}
            alt="avatar"
            className="w-10 h-10 rounded-full ring-2 ring-black/5"
          />
          <div className="truncate">
            <h4 className="font-semibold text-sm text-gray-800">{user?.full_name || user?.name || "System Admin"}</h4>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-200 text-gray-700 border border-gray-300/50">
              {user?.role}
            </span>
          </div>
        </button>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(`/${item.page}`);
            const isLive = item.showLiveDot && activeClassroom?.is_live;

            return (
              <Link
                to={`/${item.page}`}
                key={item.name}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all group ${isActive
                    ? 'bg-black/5 text-black border-l-4 border-black pl-3'
                    : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-black' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span>{item.name}</span>
                </div>
                {isLive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-650 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {isProfileOpen && (
        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          user={user} 
          onUpdate={() => window.location.reload()} 
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 capitalize">{currentPathName.replace('-', ' ')}</h2>
            {user?.role !== 'Super Admin' && <p className="text-xs text-gray-500">INTELLCAMP Enterprise Academic Portal</p>}
          </div>
          
          <div className="flex items-center space-x-6">
            {user?.role === 'Super Admin' && (
              <div className="hidden md:flex items-center space-x-4 mr-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Global search..." className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  All Systems Operational
                </div>
                <button className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                </button>
              </div>
            )}
            
            {activeClassroom ? (
              <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${activeClassroom.is_live ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-600'}`}></span>
                <span className="font-semibold text-gray-700">Room: {activeClassroom.code}</span>
              </div>
            ) : user?.role !== 'Super Admin' ? (
              <div className="text-xs text-gray-500 font-semibold px-3 py-1 bg-white rounded border border-gray-200/40">
                No active classroom joined
              </div>
            ) : null}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-8 grid-overlay">
          <Outlet />
        </main>
      </div>

      {isProfileOpen && (
        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
          user={user} 
          onUpdate={() => window.location.reload()} 
        />
      )}
    </div>
  );
};

export default Layout;
