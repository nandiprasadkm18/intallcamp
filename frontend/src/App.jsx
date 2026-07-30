import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClassroomProvider } from './contexts/ClassroomContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import LiveClassroom from './pages/LiveClassroom';
import AIAnalyticsPage from './pages/AIAnalyticsPage';
import AttendancePage from './pages/AttendancePage';
import RecordsPage from './pages/RecordsPage';
import ResourcesPage from './pages/ResourcesPage';
import SettingsPage from './pages/SettingsPage';
import TimetablePage from './pages/TimetablePage';
import SuperAdminColleges from './pages/SuperAdminColleges';
import SuperAdminUsers from './pages/SuperAdminUsers';
import ComingSoon from './components/ComingSoon';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing'); // landing, auth for unauthenticated view

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center text-gray-600 font-semibold gap-3">
        <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest font-extrabold text-gray-500">INTELLCAMP Smart Classroom loading...</p>
      </div>
    );
  }

  // Unauthenticated routing
  if (!user) {
    if (view === 'landing') {
      return <LandingPage onGetStarted={() => setView('auth')} />;
    }
    return <AuthPage onBackToLanding={() => setView('landing')} />;
  }

  // Authenticated routing
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="live" element={<LiveClassroom />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="analytics" element={user.role === 'College Admin' ? <AIAnalyticsPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* Admin Routes */}
          <Route path="admin/settings" element={<SettingsPage />} />
          <Route path="admin/colleges" element={<SuperAdminColleges />} />
          <Route path="admin/users" element={<SuperAdminUsers />} />
          
          {/* Placeholder Routes */}
          <Route path="admin/roles" element={<ComingSoon moduleName="Roles & Permissions" />} />
          <Route path="admin/subs" element={<ComingSoon moduleName="Subscriptions" />} />
          <Route path="admin/features" element={<ComingSoon moduleName="Feature Toggles" />} />
          <Route path="admin/storage" element={<ComingSoon moduleName="Storage Management" />} />
          <Route path="admin/analytics" element={<ComingSoon moduleName="Global Analytics" />} />
          <Route path="admin/ai" element={<ComingSoon moduleName="AI Model Configurations" />} />
          <Route path="admin/announcements" element={<ComingSoon moduleName="Global Announcements" />} />
          <Route path="admin/logs" element={<ComingSoon moduleName="Audit Logs" />} />
          <Route path="admin/support" element={<ComingSoon moduleName="Support Center" />} />
          <Route path="admin/billing" element={<ComingSoon moduleName="Billing" />} />
          <Route path="admin/health" element={<ComingSoon moduleName="System Health" />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <ClassroomProvider>
        <AppContent />
      </ClassroomProvider>
    </AuthProvider>
  );
}

export default App;
