import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Shield, LogOut, Trash2, Eye, Mail, Loader2, Video, FileText } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-screener/artifacts/79us4sj7_WP%20digitals%20logo%20new.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [invitationForm, setInvitationForm] = useState({
    email: '',
    name: '',
    meeting_date: '',
    meeting_time: ''
  });

  useEffect(() => {
    checkAuth();
    loadInterviews();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/admin/me`, {
        withCredentials: true
      });
      setAdmin(response.data);
    } catch (error) {
      navigate('/admin/login');
    }
  };

  const loadInterviews = async () => {
    try {
      const response = await axios.get(`${API}/admin/interviews`, {
        withCredentials: true
      });
      setInterviews(response.data);
    } catch (error) {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/admin/logout`, {}, { withCredentials: true });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const viewInterviewDetails = async (interviewId) => {
    try {
      const response = await axios.get(`${API}/admin/interviews/${interviewId}/details`, {
        withCredentials: true
      });
      setSelectedInterview(response.data);
    } catch (error) {
      toast.error('Failed to load interview details');
    }
  };

  const deleteInterview = async (interviewId) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;

    try {
      await axios.delete(`${API}/admin/interviews/${interviewId}`, {
        withCredentials: true
      });
      toast.success('Interview deleted successfully');
      loadInterviews();
    } catch (error) {
      toast.error('Failed to delete interview');
    }
  };

  const sendInvitation = async () => {
    try {
      await axios.post(`${API}/admin/send-invitation`, invitationForm, {
        withCredentials: true
      });
      toast.success(`Invitation sent to ${invitationForm.email}`);
      setInvitationForm({ email: '', name: '', meeting_date: '', meeting_time: '' });
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      terminated: 'bg-red-100 text-red-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="WP Digitals" className="h-12 object-contain max-w-[180px]" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-slate-900">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-700">{admin?.name}</span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{interviews.length}</p>
                <p className="text-sm text-slate-600">Total Interviews</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {interviews.filter(i => i.status === 'completed').length}
                </p>
                <p className="text-sm text-slate-600">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {interviews.filter(i => i.status === 'active').length}
                </p>
                <p className="text-sm text-slate-600">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {interviews.filter(i => i.status === 'terminated').length}
                </p>
                <p className="text-sm text-slate-600">Terminated</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Mail className="w-4 h-4" />
                Send Interview Invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Interview Invitation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Candidate Name</Label>
                  <Input
                    value={invitationForm.name}
                    onChange={(e) => setInvitationForm({ ...invitationForm, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={invitationForm.email}
                    onChange={(e) => setInvitationForm({ ...invitationForm, email: e.target.value })}
                    placeholder="candidate@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={invitationForm.meeting_date}
                      onChange={(e) => setInvitationForm({ ...invitationForm, meeting_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={invitationForm.meeting_time}
                      onChange={(e) => setInvitationForm({ ...invitationForm, meeting_time: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={sendInvitation} className="w-full bg-blue-600 hover:bg-blue-700">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Interviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-semibold text-slate-700">Candidate</th>
                    <th className="pb-3 font-semibold text-slate-700">Role</th>
                    <th className="pb-3 font-semibold text-slate-700">Experience</th>
                    <th className="pb-3 font-semibold text-slate-700">Status</th>
                    <th className="pb-3 font-semibold text-slate-700">Phase</th>
                    <th className="pb-3 font-semibold text-slate-700">Date</th>
                    <th className="pb-3 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview) => (
                    <tr key={interview.id} className="border-b last:border-0">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-slate-900">{interview.candidate?.name}</p>
                          <p className="text-sm text-slate-600">{interview.candidate?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 text-slate-700">{interview.candidate?.role}</td>
                      <td className="py-4 text-slate-700">{interview.candidate?.experience}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(interview.status)}`}>
                          {interview.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-700">{interview.phase}</td>
                      <td className="py-4 text-slate-700">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewInterviewDetails(interview.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Interview Details</DialogTitle>
                              </DialogHeader>
                              {selectedInterview && (
                                <div className="space-y-4">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-semibold mb-2">Candidate Info</h3>
                                      <p><strong>Name:</strong> {selectedInterview.candidate?.name}</p>
                                      <p><strong>Email:</strong> {selectedInterview.candidate?.email}</p>
                                      <p><strong>Phone:</strong> {selectedInterview.candidate?.whatsapp}</p>
                                      <p><strong>Role:</strong> {selectedInterview.candidate?.role}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold mb-2">Interview Info</h3>
                                      <p><strong>Status:</strong> {selectedInterview.interview?.status}</p>
                                      <p><strong>Phase:</strong> {selectedInterview.interview?.phase}</p>
                                      <p><strong>Videos:</strong> {selectedInterview.interview?.video_recordings?.length || 0} chunks</p>
                                    </div>
                                  </div>

                                  {selectedInterview.result && (
                                    <div>
                                      <h3 className="font-semibold mb-2">Scores</h3>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded">
                                          <p className="text-2xl font-bold text-blue-600">
                                            {selectedInterview.result.communication_score}/10
                                          </p>
                                          <p className="text-xs">Communication</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded">
                                          <p className="text-2xl font-bold text-green-600">
                                            {selectedInterview.result.technical_score}/10
                                          </p>
                                          <p className="text-xs">Technical</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded">
                                          <p className="text-2xl font-bold text-purple-600">
                                            {selectedInterview.result.problem_solving_score}/10
                                          </p>
                                          <p className="text-xs">Problem Solving</p>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded">
                                          <p className="text-2xl font-bold text-orange-600">
                                            {selectedInterview.result.system_thinking_score}/10
                                          </p>
                                          <p className="text-xs">System Thinking</p>
                                        </div>
                                      </div>
                                      <div className="mt-4 grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded">
                                          <p className="text-sm text-slate-600">Total Score</p>
                                          <p className="text-3xl font-bold text-slate-900">{selectedInterview.result.total_score}/40</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded">
                                          <p className="text-sm text-slate-600">Recommendation</p>
                                          <p className="text-lg font-semibold text-slate-900">{selectedInterview.result.recommendation}</p>
                                        </div>
                                      </div>
                                      <div className="mt-4 space-y-2">
                                        <div>
                                          <p className="text-sm font-semibold text-slate-700">Strengths:</p>
                                          <p className="text-sm text-slate-600">{selectedInterview.result.strengths}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-slate-700">Weaknesses:</p>
                                          <p className="text-sm text-slate-600">{selectedInterview.result.weaknesses}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Video Recordings */}
                                  {selectedInterview.interview?.video_recordings && selectedInterview.interview.video_recordings.length > 0 && (
                                    <div>
                                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Video Recordings ({selectedInterview.interview.video_recordings.length} chunks)
                                      </h3>
                                      <div className="bg-slate-50 p-4 rounded">
                                        <p className="text-sm text-slate-600 mb-2">
                                          Interview video captured in {selectedInterview.interview.video_recordings.length} segments
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                          {selectedInterview.interview.video_recordings.slice(0, 6).map((chunk, idx) => (
                                            <div key={idx} className="bg-slate-800 rounded p-2 text-center">
                                              <Video className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                                              <p className="text-xs text-slate-300">Chunk {idx + 1}</p>
                                              <p className="text-xs text-slate-400">{(chunk.length / 1024).toFixed(0)}KB</p>
                                            </div>
                                          ))}
                                        </div>
                                        {selectedInterview.interview.video_recordings.length > 6 && (
                                          <p className="text-xs text-slate-500 mt-2 text-center">
                                            + {selectedInterview.interview.video_recordings.length - 6} more chunks
                                          </p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-3">
                                          Note: Video playback feature available in full version. Videos are stored securely.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <h3 className="font-semibold mb-2">Interview Transcript</h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {selectedInterview.messages?.filter(m => m.role !== 'system').map((msg, idx) => (
                                        <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                          <p className="text-xs font-semibold mb-1">{msg.role === 'user' ? 'Candidate' : 'Interviewer'}</p>
                                          <p className="text-sm">{msg.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteInterview(interview.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
