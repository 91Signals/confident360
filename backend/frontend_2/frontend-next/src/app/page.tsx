'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ArrowRight, CheckCircle2, Loader2, FileText, ChevronDown, Play, Brain, Briefcase, Target, Mic, Code2, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import EditableProfileModal from '@/components/EditableProfileModal';
import NavBar from '@/components/NavBar';

export default function Home() {
  const hasSubmittedRef = useRef(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState<{ projectsFound?: number, projectsAnalyzed?: number, message?: string }>({});
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [showOpenResults, setShowOpenResults] = useState(false);
  const [designerCount, setDesignerCount] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [extractedResumeData, setExtractedResumeData] = useState<any>(null);
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState('Not selected');

  useEffect(() => {
    // Animate designer count
    const target = 12847;
    const duration = 2000;
    const interval = 20;
    const steps = duration / interval;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDesignerCount(Math.floor(current));
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Handle pending form submission after login
  const resumeHandledRef = useRef(false);

  useEffect(() => {
    if (user && pendingFormData && !resumeHandledRef.current) {
      resumeHandledRef.current = true;
      extractResumeData(pendingFormData);
      setPendingFormData(null);
    }
  }, [user, pendingFormData]);


  async function extractResumeData(formData: FormData) {
    setIsExtractingResume(true);
    const url = formData.get('portfolioUrl') as string;
    const file = formData.get('resume') as File;

    setPortfolioUrl(url);
    setResumeFile(file); // Store the file for later use

    try {
      const response = await fetch('/api/extract-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract resume data');
      }

      const result = await response.json();
      setExtractedResumeData(result.data);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error('Resume extraction error:', error);
      alert('Failed to extract resume data. Please continue.');
    }
    finally {
      setIsExtractingResume(false);
    }
  }

  async function handleProfileConfirm(profileData: any) {
    // Save profile to database
    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userId: user?.uid || '',
          portfolioUrl: portfolioUrl,
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          linkedinUrl: profileData.linkedin_url || '',
        }),
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }

    // Close modal and proceed with analysis
    setIsProfileModalOpen(false);

    // Recreate formData for analysis with the stored resume file
    const formData = new FormData();
    formData.append('portfolioUrl', portfolioUrl);
    formData.append('userName', profileData.name || 'User');
    formData.append('jobRole', selectedRole);

    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    if (user?.uid) {
      formData.append('userId', user.uid);
    }

    await submitAnalysis(formData);
  }

  async function submitAnalysis(formData: FormData) {
    if (hasSubmittedRef.current) {
      console.warn('Duplicate submit prevented');
      return;
    }

    hasSubmittedRef.current = true;

    if (user?.uid) {
      formData.append('userId', user.uid);
    }

    setIsLoading(true);

    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const result = await res.json();
      setCurrentReportId(result.report_id);

      await pollAnalysisStatus(result.report_id);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      hasSubmittedRef.current = false; // allow retry
    }
  }


  async function pollAnalysisStatus(reportId: string) {
    const maxAttempts = 900; // 15 minutes max for large portfolios
    let attempts = 0;
    const startTime = Date.now();
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes in milliseconds

    const poll = async () => {
      try {
        // Check if we've been waiting too long (10 minutes)
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > maxWaitTime) {
          console.warn(`⏰ 10 minutes elapsed. Force redirecting to results...`);
          alert('Analysis complete! Redirecting to results...');
          router.push(`/results?report_id=${reportId}`);
          return;
        }

        const statusRes = await fetch(`/api/status/${reportId}`);

        if (!statusRes.ok) {
          console.error(`Status endpoint returned ${statusRes.status}`);
          throw new Error('Failed to fetch status');
        }

        const statusData = await statusRes.json();
        console.log(`[Poll ${attempts}] Status:`, statusData.status, 'Progress:', statusData.progress, 'Message:', statusData.message);

        // Capture loading meta for UI
        setLoadingMeta({
          projectsFound: statusData?.resultData?.projects_found,
          projectsAnalyzed: statusData?.resultData?.projects_analyzed,
          message: statusData?.message,
        });

        // Check if projects are found - redirect to masked results immediately
        const projectsFound = statusData?.resultData?.projects_found || 0;
        if (projectsFound > 0 && attempts > 0) {
          console.log(`✅ Found ${projectsFound} projects! Redirecting to results in 5 seconds...`);
          // Add 5 second delay before redirecting
          setTimeout(() => {
            router.push(`/results?report_id=${reportId}&analyzing=true`);
          }, 5000);
          return;
        }

        // Check for completion - handle both "completed" and "complete" strings
        const status = statusData.status?.toLowerCase().trim();
        if (status === 'completed' || status === 'complete') {
          console.log('✅ Analysis completed! Redirecting to results...');
          router.push(`/results?report_id=${reportId}`);
          return;
        } else if (status === 'failed') {
          // Failed
          alert(`Analysis failed: ${statusData.message}`);
          setIsLoading(false);
          return;
        }

        // Fast-path: if progress is high or projects analyzed are present, try fetching reports
        const shouldTryReports = (statusData.progress ?? 0) >= 95 || (statusData?.resultData?.projects_analyzed ?? 0) > 0;
        if (shouldTryReports) {
          try {
            const reportsRes = await fetch(`/reports?report_id=${reportId}`);
            if (reportsRes.ok) {
              const reportsData = await reportsRes.json();
              const hasPortfolio = Array.isArray(reportsData)
                ? reportsData.some((item: any) => item?.type === 'portfolio')
                : !!reportsData?.portfolio;
              const hasCaseStudies = Array.isArray(reportsData)
                ? reportsData.some((item: any) => item?.type === 'case_study')
                : (reportsData?.case_studies?.length ?? 0) > 0;
              if (hasPortfolio || hasCaseStudies) {
                console.log('✅ Reports are ready. Redirecting to results immediately.');
                router.push(`/results?report_id=${reportId}`);
                return;
              }
            }
          } catch (e) {
            console.warn('Reports fetch attempt failed, will continue polling.', e);
          }
        }

        // Still processing - continue polling
        attempts++;
        if (attempts < maxAttempts) {
          // Show helpful message when taking longer
          if (attempts === 180) { // 3 minutes
            setLoadingMeta(prev => ({ ...prev, message: 'Large portfolio detected. This may take 5-10 minutes...' }));
          }

          // After 2 minutes, check every 1.5s; after 5 minutes, every 2s
          if (attempts === 10) setShowOpenResults(true); // show after ~10s
          const pollInterval = elapsedTime > 5 * 60 * 1000 ? 2000 : (elapsedTime > 2 * 60 * 1000 ? 1500 : 1000);
          setTimeout(poll, pollInterval);
        } else {
          // Timeout reached - show error and redirect
          console.warn('Polling timeout reached. Redirecting to results...');
          alert('Analysis is taking longer than expected. Redirecting to check results...');
          router.push(`/results?report_id=${reportId}`);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Retry with longer interval on error
        } else {
          // Final fallback: redirect to results
          console.warn('Polling failed completely. Redirecting to results as fallback...');
          router.push(`/results?report_id=${reportId}`);
          setIsLoading(false);
        }
      }
    };

    // Start polling
    poll();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!user) {
      setPendingFormData(formData);
      setIsAuthModalOpen(true);
      return;
    }

    await submitAnalysis(formData);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30">
      {/* Background layers */}
      <div className="fixed inset-0 grid-background"></div>
      <div className="fixed inset-0 radial-glow"></div>

      {/* Content */}
      <div className="relative z-10">
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <EditableProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setExtractedResumeData(null);
          }}
          onConfirm={handleProfileConfirm}
          resumeData={extractedResumeData}
          portfolioUrl={portfolioUrl}
          isLoading={isExtractingResume}
        />

        {/* Navigation Bar */}
        <NavBar
          user={user}
          onLoginClick={() => setIsAuthModalOpen(true)}
          onLogout={logout}
        />

        <AnimatePresence mode="wait">
          {!isLoading ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto px-6 py-16"
            >
              {/* Hero Section */}
              <div className="text-center mb-16">
                {/* Badge */}
                {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8">
                  <span className="text-xs font-medium text-gray-300">Powered by Gemini 2.5</span>
                </div> */}

                {/* Hero Title */}
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                  Is your design portfolio{' '}
                  <span className="bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
                    job ready?
                  </span>
                </h1>

                {/* Subtext */}
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Get instant, AI-driven feedback to score your process, uncover gaps, and elevate your storytelling.
                </p>
              </div>

              {/* Input Card Section */}
              <div className="bg-[#111]/80 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-[0_0_20px_rgba(0,0,0,0.4)] gradient-border-top">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Upload Box */}
                  <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                    <div className="space-y-4">
                      {/* Portfolio URL Input */}
                      <div>
                        <textarea
                          name="portfolioUrl"
                          placeholder="Upload Resume / Paste your portfolio link…"
                          rows={3}
                          required
                          className="w-full bg-transparent text-white placeholder:text-gray-500 focus:outline-none resize-none text-base"
                        />
                      </div>

                      {/* Upload Resume Button with PDF Icon */}
                      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <label
                          htmlFor="resume"
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">Upload Resume</span>
                        </label>
                        <input
                          type="file"
                          name="resume"
                          id="resume"
                          accept="application/pdf"
                          required
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setResumeFile(file);
                            }
                          }}
                        />
                        {resumeFile && (
                          <div className="flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{resumeFile.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job Role Selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      What job role are you applying ?
                    </label>
                    <div className="relative">
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      > <option value="Not selected">Select</option>
                        <option value="Product Designer">Product Designer</option>
                        <option value="UX Designer">UX Designer</option>
                        <option value="UI Designer">UI Designer</option>
                        <option value="UX Researcher">UX Researcher</option>
                        <option value="Interaction Designer">Interaction Designer</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Analyse Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/30"
                  >
                    Analyse Portfolio
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* How it works */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                      <Play className="w-3 h-3 ml-0.5" />
                    </div>
                    <span>See how it works</span>
                  </div>
                </form>
              </div>

              {/* Feature cards below 'See how it works' */}
              <section className="mt-12 md:mt-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                  {/* Card 1 */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 md:p-7 hover:border-white/20 transition-colors">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight mb-2">Expert-Trained AI</h3>
                    <p className="text-sm leading-relaxed text-gray-400">Trained on top portfolios from FAANG designers.</p>
                  </div>

                  {/* Card 2 */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 md:p-7 hover:border-white/20 transition-colors">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                      <Briefcase className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight mb-2">Hiring Manager View</h3>
                    <p className="text-sm leading-relaxed text-gray-400">Get the perspective of Fortune 500 recruiters.</p>
                  </div>

                  {/* Card 3 */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 md:p-7 hover:border-white/20 transition-colors">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight mb-2">Actionable Insights</h3>
                    <p className="text-sm leading-relaxed text-gray-400">Specific feedback to improve your storytelling.</p>
                  </div>
                </div>
              </section>

              {/* Everything you need section */}
              <section className="mt-20 md:mt-28">
                <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
                  <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                    Everything you need to boost
                    <br />
                    <span className="bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">your design career</span>
                  </h2>
                  <p className="text-gray-400 mt-4 md:mt-5 text-sm md:text-base">
                    From AI‑powered portfolio critiques and real‑time mock interviews to LinkedIn
                    SEO scoring—unlock the comprehensive toolkit built to get you hired faster.
                  </p>
                </div>

                {/* Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-6">
                  {/* Elite Data Training (large) */}
                  <div className="md:col-span-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Elite Data Training</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Our model is fine‑tuned on thousands of successful portfolios from top tech companies.</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 mb-3">
                        <span>DATA</span><span>TRAINING</span><span>VALIDATION</span><span>TESTING</span><span>DEPLOY</span><span>REVIEW</span><span>SUCCESS</span>
                      </div>
                      <div className="inline-flex items-center gap-2 text-[10px] md:text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                        FAANG Portfolios
                      </div>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] md:text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                        Design Systems
                      </div>
                      <div className="mt-6 text-xs text-sky-400 flex items-center gap-1">⚑ Hired!</div>
                    </div>
                  </div>

                  {/* Voice Mock Interviews */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 md:col-span-2">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Mic className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Voice Mock Interviews</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Practice behavioral and technical questions with our voice agent.</p>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20 p-10 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent" />
                      <div className="w-28 h-28 rounded-full border-2 border-purple-500/30 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-purple-500/30" />
                      </div>
                    </div>
                    <button className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors">Try Live Demo</button>
                  </div>

                  {/* LinkedIn SEO Scoring */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 md:col-span-2">
                      <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">LinkedIn SEO Scoring</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Ensure recruiters find you. We analyze your keywords against job descriptions.</p>
                      </div>
                    </div>
                      <pre className="rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[11px] text-gray-200 leading-relaxed whitespace-pre-wrap">
  {`<meta name="keywords"
    content="Product Design, Figma, UX Research" />

  // Analysis Result
  const matchScore = 98;
  if (matchScore > 90) {
    recruiters.notify("Top Candidate");
  }`}
                      </pre>
                  </div>

                  {/* Hiring Personas */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 md:col-span-2">
                      <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Hiring Personas</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Switch between Recruiter, Design Manager, and Peer Review modes.</p>
                      </div>
                    </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                        <div className="mx-auto w-full md:w-64 h-28 rounded-xl bg-white/5 border border-white/10 shadow-lg shadow-black/50 flex items-center justify-center text-slate-200 text-sm text-center px-4">Sarah Jenkins — Senior Recruiter @ TechCo</div>
                      </div>
                  </div>

                  {/* Instant Critique */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-6 md:col-span-2">
                      <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Instant Critique</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Real‑time actionable feedback on your case studies.</p>
                      </div>
                    </div>
                      <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-3">
                        <div className="text-sm text-slate-200">“Can you review my problem statement?”</div>
                        <div className="text-sm text-slate-100 bg-white/5 border border-white/10 rounded-lg p-3 leading-relaxed">It’s a bit vague. Try adding specific metrics. How much did user retention increase?</div>
                      </div>
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-screen w-full px-6"
            >
              {/* Mockup Browser Window */}
              <div className="w-full max-w-2xl mb-12">
                <div className="bg-gray-800 rounded-t-xl flex items-center gap-2 px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>

                <div className="bg-slate-950 border-l border-r border-b border-gray-700 rounded-b-xl p-12">
                  {/* Content area with placeholder bars */}
                  <div className="space-y-6 mb-12">
                    <div className="h-6 bg-slate-800 rounded-lg w-1/3"></div>
                    <div className="h-12 bg-slate-800 rounded-lg w-4/5"></div>
                    <div className="h-10 bg-slate-800 rounded-lg w-2/3"></div>
                    <div className="h-6 bg-slate-800 rounded-lg w-full"></div>
                  </div>

                  {/* Cards with progress indicators - Show project count */}
                  {loadingMeta?.projectsFound ? (
                    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(loadingMeta.projectsFound, 6)}, minmax(0, 1fr))` }}>
                      {Array.from({ length: loadingMeta.projectsFound }).map((_, index) => (
                        <div key={index} className="border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center min-h-32 bg-slate-900/50 hover:border-emerald-500/50 transition-colors">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          <span className="text-sm text-slate-400 mt-2">Project {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {/* Card 1 - Portfolio Analysis */}
                      <div className="border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-48 bg-slate-900/50">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
                        />
                      </div>

                      {/* Card 2 - Case Studies Identification */}
                      <div className="border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-48 bg-slate-900/50">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
                        />
                      </div>

                      {/* Card 3 - Analysis Complete */}
                      <div className="border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-48 bg-slate-900/50">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Message */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {!loadingMeta?.projectsFound || loadingMeta.projectsFound === 0
                    ? 'Analyzing site structure...'
                    : `${loadingMeta.projectsFound} Projects Found!`}
                </h2>
                {/* <p className="text-gray-400 text-lg">
                  AI is mapping your design journey
                </p> */}
                {showOpenResults && currentReportId && (
                  <div className="mt-6">
                    <button
                      onClick={() => router.push(`/results?report_id=${currentReportId}`)}
                      className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg"
                    >
                      Open results now
                    </button>
                    <p className="text-xs text-slate-500 mt-2">Had enough waiting? You can view the report directly.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
