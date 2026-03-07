import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Clock, MessageSquare, Activity, LogOut, Home } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-screener/artifacts/79us4sj7_WP%20digitals%20logo%20new.png';

const InterviewTerminated = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [interviewId]);

  const loadStats = async () => {
    try {
      const messagesRes = await axios.get(`${API}/interviews/${interviewId}/messages`, {
        withCredentials: true
      });
      
      const messages = messagesRes.data;
      const userMessages = messages.filter(m => m.role === 'user');
      
      // Calculate statistics
      const questionsAnswered = userMessages.filter(m => m.content && m.content.trim() !== '').length;
      const totalTimeTaken = userMessages.reduce((sum, m) => sum + (m.time_taken || 0), 0);
      const avgTimePerQuestion = questionsAnswered > 0 ? Math.floor(totalTimeTaken / questionsAnswered) : 0;
      
      setStats({
        questionsAnswered,
        totalTimeTaken,
        avgTimePerQuestion,
        totalQuestions: messages.filter(m => m.role === 'assistant').length - 1 // Exclude greeting
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <img src={LOGO_URL} alt="WP Digitals" className="h-12 object-contain" />
          <div className="flex gap-3">
            <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Thank You Message */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Interview Completed</h1>
          <p className="text-xl text-slate-600 mb-2">
            Thank you for your time and participation!
          </p>
          <p className="text-slate-600">
            Our team will review your responses and get back to you soon.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Questions Answered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">
                  {stats?.questionsAnswered || 0}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  out of {stats?.totalQuestions || 0} questions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Total Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">
                  {formatTime(stats?.totalTimeTaken || 0)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  time spent
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Average Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-600">
                  {formatTime(stats?.avgTimePerQuestion || 0)}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  per question
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Review Process</h3>
                <p className="text-slate-600">Our team will carefully review your interview responses and performance.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Evaluation</h3>
                <p className="text-slate-600">We'll assess your skills, experience, and cultural fit for the position.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Communication</h3>
                <p className="text-slate-600">You'll receive an email with the next steps within 3-5 business days.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </main>
    </div>
  );
};

export default InterviewTerminated;
