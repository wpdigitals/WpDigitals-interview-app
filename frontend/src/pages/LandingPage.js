import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Sparkles, Users, Clock, Award } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-slate-900">AI Interviewer</span>
          </div>
          <Button 
            data-testid="start-interview-btn"
            onClick={() => navigate('/login')} 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Start Interview
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              Technical Interview
              <span className="block text-indigo-600">Powered by AI</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Experience a structured, professional technical interview for software development positions. 
              Get evaluated on communication, technical skills, and problem-solving abilities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              data-testid="get-started-btn"
              onClick={() => navigate('/register')} 
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 rounded-xl"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Behavioral Assessment</h3>
            <p className="text-slate-600">
              10 questions evaluating communication, dedication, attitude, and learning ability.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <Clock className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Technical Evaluation</h3>
            <p className="text-slate-600">
              20 technical questions tailored to your tech stack and experience level.
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <Award className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Practical Scenarios</h3>
            <p className="text-slate-600">
              2 scenario-based questions testing system design and problem-solving.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h4 className="font-semibold text-slate-900">Register</h4>
              <p className="text-sm text-slate-600">Fill in your details and upload KYC documents</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h4 className="font-semibold text-slate-900">Interview</h4>
              <p className="text-sm text-slate-600">Answer questions across 3 phases</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h4 className="font-semibold text-slate-900">Evaluate</h4>
              <p className="text-sm text-slate-600">AI analyzes your responses</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                4
              </div>
              <h4 className="font-semibold text-slate-900">Results</h4>
              <p className="text-sm text-slate-600">Get detailed feedback and scores</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-600">
          <p>© 2024 AI Technical Interviewer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;