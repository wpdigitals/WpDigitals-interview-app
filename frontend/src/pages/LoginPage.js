import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-screener/artifacts/fr7dkpe8_wp%20digitals%20logo.png';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-slate-200 shadow-xl">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <img src={LOGO_URL} alt="WP Digitals" className="h-16 object-contain" style={{maxWidth: '250px'}} />
          </div>