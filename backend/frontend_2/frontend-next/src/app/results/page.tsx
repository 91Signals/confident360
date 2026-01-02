'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, BarChart3, Briefcase, TrendingUp, AlertCircle, Folder, Zap, Lock, RefreshCcw, MousePointer2, Layout, PenTool, Search, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

function ResultsContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [jobRole, setJobRole] = useState<string>('');
  const [analysisStatus, setAnalysisStatus] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const searchParams = useSearchParams();
  const reportId = searchParams.get('report_id');
  const unlocked = searchParams.get('unlock') === '1';
  const analyzing = searchParams.get('analyzing') === 'true';

  useEffect(() => {
    if (analyzing) {
      setIsAnalyzing(true);
    }
  }, [analyzing]);

  // Poll for status and reports updates when analyzing
  useEffect(() => {
    if (!isAnalyzing || !reportId) return;

    const pollUpdates = async () => {
      try {
        // Poll status for metadata
        const statusRes = await fetch(`/api/status/${reportId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setAnalysisStatus(statusData);
          
          // Check if analysis is complete
          const status = statusData.status?.toLowerCase().trim();
          if (status === 'completed' || status === 'complete') {
            setIsAnalyzing(false);
            // Refresh data
            window.location.href = `/results?report_id=${reportId}`;
            return;
          }
        }

        // Poll reports for actual case study data
        const reportsRes = await fetch(`/reports?report_id=${reportId}`);
        if (reportsRes.ok) {
          const result = await reportsRes.json();
          
          // Transform case studies to ensure uxKeywords are mapped
          let transformedData = result;
          if (result.case_studies && Array.isArray(result.case_studies)) {
            transformedData.case_studies = result.case_studies.map((study: any) => ({
              ...study,
              overallScore: study.overall_score || study.overallScore || 0,
              phaseScores: study.phase_scores || study.phaseScores || [],
              uxKeywords: study.ux_keywords || study.uxKeywords || [],
              improvements: study.improvements || [],
              verdict: study.verdict || '',
              summary: study.summary || '',
            }));
          }
          
          setData(transformedData);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollUpdates, 2000);
    pollUpdates(); // Initial call

    return () => clearInterval(interval);
  }, [isAnalyzing, reportId]);

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
        
        // Transform case studies to ensure uxKeywords are mapped
        let transformedData = result;
        if (result.case_studies && Array.isArray(result.case_studies)) {
          transformedData.case_studies = result.case_studies.map((study: any) => ({
            ...study,
            // Map snake_case from backend to camelCase for component
            overallScore: study.overall_score || study.overallScore || 0,
            phaseScores: study.phase_scores || study.phaseScores || [],
            uxKeywords: study.ux_keywords || study.uxKeywords || [],
            improvements: study.improvements || [],
            verdict: study.verdict || '',
            summary: study.summary || '',
          }));
        }
        
        setData(transformedData);

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
    return null;
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
    { phase: 'Research', value: 0, count: 0 },
    { phase: 'Problem', value: 0, count: 0 },
    { phase: 'Ideation', value: 0, count: 0 },
    { phase: 'Visuals', value: 0, count: 0 },
    { phase: 'Validation', value: 0, count: 0 },
    { phase: 'Storytelling', value: 0, count: 0 },
  ];

  if (data.case_studies?.length > 0) {
    data.case_studies.forEach((cs: any) => {
      if (cs.phaseScores && Array.isArray(cs.phaseScores)) {
        cs.phaseScores.forEach((ps: any) => {
          const phaseName = (ps.phase || ps.name || '').toLowerCase();
          
          // Map backend phase names to radar chart categories
          let matchedIndex = -1;
          if (phaseName.includes('research') || phaseName.includes('user research')) {
            matchedIndex = 0;
          } else if (phaseName.includes('problem') || phaseName.includes('context') || phaseName.includes('definition')) {
            matchedIndex = 1;
          } else if (phaseName.includes('ideation') || phaseName.includes('design process')) {
            matchedIndex = 2;
          } else if (phaseName.includes('visual') || phaseName.includes('ui') || phaseName.includes('ux')) {
            matchedIndex = 3;
          } else if (phaseName.includes('validation') || phaseName.includes('iteration') || phaseName.includes('testing')) {
            matchedIndex = 4;
          } else if (phaseName.includes('storytelling') || phaseName.includes('copywriting')) {
            matchedIndex = 5;
          }
          
          if (matchedIndex !== -1) {
            const maxScore = ps.max_score || 100;
            const normalizedScore = (ps.score / maxScore) * 100;
            phaseData[matchedIndex].value += normalizedScore || 0;
            phaseData[matchedIndex].count += 1;
          }
        });
      }
    });
    
    // Average the scores
    phaseData.forEach(p => {
      if (p.count > 0) {
        p.value = Math.round(p.value / p.count);
      }
    });
  }

  // If no data was found, use mock data to ensure chart displays
  const hasRealData = phaseData.some(p => p.value > 0);
  if (!hasRealData) {
    // Mock data fallback
    phaseData[0].value = 60; // Research
    phaseData[1].value = 70; // Problem
    phaseData[2].value = 65; // Ideation
    phaseData[3].value = 75; // Visuals
    phaseData[4].value = 55; // Validation
    phaseData[5].value = 50; // Storytelling
  }

  console.log('Phase Data for Radar:', phaseData);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-8 ${!unlocked ? 'pb-28' : 'pb-12'}`}>
        <main className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-3">
                {userName}
                <a href={data.portfolio?.portfolio_link || '#'} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors p-1">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span>Applying for:</span>
                <span className="text-blue-400 font-semibold bg-blue-400/10 px-2.5 py-0.5 rounded text-xs uppercase">
                  {jobRole}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-bold text-white">{data.case_studies?.length || 0} <span className="text-slate-500 text-lg font-normal"></span></div>
              <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Case Studies</p>
            </div>
          </div>

          {/* Top Row: Portfolio Score + Job Role Fit */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-8">
            
            {/* Portfolio Score Card */}
            <div className={`xl:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden min-h-[320px] group`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              
              <div className={`flex flex-col md:flex-row items-center gap-8`}>
                <div className="flex-1 space-y-4">
                  <p className="text-slate-300 leading-relaxed">
                    Your portfolio shows a <strong className="text-white">{unlocked ? portfolioScore : 'XX'}% match</strong> for the <strong className="text-blue-400">{jobRole}</strong> role.
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
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${unlocked ? portfolioScore * 3.51 : 0} 351`} className="text-blue-500" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{unlocked ? portfolioScore : 'XX'}</div>
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
              
              <div>
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
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${unlocked ? (job.score >= 70 ? 'bg-emerald-900/20 text-emerald-400' : 'bg-amber-900/20 text-amber-400') : 'bg-emerald-900/20 text-emerald-400'}`}>
                            {unlocked ? `${job.score}%` : 'XX'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-300 mb-3">{job.role}</div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${unlocked ? job.score : 0}%` }}></div>
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
              <div className="flex items-center justify-center h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={phaseData}>
                    <PolarGrid stroke="#1e293b" strokeWidth={1} />
                    <PolarAngleAxis 
                      dataKey="phase" 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                      strokeWidth={0}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fill: '#475569', fontSize: 10 }}
                      strokeWidth={0}
                    />
                    <Radar 
                      name="Competency" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
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
            </div>

            <div className="space-y-6">
              {/* Show analyzed case studies */}
              {data.case_studies?.map((study: any, index: number) => (
                <div key={study.id || index} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="text-4xl font-mono font-bold text-slate-800">0{index + 1}</div>
                    
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-lg font-bold text-slate-100 mb-2">{study.project_name || `Project ${index + 1}`}</h3>
                      <div className="flex flex-wrap gap-2">
                        {study.uxKeywords && study.uxKeywords.length > 0 ? (
                          study.uxKeywords.map((keyword: string, idx: number) => (
                            <div
                              key={idx}
                              className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-950/40 border border-blue-900/40 text-blue-400"
                            >
                              {keyword}
                            </div>
                          ))
                        ) : (
                          <div className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-blue-950/40 border border-blue-900/40 text-blue-400">
                            {study.category || 'UX/UI'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-[120px]">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-emerald-400">{unlocked ? (study.overallScore || 0) : 'XX'}</span>
                        <span className="text-xs text-slate-600">/100</span>
                      </div>
                      <Link href={`/results/detail?report_id=${reportId}&case_study=${study.url || index}`} className={`text-[10px] font-bold uppercase px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 ${!unlocked ? 'hidden' : ''}`}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show loading placeholders for pending case studies */}
              {isAnalyzing && analysisStatus && (() => {
                const totalProjects = analysisStatus?.resultData?.projects_found || 0;
                const analyzedProjects = data.case_studies?.length || 0;
                const pendingCount = totalProjects - analyzedProjects;
                
                return Array.from({ length: pendingCount }).map((_, index) => {
                  const projectIndex = analyzedProjects + index;
                  const isCurrentlyAnalyzing = projectIndex === analyzedProjects;
                  
                  return (
                    <div key={`loading-${index}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                      {isCurrentlyAnalyzing && (
                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                      )}
                      <div className="flex flex-col md:flex-row gap-6 items-center relative">
                        <div className="text-4xl font-mono font-bold text-slate-800">0{projectIndex + 1}</div>
                        
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-3 mb-4">
                            {isCurrentlyAnalyzing ? (
                              <>
                                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                <h3 className="text-lg font-bold text-slate-400">Analyzing case study...</h3>
                              </>
                            ) : (
                              <h3 className="text-lg font-bold text-slate-600">Waiting for analysis...</h3>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            {unlocked && (
              <>
                {/* Industry Projects Banner */}
                <div className="mt-10 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/80 p-5 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <MousePointer2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-semibold">Looking for more industry relevant projects?</p>
                        <p className="text-slate-400 text-sm">Boost your hiring potential with real‑world briefs and mentorship.</p>
                      </div>
                    </div>
                    <Link href={`/analyze-profile?report_id=${reportId ?? ''}&unlock=${unlocked ? '1' : '0'}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors">
                      View Projects
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Recommended Next Steps */}
                <div className="mt-8">
                  <div className="flex items-center gap-2 text-[11px] tracking-widest font-bold text-slate-500 mb-4">
                    <span className="text-blue-500">→</span> RECOMMENDED NEXT STEPS
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Personal Brand SEO */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <Search className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-slate-200 font-semibold mb-3">Personal Brand SEO</h3>
                      <div className="text-xs text-slate-300/90 bg-slate-800/60 border border-slate-700/60 px-3 py-2 rounded-lg mb-3">
                        <span className="font-bold text-slate-200">Fact:</span>
                        <span className="ml-2 text-slate-400">70% of recruiters won't even discover you if your keywords don't match their search filters.</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">Analyze & optimize your LinkedIn profile keywords to align with your portfolio strengths.</p>
                      <Link href={`/analyze-profile?report_id=${reportId ?? ''}&unlock=${unlocked ? '1' : '0'}`} className="inline-flex items-center gap-2 text-blue-400 font-semibold hover:text-blue-300 text-sm">
                        ANALYZE PROFILE <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Card 2: Portfolio Walkthrough */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                        <Layout className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-slate-200 font-semibold mb-3">Portfolio Walkthrough</h3>
                      <div className="text-xs text-slate-300/90 bg-slate-800/60 border border-slate-700/60 px-3 py-2 rounded-lg mb-3">
                        <span className="font-bold text-slate-200">Insight:</span>
                        <span className="ml-2 text-slate-400">Storytelling gaps are the #1 reason qualified designers fail final round interviews.</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">Practice presenting your case studies with AI‑driven questions tailored to your role.</p>
                      <Link href={`/start-practice?report_id=${reportId ?? ''}&unlock=${unlocked ? '1' : '0'}`} className="inline-flex items-center gap-2 text-purple-400 font-semibold hover:text-purple-300 text-sm">
                        START PRACTICE <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Card 3: Expert Review */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                        <Briefcase className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-slate-200 font-semibold mb-3">Expert Review</h3>
                      <div className="text-xs text-slate-300/90 bg-slate-800/60 border border-slate-700/60 px-3 py-2 rounded-lg mb-3">
                        <span className="font-bold text-slate-200">Stat:</span>
                        <span className="ml-2 text-slate-400">Candidates who receive senior mentorship land offers 2x faster on average.</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">Book a 30‑minute deep dive session with a Senior Product Designer for personalized feedback.</p>
                      <Link href={`/book-session?report_id=${reportId ?? ''}&unlock=${unlocked ? '1' : '0'}`} className="inline-flex items-center gap-2 text-emerald-400 font-semibold hover:text-emerald-300 text-sm">
                        BOOK SESSION <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {!unlocked && (
              <Link href={`/pay?report_id=${reportId ?? ''}`}
                className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-8 py-4 rounded-full bg-slate-950 border-2 border-blue-500 text-white font-semibold hover:border-blue-400 hover:bg-slate-900 transition-all shadow-2xl">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Unlock Full Report - ₹999</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
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
