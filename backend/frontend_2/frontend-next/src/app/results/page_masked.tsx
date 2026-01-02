'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingState from '@/components/LoadingState';
import { ArrowLeft, ExternalLink, BarChart3, Briefcase, TrendingUp, AlertCircle, Folder, Zap, Lock, RefreshCcw, MousePointer2, Layout, PenTool, Search } from 'lucide-react';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

function ResultsContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Alex Morgan');
  const [jobRole, setJobRole] = useState<string>('Product Designer');
  const searchParams = useSearchParams();
  const reportId = searchParams.get('report_id');
  const unlocked = searchParams.get('unlock') === '1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = '/reports';
        if (reportId) {
          url += `?report_id=${reportId}`;
        }

        // Use relative URL - Firebase Hosting will rewrite to Cloud Run
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const result = await response.json();
        
        // Transform list to object if it's an array
        if (Array.isArray(result)) {
          const portfolio = result.find((item: any) => item.type === 'portfolio');
          const case_studies = result.filter((item: any) => item.type === 'case_study').map((study: any) => ({
            ...study,
            // Map snake_case from backend to camelCase for component
            overallScore: study.overall_score || 0,
            phaseScores: study.phase_scores || [],
            uxKeywords: study.ux_keywords || [],
            improvements: study.improvements || [],
            verdict: study.verdict || '',
            summary: study.summary || '',
          }));
          setData({ portfolio, case_studies });
        } else {
          setData(result);
        }

        // Fetch user profile and job role from analysis status
        if (reportId) {
          try {
            const statusRes = await fetch(`/api/status/${reportId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.resultData?.userName) {
                setUserName(statusData.resultData.userName);
              }
              if (statusData.resultData?.jobRole) {
                setJobRole(statusData.resultData.jobRole);
              }
            }
          } catch (err) {
            console.error('Failed to fetch user profile:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load analysis results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-xl shadow-sm border border-red-900/30 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data || (!data.portfolio && (!data.case_studies || data.case_studies.length === 0))) {
     return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">No Results Found</h2>
            <p className="text-gray-400 mb-4">We couldn't find any analysis reports for this session.</p>
            <Link href="/" className="text-blue-400 hover:underline">Go back and start an analysis</Link>
        </div>
      </div>
     )
  }

  // Calculate portfolio score from case studies if not available
  const portfolioScore = data.portfolio?.overall_score || 
    (data.case_studies?.length > 0 
      ? Math.round(data.case_studies.reduce((sum: number, cs: any) => sum + (cs.overallScore || 0), 0) / data.case_studies.length)
      : 0);
  
  // Aggregate improvements from case studies
  const allImprovements = data.case_studies?.flatMap((cs: any) => cs.improvements || []).slice(0, 3) || [];

  // Extract unique keywords from all case studies
  const allKeywords = Array.from(new Set(
    data.case_studies?.flatMap((cs: any) => cs.uxKeywords || []) || []
  )).slice(0, 5);

  // Calculate average phase scores for radar chart
  const phaseData = [
    { phase: 'Problem Definition', value: 0 },
    { phase: 'Research', value: 0 },
    { phase: 'Ideation', value: 0 },
    { phase: 'Prototyping', value: 0 },
    { phase: 'Testing', value: 0 },
    { phase: 'Final UI', value: 0 },
  ];

  if (data.case_studies?.length > 0) {
    data.case_studies.forEach((cs: any) => {
      if (cs.phaseScores && Array.isArray(cs.phaseScores)) {
        cs.phaseScores.forEach((ps: any) => {
          const phaseIndex = phaseData.findIndex(p => p.phase.toLowerCase().includes(ps.phase?.toLowerCase() || ''));
          if (phaseIndex !== -1) {
            phaseData[phaseIndex].value += ps.score || 0;
          }
        });
      }
    });
    // Average the scores
    phaseData.forEach(p => {
      p.value = Math.round(p.value / data.case_studies.length);
    });
  }

  // Mock job fit data based on portfolio score
  const jobFits = [
    { role: 'Product Designer', score: portfolioScore, icon: MousePointer2 },
    { role: 'UX/UI Generalist', score: Math.max(50, portfolioScore - 10), icon: Layout },
    { role: 'Visual Designer', score: Math.max(40, portfolioScore - 15), icon: PenTool },
    { role: 'UX Researcher', score: Math.max(45, portfolioScore - 20), icon: Search },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {unlocked && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-200 px-6 py-3 text-center text-sm">
          ✓ Full report unlocked. Enjoy your detailed analysis!
        </div>
      )}
      
      <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-100">UX Analyzer</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="text-sm text-blue-400 hover:text-white font-medium flex items-center space-x-2 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>New Analysis</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <main className="w-full">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                {userName}
                <a href={data.portfolio?.portfolio_link || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors p-1">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Applying for:</span>
                <span className="text-blue-400 font-semibold bg-blue-400/10 px-2.5 py-0.5 rounded text-xs uppercase">
                  {jobRole}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{data.case_studies?.length || 0} <span className="text-slate-500 text-lg font-normal"></span></div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Case Studies</p>
            </div>
          </div>

          {/* Top Row: Portfolio Score + Job Role Fit */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-8">
            
            {/* Portfolio Score Card */}
            <div className={`xl:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden min-h-[320px] group`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              {!unlocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                  <Lock className="w-10 h-10 text-slate-400 mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Summary masked</h3>
                  <p className="text-slate-300 mb-4 text-center px-6">Unlock to view detailed portfolio summary.</p>
                  <Link href={`/pay?report_id=${reportId ?? ''}`}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg">
                    Unlock full report
                  </Link>
                </div>
              )}
              
              <div className={`flex flex-col md:flex-row items-center gap-8 ${!unlocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
                <div className="flex-1 space-y-4">
                  <p className="text-slate-300 leading-relaxed">
                    Your portfolio shows a <strong className="text-white">90% match</strong> for the <strong className="text-blue-400">{jobRole}</strong> role.
                    You demonstrate strong capability in <span className="text-blue-200">Problem Definition</span> and <span className="text-blue-200">Final UI Polish</span>.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="px-4 py-1.5 bg-blue-950/40 border border-blue-800/60 rounded-full text-xs font-semibold text-blue-300">Strong Process</div>
                    <div className="px-4 py-1.5 bg-purple-950/40 border border-purple-800/60 rounded-full text-xs font-semibold text-purple-300">Clean Visuals</div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4">Portfolio Score</div>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-800" />
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${portfolioScore * 3.51} 351`} className="text-blue-500" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{portfolioScore}</div>
                        <div className="text-xs text-slate-500">/100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Role Fit Card */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[320px] relative">
              {!unlocked && (
                <div className="absolute inset-0 z-10 backdrop-blur-[1px]"></div>
              )}
              
              <div className={`${!unlocked ? 'blur-sm pointer-events-none select-none' : ''}`}>
                <div className="flex items-center space-x-2 mb-6">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Job role fit</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {jobFits.map((job, idx) => {
                    const Icon = job.icon;
                    return (
                      <div key={idx} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <Icon className="w-5 h-5 text-slate-500" />
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${job.score >= 70 ? 'bg-emerald-900/20 text-emerald-400' : 'bg-amber-900/20 text-amber-400'}`}>
                            {job.score}%
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-300 mb-3">{job.role}</div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${job.score}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Competence Map & Priority Improvements */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            
            <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[350px] ${!unlocked ? 'opacity-50 blur-sm pointer-events-none select-none' : ''}`}>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Overall Competence Map</h3>
              </div>
              <div className="flex items-center justify-center h-64 text-slate-600">
                Radar Chart Placeholder
              </div>
            </div>

            <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 ${!unlocked ? 'opacity-50 blur-sm pointer-events-none select-none' : ''}`}>
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Priority Improvements</h3>
              </div>
              <div className="space-y-4">
                {allImprovements.length > 0 ? allImprovements.map((imp: any, i: number) => (
                  <div key={i} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-slate-800/30">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-200 mb-1">{imp.issue || imp.phase || `Improvement ${i + 1}`}</div>
                      <div className="text-xs text-slate-400">{imp.recommendation?.substring(0, 100) || 'No details available'}...</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-slate-500 text-center py-4">No improvements identified yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Case Study Analysis */}
          <section className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Folder className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-200">Case Study Analysis</h2>
              </div>
              {!unlocked && (
                <Link href={`/pay?report_id=${reportId ?? ''}`}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm">
                  Unlock full report
                </Link>
              )}
            </div>

            <div className={`space-y-6 ${!unlocked ? 'blur-[2px] pointer-events-none select-none' : ''}`}>
              {data.case_studies?.map((study: any, index: number) => (
                <div key={study.id || index} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="text-4xl font-mono font-bold text-slate-800">0{index + 1}</div>
                    
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-lg font-bold text-slate-100 mb-2">{study.project_name || `Project ${index + 1}`}</h3>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-2 py-1 bg-blue-950/40 border border-blue-900/40 rounded text-[10px] font-bold text-blue-400 uppercase">
                          {study.category || 'UX/UI'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[120px]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-emerald-400">{study.overallScore || 0}</span>
                        <span className="text-xs text-slate-600">/100</span>
                      </div>
                      <Link href={`/results/detail?report_id=${reportId}&case_study=${study.url || index}`} className="text-[10px] font-bold uppercase px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {!unlocked && (
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400 mb-4">Scores and detailed analysis are masked.</p>
                <Link href={`/pay?report_id=${reportId ?? ''}`}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium hover:from-indigo-600 hover:to-blue-600 transition-all shadow-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Unlock Full Report - ₹999
                </Link>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
