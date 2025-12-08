import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface CaseStudyProps {
  data: any;
}

export default function CaseStudyCard({ data }: CaseStudyProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScreenshotUrl = (path: string) => {
    if (!path) return null;
    const filename = path.split('/').pop();
    return `/reports/screenshots/${filename}`;
  };

  const screenshotUrl = getScreenshotUrl(data.screenshot);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div 
        className="p-6 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-6 flex-1">
          <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${getScoreColor(data.overallScore)}`}>
            <span className="text-xl font-bold">{data.overallScore}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{data.title || "Untitled Project"}</h3>
            <a 
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-blue-600 flex items-center mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {data.url} <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.verdict === 'Strong' ? 'bg-green-100 text-green-800' :
            data.verdict === 'Good' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {data.verdict || "Analyzed"}
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-8 space-y-8">
          {/* Screenshot */}
          {screenshotUrl && (
            <div className="mb-6">
               <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group max-w-2xl mx-auto bg-gray-100">
                  <img src={screenshotUrl} alt="Project Screenshot" className="object-cover w-full h-full" />
               </div>
            </div>
          )}

          {/* Summary */}
          <div className="prose max-w-none">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Summary</h4>
            <p className="text-gray-600">{data.summary}</p>
          </div>

          {/* Phase Scores */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Detailed Analysis</h4>
            <div className="grid gap-4">
              {data.phaseScores?.map((phase: any, i: number) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{phase.phase}</span>
                    <span className="text-sm font-bold text-gray-600">
                      {phase.score} / {phase.max_score}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(phase.score / phase.max_score) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{phase.reasoning}</p>
                  
                  {/* Subsections */}
                  {phase.subsections && (
                    <div className="mt-3 pt-3 border-t border-gray-100 grid gap-2">
                      {phase.subsections.map((sub: any, j: number) => (
                        <div key={j} className="flex justify-between text-xs">
                          <span className="text-gray-500">{sub.name}</span>
                          <span className="font-medium text-gray-700">{sub.score}/{sub.max_score}</span>
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
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Improvements</h4>
              <ul className="space-y-3">
                {data.improvements.map((imp: any, i: number) => (
                  <li key={i} className="flex items-start space-x-3 bg-white p-4 rounded-lg border border-orange-100">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-900 block mb-1">{imp.issue}</span>
                      <span className="text-sm text-gray-600">{imp.recommendation}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* UX Keywords */}
          {data.ux_keywords?.length > 0 && (
            <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">UX Keywords</h4>
                <div className="flex flex-wrap gap-2">
                    {data.ux_keywords.map((keyword: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {keyword}
                        </span>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
