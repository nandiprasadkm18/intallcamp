import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClassroomProvider } from './contexts/ClassroomContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import LiveClassroom from './pages/LiveClassroom';
import AIAnalyticsPage from './pages/AIAnalyticsPage';
import AttendancePage from './pages/AttendancePage';
import ResourcesPage from './pages/ResourcesPage';
import SettingsPage from './pages/SettingsPage';
import TimetablePage from './pages/TimetablePage';
import RegisteredSubjectsPage from './pages/RegisteredSubjectsPage';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing'); // landing, auth
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard, live, analytics, attendance, resources, settings

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center text-gray-600 font-semibold gap-3">
        <div className="h-8 w-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-widest font-extrabold text-gray-500">INTELLCAMP Smart Classroom loading...</p>
      </div>
    );
  }

  // If user is NOT authenticated, toggle landing or registration views
  if (!user) {
    if (view === 'landing') {
      return <LandingPage onGetStarted={() => setView('auth')} />;
    }
    return <AuthPage onBackToLanding={() => setView('landing')} />;
  }

  // Render the core authenticated dashboard layout
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'live':
        return <LiveClassroom setCurrentPage={setCurrentPage} />;
      case 'timetable':
        return <TimetablePage setCurrentPage={setCurrentPage} />;
      case 'subjects':
        return <RegisteredSubjectsPage setCurrentPage={setCurrentPage} />;
      case 'analytics':
        return user.role === 'admin' ? <AIAnalyticsPage /> : <Dashboard setCurrentPage={setCurrentPage} />;
      case 'attendance':
        return <AttendancePage />;
      case 'resources':
        return <ResourcesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
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
