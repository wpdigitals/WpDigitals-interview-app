import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Sparkles, Loader2, LogOut } from 'lucide-react';

const BACKEND_URL = https://wpdigitals-interview-app.onrender.com;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-screener/artifacts/79us4sj7_WP%20digitals%20logo%20new.png';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [loading, setLoading] = useState(!location.state?.user);

  useEffect(() => {
  if (location.state?.user) {
    setLoading(false);
    return;
  }

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  checkAuth();

// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const startInterview = () => {
    navigate('/register/step1');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <img src={LOGO_URL} alt="WP Digitals" className="h-10 sm:h-12 object-contain" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {user?.picture && (
              <img src={user.picture} alt={user.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
            )}
            <span className="text-sm sm:text-base text-slate-700 font-medium truncate">{user?.name}</span>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2 text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
            Welcome, <span className="text-indigo-600">{user?.name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-4">
            Ready to showcase your skills? Start your technical interview journey now.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8 border-slate-200 shadow-xl">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Start New Interview</h2>
                <p className="text-slate-600">
                  Complete your profile and begin the AI-powered technical interview
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <span className="text-slate-700">Upload Resume</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <span className="text-slate-700">Review & Complete Profile</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <span className="text-slate-700">Start Interview</span>
                </div>
              </div>

              <Button
                data-testid="start-interview-btn"
                onClick={startInterview}
                className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg"
              >
                Begin Interview Process
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
