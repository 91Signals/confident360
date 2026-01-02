'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, BarChart3, AlertCircle, Award, FileText, Layout } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

function DetailContent() {
  const [caseStudy, setCaseStudy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const reportId = searchParams.get('report_id');
  const caseStudyParam = searchParams.get('case_study');
  const unlocked = searchParams.get('unlock') === '1';

  // Helper function to get score color based on percentage
  const getScoreColor = (score: number, maxScore: number = 100) => {
    const percentage = (score / maxScore) * 100;
    if (percentage < 40) {
      return {
        text: 'text-red-400',
        bg: 'bg-red-500',
        border: 'border-red-500/30',
        gradient: 'from-red-600 to-red-500'
      };
    } else if (percentage < 70) {
      return {
        text: 'text-yellow-400',
        bg: 'bg-yellow-500',
        border: 'border-yellow-500/30',
        gradient: 'from-yellow-600 to-yellow-500'
      };
    } else {
      return {
        text: 'text-green-400',
        bg: 'bg-green-500',
        border: 'border-green-500/30',
        gradient: 'from-green-600 to-green-500'
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = '/reports';
        if (reportId) {
          url += `?report_id=${reportId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const result = await response.json();

        const matchStudy = (list: any[], key: string | null) => {
          if (!Array.isArray(list)) return null;
          if (!key) return null;
          const byUrl = list.find((item: any) => item?.type === 'case_study' && item?.url === key);
          if (byUrl) return byUrl;
          const byIndex = list[Number(key)];
          return byIndex?.type === 'case_study' ? byIndex : null;
        };

        let study: any = null;
        if (Array.isArray(result)) {
          study = matchStudy(result, caseStudyParam);
        } else if (result && Array.isArray(result.case_studies)) {
          // result from /reports is an object { portfolio, case_studies }
          // case_studies are already normalized in backend
          study = result.case_studies.find((cs: any, idx: number) => cs?.url === caseStudyParam || String(idx) === caseStudyParam);
        }

        if (study) {
          const summaryText = [
            study.summary,
            study.overall_feedback,
            study.analysis?.summary,
            study.analysis?.overall_feedback,
            study.scraped_data?.summary,
          ].find((val) => typeof val === 'string' && val.trim().length > 0) || '';

          const uxKeywords = study.uxKeywords ?? study.ux_keywords ?? study.analysis?.ux_keywords ?? [];

          setCaseStudy({
            ...study,
            title: study.project_name || study.title || 'Case Study',
            overallScore: study.overallScore ?? study.overall_score ?? 0,
            phaseScores: study.phaseScores ?? study.phase_scores ?? [],
            uxKeywords,
            improvements: study.improvements ?? [],
            verdict: study.verdict ?? '',
            summary: summaryText,
          });
        } else {
          setError('Case study not found');
        }
      } catch (err) {
        console.error('Error fetching case study:', err);
        setError('Failed to load case study details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId, caseStudyParam]);

  const radarData = useMemo(() => {
    const phases = caseStudy?.phaseScores || [];
    if (!Array.isArray(phases) || phases.length === 0) return [];
    return phases.map((p: any) => ({
      phase: p.phase || p.name || 'Phase',
      score: Number(p.score) || 0,
    }));
  }, [caseStudy]);

  if (loading) {
    return null;
  }

  if (error || !caseStudy) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-xl border border-red-900/30 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-white mb-2">Case Study Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'Unable to load case study details.'}</p>
          <Link 
            href={`/results?report_id=${reportId}&unlock=1`}
            className="inline-flex items-center justify-center px-6 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/results?report_id=${reportId}&unlock=1`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-100">Case Study Analysis</span>
          </div>
          {caseStudy.url && (
            <a 
              href={caseStudy.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-white font-medium flex items-center space-x-2 transition-colors"
            >
              <span>View Original</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <main className="space-y-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 flex-wrap text-xs uppercase tracking-tight text-slate-400">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">Design Compass</span>
              {caseStudy.category && <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">{caseStudy.category}</span>}
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">{caseStudy.duration || 'Case Study'}</span>
            </div>
            <h1 className="text-3xl font-bold text-white">{caseStudy.title}</h1>
            <div className="flex flex-wrap gap-2">
              {caseStudy.uxKeywords?.map((kw: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-blue-950/40 border border-blue-900/40 rounded-full text-xs font-semibold text-blue-300">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Hero score */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center relative overflow-hidden shadow-xl shadow-slate-950/50">
            <div className="relative z-10">
              <h2 className="text-slate-500 font-semibold uppercase tracking-widest text-sm mb-6">Overall Quality Score</h2>
              <div className="flex items-baseline justify-center mb-8">
                <span className={`text-8xl font-bold tracking-tighter ${getScoreColor(caseStudy.overallScore).text}`}>{caseStudy.overallScore}</span>
                <span className="text-4xl font-medium text-slate-600 ml-2">/100</span>
              </div>
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden max-w-2xl mx-auto relative">
                <div 
                  className={`h-full bg-gradient-to-r ${getScoreColor(caseStudy.overallScore).gradient} relative z-10`}
                  style={{ width: `${caseStudy.overallScore}%` }}
                ></div>
              </div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-full bg-blue-500/5 blur-[100px] -z-0 pointer-events-none"></div>
          </section>

          {/* Competency + Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Competency Map
              </h3>
              <div className="h-64 flex items-center justify-center">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="80%">
                      <PolarGrid stroke="#1f2937" />
                      <PolarAngleAxis dataKey="phase" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
                      <Radar dataKey="score" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-500">No competency data available.</p>
                )}
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-400" />
                Executive Summary
              </h3>
              <p className="text-slate-300 leading-relaxed text-sm italic">
                {caseStudy.verdict || 'No verdict available.'}
              </p>
            </section>
          </div>

          {/* Phase Breakdown with subsections */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              Phase Breakdown
            </h3>
            <div className="space-y-4">
              {caseStudy.phaseScores?.length > 0 ? caseStudy.phaseScores.map((phase: any, idx: number) => {
                const maxScore = phase.max_score || 100;
                const scoreColor = getScoreColor(phase.score || 0, maxScore);
                return (
                <details key={idx} className="group bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <summary className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm text-slate-200 font-semibold">{phase.phase || phase.name || `Phase ${idx + 1}`}</p>
                      <p className="text-xs text-slate-500">Score <span className={scoreColor.text + ' font-semibold'}>{phase.score || 0}</span>{phase.max_score ? ` / ${phase.max_score}` : '/100'}</p>
                    </div>
                    <div className="flex items-center gap-3 w-36">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${scoreColor.gradient}`} style={{ width: `${((phase.score || 0) / maxScore) * 100}%` }}></div>
                      </div>
                      <span className={`text-sm font-bold ${scoreColor.text}`}>{phase.score || 0}</span>
                    </div>
                  </summary>
                  {phase.subsections?.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {phase.subsections.map((sub: any, sidx: number) => {
                        const subMaxScore = sub.max_score || 100;
                        const subScoreColor = getScoreColor(sub.score || 0, subMaxScore);
                        return (
                        <div key={sidx} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                          <div className="flex justify-between text-sm text-slate-200 font-semibold">
                            <span>{sub.name || `Subsection ${sidx + 1}`}</span>
                            <span className={subScoreColor.text}>{sub.score || 0}{sub.max_score ? ` / ${sub.max_score}` : ''}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sub.reasoning || 'No reasoning provided.'}</p>
                        </div>
                      )})}
                    </div>
                  )}
                </details>
              )}) : (
                <p className="text-sm text-slate-500">No phase scores available.</p>
              )}
            </div>
          </section>

          {caseStudy.improvements?.length > 0 && (
            <section className="bg-amber-950/10 border border-amber-900/30 rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-amber-500 mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2" />
                Priority Improvements
              </h3>
              <div className="space-y-6">
                {caseStudy.improvements.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-4 pb-6 border-b border-amber-900/20 last:border-0 last:pb-0">
                    <div className="mt-1">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {item.phase && (
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-900/40 px-2 py-0.5 rounded">
                            {item.phase}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-slate-200">{item.issue}</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        <span className="font-medium text-slate-300">Recommendation: </span>
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {caseStudy.verdict && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-center border border-slate-700 shadow-2xl">
              <div className="flex justify-center mb-4">
                <Award className="w-10 h-10 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Final Verdict</h3>
              <p className="text-slate-300 italic max-w-2xl mx-auto">
                "{caseStudy.verdict}"
              </p>
            </div>
          )}

          {caseStudy.screenshot && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Layout className="w-5 h-5 mr-2 text-indigo-400" />
                Project Screenshot
              </h3>
              <img 
                src={caseStudy.screenshot} 
                alt={caseStudy.title}
                className="w-full rounded-lg border border-slate-700"
              />
            </section>
          )}

          <div className="flex justify-center pt-8 pb-12">
            <Link 
              href={`/results?report_id=${reportId}&unlock=1`}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-all flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <DetailContent />
    </Suspense>
  );
}
