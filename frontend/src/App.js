import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import DashboardPage from './pages/DashboardPage';
import RegistrationPart1 from './pages/RegistrationPart1';
import RegistrationPart2 from './pages/RegistrationPart2';
import RegistrationPart3 from './pages/RegistrationPart3';
import InterviewPage from './pages/InterviewPage';
import InterviewTerminated from './pages/InterviewTerminated';
import ResultPage from './pages/ResultPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function AppRouter() {
  const location = useLocation();
  
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment for session_id (synchronous check prevents race conditions)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/register/step1" element={<RegistrationPart1 />} />
      <Route path="/register/step2" element={<RegistrationPart2 />} />
      <Route path="/register/step3" element={<RegistrationPart3 />} />
      <Route path="/interview/:interviewId" element={<InterviewPage />} />
      <Route path="/interview/:interviewId/terminated" element={<InterviewTerminated />} />
      <Route path="/result/:interviewId" element={<ResultPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;