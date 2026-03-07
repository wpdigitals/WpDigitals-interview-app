import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Users, Clock, Award, CheckCircle, ArrowRight } from 'lucide-react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-screener/artifacts/fr7dkpe8_wp%20digitals%20logo.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="px-6 py-6 bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="WP Digitals" className="h-16 object-contain" style={{maxWidth: '200px'}} />
          </div>
          <Button 
            data-testid="start-interview-btn"
            onClick={() => navigate('/login')} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Start Interview
          </Button>
        </div>
      </header>