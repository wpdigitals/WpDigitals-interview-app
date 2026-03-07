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
            <img src={LOGO_URL} alt="WP Digitals" className="h-10" />
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

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="py-20 text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              Technical Interview Platform
              <span className="block text-blue-600 mt-2">For Software Developers</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              WP Digitals' comprehensive interview solution for evaluating software development talent. 
              Streamlined process from registration to detailed evaluation reports.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              data-testid="get-started-btn"
              onClick={() => navigate('/login')} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-10 py-7 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Registration & Interview Process */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Registration & Interview Process</h2>
            <p className="text-lg text-slate-600">Complete your interview in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-3xl font-bold text-blue-600">1</div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sign In with Google</h3>
              <p className="text-slate-600 leading-relaxed">
                Quick and secure authentication using your Google account. No manual registration needed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-3xl font-bold text-blue-600">2</div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Resume</h3>
              <p className="text-slate-600 leading-relaxed">
                Smart resume parsing automatically extracts your details - name, skills, experience, and social profiles.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-3xl font-bold text-blue-600">3</div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Review & Submit</h3>
              <p className="text-slate-600 leading-relaxed">
                Verify auto-filled details, add missing information, upload KYC documents, and confirm to proceed.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-3xl font-bold text-blue-600">4</div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Complete Interview</h3>
              <p className="text-slate-600 leading-relaxed">
                Answer questions across 3 phases with camera recording and time tracking for comprehensive evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Interview Features */}
        <div className="py-16 bg-gradient-to-br from-blue-50 to-white rounded-3xl my-16 px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Interview Features</h2>
            <p className="text-lg text-slate-600">Comprehensive evaluation across multiple dimensions</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Behavioral Assessment</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                10 questions evaluating communication skills, work ethic, cultural fit, and learning ability.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Communication evaluation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Team collaboration assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>Problem-solving mindset</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Technical Evaluation</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                20 in-depth technical questions tailored to the candidate's technology stack and experience level.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Technology-specific questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Best practices assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                  <span>Real-world application</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Practical Scenarios</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                2 scenario-based questions testing system design thinking and practical problem-solving abilities.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                  <span>System architecture design</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                  <span>Debugging & troubleshooting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                  <span>Scalability considerations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interview Monitoring */}
        <div className="py-16">
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">Advanced Interview Monitoring</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Our platform ensures interview integrity through multiple monitoring features including time tracking, video recording, and paste prevention.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">2-Minute Timer Per Question</h4>
                      <p className="text-slate-600">Track response time with visual countdown alerts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Video Recording</h4>
                      <p className="text-slate-600">Camera access required for expression analysis</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Paste Prevention</h4>
                      <p className="text-slate-600">Typing-only mode ensures authentic responses</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">Current Phase</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Phase 1: Behavioral</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Time Remaining</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-lg font-mono font-bold">1:45</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">Camera Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                        Recording
                      </span>
                    </div>
                  </div>
                  <div className="text-center text-sm text-slate-600 mt-6">
                    <p>Live interview monitoring ensures fair evaluation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About WP Digitals */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">About WP Digitals</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              A creative digital agency focused on growing brands online through comprehensive web solutions
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">5+</div>
              <p className="text-slate-600">Years in Business</p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">100+</div>
              <p className="text-slate-600">Projects Delivered</p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <p className="text-slate-600">Support Available</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-slate-700 max-w-4xl mx-auto leading-relaxed">
              WP Digitals specializes in website design & development, digital marketing, SEO, and comprehensive web maintenance services. 
              We help businesses across industries build engaging, mobile-ready, and SEO-friendly digital experiences.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Begin your technical interview journey with WP Digitals today
            </p>
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-10 py-7 rounded-xl shadow-lg"
            >
              Start Your Interview
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <img src={LOGO_URL} alt="WP Digitals" className="h-8 mb-4 brightness-0 invert" />
              <p className="text-slate-400 text-sm">
                Creative digital agency focused on growing brands online through comprehensive web solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Our Services</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Website Design & Development</li>
                <li>Digital Marketing</li>
                <li>SEO Optimization</li>
                <li>Website Maintenance</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <p>Mumbai: Andheri (E), Maharashtra</p>
                <p>Odisha: Berhampur, Odisha</p>
                <p className="pt-2">Available 24/7 for support</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>&copy; 2024 WP Digitals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;