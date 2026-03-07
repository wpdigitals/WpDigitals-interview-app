import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Upload, Loader2, FileText, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-screener/artifacts/fr7dkpe8_wp%20digitals%20logo.png';

const RegistrationPart1 = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!resumeFile) {
      toast.error('Please select a resume file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);

      const response = await axios.post(`${API}/resume/parse`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      toast.success('Resume parsed successfully!');
      
      // Navigate to step 2 with parsed data
      navigate('/register/step2', { state: { parsedData: response.data } });
    } catch (error) {
      console.error('Resume parse error:', error);
      toast.error(error.response?.data?.detail || 'Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  const skipResume = () => {
    navigate('/register/step2', { state: { parsedData: null } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-indigo-600">Step 1 of 3</span>
            <span className="text-sm text-slate-600">Upload Resume</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '33.33%' }} />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={LOGO_URL} alt="WP Digitals" className="h-16 object-contain" style={{maxWidth: '250px'}} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Your Resume</h1>
          <p className="text-slate-600">Smart parsing will automatically extract your details</p>
        </div>

        <Card data-testid="resume-upload-card" className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>Resume Upload</CardTitle>
            <CardDescription>Upload your resume in PDF, DOC, or TXT format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              data-testid="resume-dropzone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-300 hover:border-indigo-400'
              }`}
            >
              {resumeFile ? (
                <div className="space-y-4">
                  <FileText className="w-16 h-16 text-indigo-600 mx-auto" />
                  <div>
                    <p className="font-semibold text-slate-900">{resumeFile.name}</p>
                    <p className="text-sm text-slate-500">
                      {(resumeFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setResumeFile(null)}
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-lg font-semibold text-slate-700 mb-1">
                      Drag & drop your resume here
                    </p>
                    <p className="text-sm text-slate-500">or</p>
                  </div>
                  <div>
                    <Label htmlFor="resume-file" className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        <Upload className="w-4 h-4" />
                        Browse Files
                      </div>
                    </Label>
                    <input
                      id="resume-file"
                      data-testid="resume-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                data-testid="skip-resume-btn"
                onClick={skipResume}
                variant="outline"
                className="flex-1"
              >
                Skip & Fill Manually
              </Button>
              <Button
                data-testid="upload-resume-btn"
                onClick={handleUpload}
                disabled={!resumeFile || loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse Resume
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-1">✨ Smart Parsing</p>
            <p className="text-xs text-slate-600">Automatically extracts all your details</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-1">⚡ Save Time</p>
            <p className="text-xs text-slate-600">No manual typing required</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-1">🔒 Secure</p>
            <p className="text-xs text-slate-600">Your data is safely processed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPart1;