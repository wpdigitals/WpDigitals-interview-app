import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle, Video, VideoOff, Clock, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState(null);
  const [timer, setTimer] = useState(120); // 2 minutes per question
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingStream, setRecordingStream] = useState(null);
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    loadInterview();
    loadMessages();
    requestCameraAccess();
  }, [interviewId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer countdown with auto-submit
  useEffect(() => {
    if (!questionStartTime || interview?.status === 'completed' || interview?.status === 'terminated') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
      const remaining = 120 - elapsed;
      
      if (remaining <= 0) {
        setTimer(0);
        // Auto-submit empty answer when time runs out
        if (!loading) {
          handleTimeoutSubmit();
        }
      } else {
        setTimer(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [questionStartTime, interview?.status, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setRecordingStream(stream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          await uploadVideoChunk(blob);
          recordedChunksRef.current = [];
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      toast.success('Camera and recording active');
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Camera access denied. Please enable camera to continue.');
      setCameraActive(false);
    }
  };

  const uploadVideoChunk = async (blob) => {
    try {
      const formData = new FormData();
      formData.append('video', blob, 'interview-chunk.webm');
      
      await axios.post(`${API}/interviews/${interviewId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
    } catch (error) {
      console.error('Video upload error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }
    
    setCameraActive(false);
  };

  const loadInterview = async () => {
    try {
      const res = await axios.get(`${API}/interviews/${interviewId}`, {
        withCredentials: true
      });
      setInterview(res.data);
      
      if (res.data.status === 'completed') {
        stopRecording();
        try {
          await axios.get(`${API}/interviews/${interviewId}/result`, {
            withCredentials: true
          });
          navigate(`/result/${interviewId}`);
        } catch (error) {
          // Result doesn't exist yet
        }
      }
    } catch (error) {
      console.error('Failed to load interview:', error);
      toast.error('Failed to load interview');
    }
  };

  const loadMessages = async () => {
    try {
      const res = await axios.get(`${API}/interviews/${interviewId}/messages`, {
        withCredentials: true
      });
      setMessages(res.data);
      
      // Set question start time for the latest question
      if (res.data.length > 0) {
        const lastAssistant = res.data.filter(m => m.role === 'assistant').pop();
        if (lastAssistant) {
          setQuestionStartTime(new Date(lastAssistant.timestamp).getTime());
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    toast.error('Pasting is disabled during the interview');
  };

  const handleTimeoutSubmit = async () => {
    const timeTaken = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 120;
    setLoading(true);

    // Add empty user message to UI
    setMessages(prev => [...prev, {
      role: 'user',
      content: '(No answer provided - Time expired)',
      timestamp: new Date().toISOString()
    }]);

    try {
      const res = await axios.post(`${API}/interviews/${interviewId}/message`, {
        content: '',
        time_taken: timeTaken,
        is_timeout: true
      }, { withCredentials: true });

      // Check if interview was terminated
      if (res.data.status === 'terminated') {
        stopRecording();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.data.message,
          timestamp: new Date().toISOString()
        }]);
        setInterview(prev => ({
          ...prev,
          status: 'terminated',
          termination_reason: res.data.termination_reason
        }));
        toast.info('Interview has been terminated');
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date().toISOString()
      }]);

      setInterview(prev => ({
        ...prev,
        phase: res.data.phase,
        status: res.data.status
      }));

      // Reset timer for new question
      setQuestionStartTime(Date.now());
      setTimer(120);

      if (res.data.status === 'completed') {
        stopRecording();
        toast.success('Interview completed! Generating evaluation...');
        setTimeout(() => {
          handleEvaluate();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to submit timeout:', error);
      toast.error('Failed to proceed to next question');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!cameraActive) {
      toast.error('Camera must be active during interview');
      return;
    }

    const userMessage = input;
    const timeTaken = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const res = await axios.post(`${API}/interviews/${interviewId}/message`, {
        content: userMessage,
        time_taken: timeTaken,
        is_timeout: false
      }, { withCredentials: true });

      // Check if interview was terminated
      if (res.data.status === 'terminated') {
        stopRecording();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: res.data.message,
          timestamp: new Date().toISOString()
        }]);
        setInterview(prev => ({
          ...prev,
          status: 'terminated',
          termination_reason: res.data.termination_reason
        }));
        toast.info('Interview has been terminated');
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date().toISOString()
      }]);

      setInterview(prev => ({
        ...prev,
        phase: res.data.phase,
        status: res.data.status
      }));

      // Reset timer for new question
      setQuestionStartTime(Date.now());
      setTimer(120);

      if (res.data.status === 'completed') {
        stopRecording();
        toast.success('Interview completed! Generating evaluation...');
        setTimeout(() => {
          handleEvaluate();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.detail || 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      await axios.post(`${API}/interviews/${interviewId}/evaluate`, {}, {
        withCredentials: true
      });
      navigate(`/result/${interviewId}`);
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error('Failed to generate evaluation');
    }
  };

  const getPhaseInfo = () => {
    if (!interview) return { name: 'Loading...', color: 'bg-gray-500' };
    
    const phaseMap = {
      'init': { name: 'Introduction', color: 'bg-blue-500' },
      'phase1': { name: 'Phase 1: Behavioral', color: 'bg-green-500' },
      'phase2': { name: 'Phase 2: Technical', color: 'bg-purple-500' },
      'phase3': { name: 'Phase 3: Practical', color: 'bg-orange-500' },
      'completed': { name: 'Completed', color: 'bg-gray-500' },
      'terminated': { name: 'Terminated', color: 'bg-red-500' }
    };
    
    return phaseMap[interview.phase] || { name: 'Unknown', color: 'bg-gray-500' };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const phaseInfo = getPhaseInfo();
  const isTimeLow = timer <= 30 && timer > 0;
  const isTimeUp = timer === 0;

  return (
    <div data-testid="interview-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Technical Interview</h1>
            <p className="text-sm text-slate-600">Type your answers - pasting is disabled</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isTimeUp ? 'bg-red-100 text-red-700' : 
              isTimeLow ? 'bg-orange-100 text-orange-700' : 
              'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">{formatTime(timer)}</span>
            </div>
            
            {/* Camera Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              cameraActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {cameraActive ? (
                <>
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-semibold">Recording</span>
                </>
              ) : (
                <>
                  <VideoOff className="w-4 h-4" />
                  <span className="text-sm font-semibold">No Camera</span>
                </>
              )}
            </div>
            
            {/* Phase Badge */}
            <div className={`${phaseInfo.color} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
              {phaseInfo.name}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr,300px] gap-6">
        {/* Main Chat Area */}
        <div>
          <div className="space-y-4 mb-32">
            {!cameraActive && (
              <Card className="border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Camera Required</p>
                    <p className="text-sm text-red-700">
                      Please enable your camera to continue the interview. This is required for expression analysis.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                data-testid={`message-${msg.role}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-3xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-semibold mb-1 opacity-70">
                        {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.time_taken && msg.role === 'user' && (
                        <div className="text-xs opacity-70 mt-2">
                          Time taken: {formatTime(msg.time_taken)}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Video Preview Sidebar */}
        <div className="hidden lg:block">
          <Card className="border-slate-200 sticky top-24">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Live Preview</h3>
                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <VideoOff className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  {cameraActive && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      REC
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-slate-600 space-y-1">
                <p>• Camera is recording for expression analysis</p>
                <p>• Each question has 2-minute time limit</p>
                <p>• Pasting text is disabled</p>
                <p>• Type your answers naturally</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Input Area */}
      {interview?.status !== 'completed' && interview?.status !== 'terminated' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                data-testid="message-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your answer here... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 min-h-[100px] resize-none"
                disabled={loading || !cameraActive}
              />
              <Button
                data-testid="send-message-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim() || !cameraActive}
                className="bg-indigo-600 hover:bg-indigo-700 h-[100px] px-8"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completed or Terminated state */}
      {(interview?.status === 'completed' || interview?.status === 'terminated') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-6">
          <div className="max-w-7xl mx-auto text-center space-y-4">
            <div className={`flex items-center justify-center gap-2 ${interview.status === 'terminated' ? 'text-orange-600' : 'text-green-600'}`}>
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">
                {interview.status === 'terminated' 
                  ? 'Interview Terminated - Thank you for your time!' 
                  : 'Interview Completed!'}
              </span>
            </div>
            {interview.status === 'completed' && (
              <Button
                data-testid="view-results-btn"
                onClick={handleEvaluate}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Generate Evaluation Report
              </Button>
            )}
            {interview.status === 'terminated' && (
              <p className="text-slate-600">
                Our team will review your responses and contact you soon.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;