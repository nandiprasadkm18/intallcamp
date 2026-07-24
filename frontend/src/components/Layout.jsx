import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import {
  LayoutDashboard,
  Tv,
  Brain,
  QrCode,
  FolderOpen,
  Settings,
  LogOut,
  User as UserIcon,
  Circle,
  GraduationCap,
  Calendar,
  BookOpen
} from 'lucide-react';

const Layout = ({ children, currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();
  const { activeClassroom } = useClassroom();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', roles: ['student', 'teacher', 'admin'] },
    { name: 'Live Classroom', icon: Tv, page: 'live', roles: ['student', 'teacher', 'admin'], showLiveDot: true },
    { name: 'Academic Timetable', icon: Calendar, page: 'timetable', roles: ['student'] },
    { name: 'Registered Subjects', icon: BookOpen, page: 'subjects', roles: ['student'] },
    { name: 'AI Observability', icon: Brain, page: 'analytics', roles: ['admin'] },
    { name: 'Attendance', icon: QrCode, page: 'attendance', roles: ['student', 'teacher', 'admin'] },
    { name: 'Resources', icon: FolderOpen, page: 'resources', roles: ['student', 'teacher', 'admin'] },
    { name: 'Settings', icon: Settings, page: 'settings', roles: ['student', 'teacher', 'admin'] },
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
        <div className="p-4 border-b border-gray-200 flex items-center space-x-3 bg-gray-100/40">
          <img
            src={user?.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=User"}
            alt="avatar"
            className="w-10 h-10 rounded-full ring-2 ring-black/5"
          />
          <div className="truncate">
            <h4 className="font-semibold text-sm text-gray-800">{user?.name}</h4>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-200 text-gray-700 border border-gray-300/50">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            const isLive = item.showLiveDot && activeClassroom?.is_live;

            return (
              <button
                key={item.name}
                onClick={() => setCurrentPage(item.page)}
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
              </button>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-gray-900 capitalize">{currentPage.replace('-', ' ')}</h2>
            <p className="text-xs text-gray-500">INTELLCAMP Enterprise Academic Portal</p>
          </div>
          <div className="flex items-center space-x-4">
            {activeClassroom ? (
              <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${activeClassroom.is_live ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-600'}`}></span>
                <span className="font-semibold text-gray-700">Room: {activeClassroom.code}</span>
              </div>
            ) : (
              <div className="text-xs text-gray-500 font-semibold px-3 py-1 bg-white rounded border border-gray-200/40">
                No active classroom joined
              </div>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-8 grid-overlay">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
