import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2, CheckCircle2, Edit } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RegistrationPart3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData;
  
  const [loading, setLoading] = useState(false);
  const [kycData, setKycData] = useState({
    kyc_aadhar: '',
    kyc_pan: ''
  });
  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);

  if (!formData) {
    navigate('/register/step1');
    return null;
  }

  const handleStartInterview = async () => {
    setLoading(true);

    try {
      // Get current user
      const userRes = await axios.get(`${API}/auth/me`, { withCredentials: true });
      const user = userRes.data;

      // Create candidate
      const candidateData = {
        user_id: user.user_id,
        name: formData.name,
        email: formData.email,
        whatsapp: formData.phone,
        role: formData.role,
        experience: formData.experience,
        tech_stack: formData.tech_stack,
        address: formData.address || undefined,
        linkedin: formData.linkedin || undefined,
        github: formData.github || undefined,
        twitter: formData.twitter || undefined,
        portfolio: formData.portfolio || undefined,
        kyc_aadhar: kycData.kyc_aadhar || undefined,
        kyc_pan: kycData.kyc_pan || undefined
      };

      const candidateRes = await axios.post(`${API}/candidates`, candidateData, {
        withCredentials: true
      });
      const candidateId = candidateRes.data.id;

      // Upload KYC documents if provided
      if (aadharFile || panFile) {
        const formDataFiles = new FormData();
        if (aadharFile) formDataFiles.append('aadhar_file', aadharFile);
        if (panFile) formDataFiles.append('pan_file', panFile);

        await axios.post(`${API}/candidates/${candidateId}/documents`, formDataFiles, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
      }

      // Start interview
      const interviewRes = await axios.post(`${API}/interviews/start`, {
        candidate_id: candidateId
      }, { withCredentials: true });

      toast.success('Profile completed! Starting interview...');
      navigate(`/interview/${interviewRes.data.id}`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/register/step2', { state: { parsedData: formData } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-indigo-600">Step 3 of 3</span>
            <span className="text-sm text-slate-600">Final Review</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-slate-900">Final Review</h1>
          </div>
          <p className="text-slate-600">Verify your details and complete KYC</p>
        </div>

        {/* Profile Summary */}
        <Card className="border-slate-200 shadow-xl mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Profile Summary</CardTitle>
              <Button
                data-testid="edit-profile-btn"
                onClick={handleBack}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-semibold text-slate-900">{formData.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-semibold text-slate-900">{formData.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">WhatsApp</p>
                <p className="font-semibold text-slate-900">{formData.phone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Role</p>
                <p className="font-semibold text-slate-900">{formData.role}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Experience</p>
                <p className="font-semibold text-slate-900">{formData.experience}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Address</p>
                <p className="font-semibold text-slate-900">{formData.address || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-slate-500">Tech Stack</p>
                <p className="font-semibold text-slate-900">{formData.tech_stack}</p>
              </div>
              {(formData.linkedin || formData.github || formData.twitter || formData.portfolio) && (
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500 mb-2">Social Links</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.linkedin && (
                      <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {formData.github && (
                      <a href={formData.github} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                        GitHub
                      </a>
                    )}
                    {formData.twitter && (
                      <a href={formData.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                        Twitter
                      </a>
                    )}
                    {formData.portfolio && (
                      <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KYC Details */}
        <Card data-testid="kyc-card" className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>KYC Details (Optional)</CardTitle>
            <CardDescription>Provide your identity documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kyc_aadhar">Aadhar Number</Label>
                <Input
                  id="kyc_aadhar"
                  data-testid="aadhar-number-input"
                  value={kycData.kyc_aadhar}
                  onChange={(e) => setKycData({ ...kycData, kyc_aadhar: e.target.value })}
                  placeholder="1234 5678 9012"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhar_file">Upload Aadhar (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="aadhar_file"
                    data-testid="aadhar-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setAadharFile(e.target.files[0])}
                    className="cursor-pointer"
                  />
                  {aadharFile && <Upload className="w-5 h-5 text-green-600" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kyc_pan">PAN Number</Label>
                <Input
                  id="kyc_pan"
                  data-testid="pan-number-input"
                  value={kycData.kyc_pan}
                  onChange={(e) => setKycData({ ...kycData, kyc_pan: e.target.value })}
                  placeholder="ABCDE1234F"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan_file">Upload PAN (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pan_file"
                    data-testid="pan-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPanFile(e.target.files[0])}
                    className="cursor-pointer"
                  />
                  {panFile && <Upload className="w-5 h-5 text-green-600" />}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
                data-testid="start-interview-btn"
                onClick={handleStartInterview}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Start Interview
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPart3;