import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: '',
    experience: '',
    tech_stack: '',
    kyc_aadhar: '',
    kyc_pan: ''
  });
  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create candidate
      const candidateRes = await axios.post(`${API}/candidates`, formData);
      const candidateId = candidateRes.data.id;

      // Upload documents if provided
      if (aadharFile || panFile) {
        const formDataFiles = new FormData();
        if (aadharFile) formDataFiles.append('aadhar_file', aadharFile);
        if (panFile) formDataFiles.append('pan_file', panFile);

        await axios.post(`${API}/candidates/${candidateId}/documents`, formDataFiles, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Start interview
      const interviewRes = await axios.post(`${API}/interviews/start`, {
        candidate_id: candidateId
      });

      toast.success('Registration successful!');
      navigate(`/interview/${interviewRes.data.id}`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Candidate Registration</h1>
          <p className="text-slate-600">Please fill in your details to start the interview</p>
        </div>

        <Card data-testid="registration-form" className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>All fields are required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    data-testid="whatsapp-input"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    required
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied</Label>
                  <Input
                    id="role"
                    data-testid="role-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    placeholder="e.g., Android Developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    data-testid="experience-input"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    required
                    placeholder="e.g., 2 years"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech_stack">Tech Stack</Label>
                <Textarea
                  id="tech_stack"
                  data-testid="tech-stack-input"
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  required
                  placeholder="e.g., Kotlin, Java, Android SDK, Room, Retrofit"
                  rows={3}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">KYC Details</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kyc_aadhar">Aadhar Number</Label>
                    <Input
                      id="kyc_aadhar"
                      data-testid="aadhar-number-input"
                      value={formData.kyc_aadhar}
                      onChange={(e) => setFormData({ ...formData, kyc_aadhar: e.target.value })}
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
                      value={formData.kyc_pan}
                      onChange={(e) => setFormData({ ...formData, kyc_pan: e.target.value })}
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
              </div>

              <Button 
                data-testid="submit-registration-btn"
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  'Start Interview'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPage;