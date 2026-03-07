import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RegistrationPart2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const parsedData = location.state?.parsedData;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: parsedData?.name || '',
    email: parsedData?.email || '',
    phone: parsedData?.phone || '',
    role: parsedData?.role || '',
    experience: parsedData?.experience || '',
    tech_stack: parsedData?.tech_stack || '',
    address: parsedData?.address || '',
    linkedin: parsedData?.linkedin || '',
    github: parsedData?.github || '',
    twitter: parsedData?.twitter || '',
    portfolio: parsedData?.portfolio || '',
    resume_text: parsedData?.resume_text || ''
  });
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (parsedData && Object.keys(parsedData).length > 0) {
      setAutoFilled(true);
      toast.success('Resume parsed! Review and edit the details below.');
    }
  }, [parsedData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.role || !formData.experience || !formData.tech_stack) {
      toast.error('Please fill all required fields');
      return;
    }

    // Navigate to step 3 with form data
    navigate('/register/step3', { state: { formData } });
  };

  const handleBack = () => {
    navigate('/register/step1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-indigo-600">Step 2 of 3</span>
            <span className="text-sm text-slate-600">Complete Your Profile</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: '66.66%' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {autoFilled ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Sparkles className="w-8 h-8 text-indigo-600" />
            )}
            <h1 className="text-3xl font-bold text-slate-900">
              {autoFilled ? 'Review & Edit Details' : 'Complete Your Profile'}
            </h1>
          </div>
          {autoFilled && (
            <p className="text-green-600 font-medium">✓ Auto-filled from your resume</p>
          )}
        </div>

        <Card data-testid="profile-form" className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>Personal & Professional Information</CardTitle>
            <CardDescription>Review and complete all fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg border-b pb-2">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="John Doe"
                  className={autoFilled && parsedData?.name ? 'border-green-500' : ''}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    placeholder="john@example.com"
                    className={autoFilled && parsedData?.email ? 'border-green-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number *</Label>
                  <Input
                    id="phone"
                    data-testid="phone-input"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                    placeholder="+91 9876543210"
                    className={autoFilled && parsedData?.phone ? 'border-green-500' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  data-testid="address-input"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="City, State, Country"
                  rows={2}
                  className={autoFilled && parsedData?.address ? 'border-green-500' : ''}
                />
              </div>
            </div>

            {/* Professional Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg border-b pb-2">Professional Details</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied *</Label>
                  <Input
                    id="role"
                    data-testid="role-input"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    required
                    placeholder="e.g., Android Developer"
                    className={autoFilled && parsedData?.role ? 'border-green-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience *</Label>
                  <Input
                    id="experience"
                    data-testid="experience-input"
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    required
                    placeholder="e.g., 2 years"
                    className={autoFilled && parsedData?.experience ? 'border-green-500' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech_stack">Tech Stack *</Label>
                <Textarea
                  id="tech_stack"
                  data-testid="tech-stack-input"
                  value={formData.tech_stack}
                  onChange={(e) => handleChange('tech_stack', e.target.value)}
                  required
                  placeholder="e.g., Kotlin, Java, Android SDK, Room, Retrofit, MVVM"
                  rows={3}
                  className={autoFilled && parsedData?.tech_stack ? 'border-green-500' : ''}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg border-b pb-2">Social & Professional Links</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    data-testid="linkedin-input"
                    value={formData.linkedin}
                    onChange={(e) => handleChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className={autoFilled && parsedData?.linkedin ? 'border-green-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    data-testid="github-input"
                    value={formData.github}
                    onChange={(e) => handleChange('github', e.target.value)}
                    placeholder="https://github.com/username"
                    className={autoFilled && parsedData?.github ? 'border-green-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    data-testid="twitter-input"
                    value={formData.twitter}
                    onChange={(e) => handleChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                    className={autoFilled && parsedData?.twitter ? 'border-green-500' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio Website</Label>
                  <Input
                    id="portfolio"
                    data-testid="portfolio-input"
                    value={formData.portfolio}
                    onChange={(e) => handleChange('portfolio', e.target.value)}
                    placeholder="https://yourportfolio.com"
                    className={autoFilled && parsedData?.portfolio ? 'border-green-500' : ''}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                data-testid="back-btn"
                onClick={handleBack}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                data-testid="next-btn"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Next: Review & Submit'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPart2;