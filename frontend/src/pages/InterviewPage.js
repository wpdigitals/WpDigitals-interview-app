import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interview, setInterview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadInterview();
    loadMessages();
  }, [interviewId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInterview = async () => {
    try {
      const res = await axios.get(`${API}/interviews/${interviewId}`);
      setInterview(res.data);
      
      if (res.data.status === 'completed') {
        // Check if result exists
        try {
          await axios.get(`${API}/interviews/${interviewId}/result`);
          navigate(`/result/${interviewId}`);
        } catch (error) {
          // Result doesn't exist yet, allow evaluation
        }
      }
    } catch (error) {
      console.error('Failed to load interview:', error);
      toast.error('Failed to load interview');
    }
  };

  const loadMessages = async () => {
    try {
      const res = await axios.get(`${API}/interviews/${interviewId}/messages`);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const res = await axios.post(`${API}/interviews/${interviewId}/message`, {
        content: userMessage
      });

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date().toISOString()
      }]);

      // Update interview state
      setInterview(prev => ({
        ...prev,
        phase: res.data.phase,
        status: res.data.status
      }));

      // If interview completed, navigate to evaluation
      if (res.data.status === 'completed') {
        toast.success('Interview completed! Generating evaluation...');
        setTimeout(() => {
          handleEvaluate();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.detail || 'Failed to send message');
      // Remove the optimistically added message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      await axios.post(`${API}/interviews/${interviewId}/evaluate`);
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
      'completed': { name: 'Completed', color: 'bg-gray-500' }
    };
    
    return phaseMap[interview.phase] || { name: 'Unknown', color: 'bg-gray-500' };
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div data-testid="interview-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Technical Interview</h1>
            <p className="text-sm text-slate-600">Answer questions honestly and thoroughly</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`${phaseInfo.color} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
              {phaseInfo.name}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-4 mb-32">
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
                  </div>
                </div>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {interview?.status !== 'completed' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                data-testid="message-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your answer here... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 min-h-[100px] resize-none"
                disabled={loading}
              />
              <Button
                data-testid="send-message-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
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

      {/* Completed state */}
      {interview?.status === 'completed' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-6">
          <div className="max-w-5xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Interview Completed!</span>
            </div>
            <Button
              data-testid="view-results-btn"
              onClick={handleEvaluate}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Generate Evaluation Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;