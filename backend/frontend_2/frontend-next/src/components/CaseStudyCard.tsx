import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CaseStudyProps {
  data: any;
}

export default function CaseStudyCard({ data }: CaseStudyProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    return 'text-red-400 border-red-500/50 bg-red-500/10';
  };

  const getScreenshotUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const filename = path.split('/').pop();
    return `/reports/screenshots/${filename}`;
  };

  const screenshotUrl = getScreenshotUrl(data.screenshot);

  return (
    <div className="bg-[#111] rounded-xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
      <div 
        className="p-6 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-6 flex-1">
          <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${getScoreColor(data.overallScore)}`}>
            <span className="text-xl font-bold">{data.overallScore}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{data.title || "Untitled Project"}</h3>
            <a 
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-indigo-400 flex items-center mt-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {data.url} <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.verdict === 'Strong' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            data.verdict === 'Good' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}>
            {data.verdict || "Analyzed"}
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#0a0a0a]"
          >
            <div className="p-8 space-y-8">
              {/* Screenshot */}
              {screenshotUrl ? (
                <div className="mb-6">
                   <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group max-w-2xl mx-auto bg-[#111]">
                      <img src={screenshotUrl} alt="Project Screenshot" className="object-cover w-full h-full" />
                   </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 border border-dashed border-white/10 rounded-lg bg-[#111]">
                  <div className="text-center text-gray-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No screenshot available</p>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="prose prose-invert max-w-none">
                <h4 className="text-lg font-semibold text-white mb-2">Summary</h4>
                <p className="text-gray-400 leading-relaxed">{data.summary}</p>
              </div>

              {/* Phase Scores */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Detailed Analysis</h4>
                <div className="grid gap-4">
                  {data.phaseScores?.map((phase: any, i: number) => (
                    <div key={i} className="bg-[#111] p-5 rounded-xl border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-200">{phase.phase}</span>
                        <span className="text-sm font-bold text-indigo-400">
                          {phase.score} / {phase.max_score}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 mb-4">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(phase.score / phase.max_score) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{phase.reasoning}</p>
                      
                      {/* Subsections */}
                      {phase.subsections && (
                        <div className="mt-4 pt-4 border-t border-white/5 grid gap-2">
                          {phase.subsections.map((sub: any, j: number) => (
                            <div key={j} className="flex items-start gap-2 text-sm">
                              {sub.score === sub.max_score ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                              )}
                              <span className="text-gray-500">{sub.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements */}
              {data.improvements?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Improvements</h4>
                  <ul className="space-y-3">
                    {data.improvements.map((imp: any, i: number) => (
                      <li key={i} className="flex items-start space-x-3 bg-[#111] p-4 rounded-lg border border-orange-500/20">
                        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-200 block mb-1">{imp.issue}</span>
                          <span className="text-sm text-gray-400">{imp.recommendation}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* UX Keywords */}
              {data.ux_keywords?.length > 0 && (
                <div>
                    <h4 className="text-lg font-semibold text-white mb-4">UX Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.ux_keywords.map((keyword: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-white/5 text-gray-300 border border-white/10 rounded-full text-sm">
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}