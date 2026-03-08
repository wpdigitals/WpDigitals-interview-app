import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Award, TrendingUp, AlertCircle, Home, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_code-screener/artifacts/79us4sj7_WP%20digitals%20logo%20new.png';

const ResultPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [interviewId]);

  const loadResult = async () => {
    try {
      const res = await axios.get(`${API}/interviews/${interviewId}/result`);
      setResult(res.data);
    } catch (error) {
      console.error('Failed to load result:', error);
      toast.error('Failed to load evaluation results');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('hire') && !rec.includes('reject')) return 'text-green-600 bg-green-50';
    if (rec.includes('consider')) return 'text-orange-600 bg-orange-50';
    if (rec.includes('reject')) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600">Loading evaluation results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <p className="text-slate-600">Results not found</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="result-page" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Award className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Evaluation Report</h1>
          <p className="text-sm sm:text-base text-slate-600 px-4">Detailed analysis of your interview performance</p>
        </div>

        {/* Total Score */}
        <Card className="border-2 border-indigo-200 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-slate-600 text-sm font-semibold">TOTAL SCORE</p>
              <p data-testid="total-score" className="text-6xl font-bold text-indigo-600">
                {result.total_score}<span className="text-3xl text-slate-400">/40</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Individual Scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span data-testid="communication-score" className={`text-4xl font-bold ${getScoreColor(result.communication_score)}`}>
                  {result.communication_score}
                </span>
                <span className="text-slate-400">/10</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${(result.communication_score / 10) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Technical Knowledge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span data-testid="technical-score" className={`text-4xl font-bold ${getScoreColor(result.technical_score)}`}>
                  {result.technical_score}
                </span>
                <span className="text-slate-400">/10</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${(result.technical_score / 10) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Problem Solving</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span data-testid="problem-solving-score" className={`text-4xl font-bold ${getScoreColor(result.problem_solving_score)}`}>
                  {result.problem_solving_score}
                </span>
                <span className="text-slate-400">/10</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${(result.problem_solving_score / 10) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">System Thinking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span data-testid="system-thinking-score" className={`text-4xl font-bold ${getScoreColor(result.system_thinking_score)}`}>
                  {result.system_thinking_score}
                </span>
                <span className="text-slate-400">/10</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${(result.system_thinking_score / 10) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-green-200 bg-green-50/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-5 h-5" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p data-testid="strengths" className="text-slate-700 whitespace-pre-wrap">{result.strengths}</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p data-testid="weaknesses" className="text-slate-700 whitespace-pre-wrap">{result.weaknesses}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recommendation */}
        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>Hiring Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${getRecommendationColor(result.recommendation)}`}>
              <p data-testid="recommendation" className="font-semibold text-lg">{result.recommendation}</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <Button
            data-testid="home-btn"
            onClick={() => navigate('/')}
            variant="outline"
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;