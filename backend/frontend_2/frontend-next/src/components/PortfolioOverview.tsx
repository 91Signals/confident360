import React from 'react';
import { ExternalLink, User, Code2, Sparkles, Layout } from 'lucide-react';

interface PortfolioOverviewProps {
  data: any;
}

export default function PortfolioOverview({ data }: PortfolioOverviewProps) {
  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 p-8 space-y-10">
      <div className="flex justify-between items-start border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Overview</h1>
          <p className="text-gray-400">High-level analysis of your portfolio structure and content.</p>
        </div>
        {data.url && (
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600/20 transition-colors text-sm font-medium"
          >
            Visit Portfolio <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <Layout className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Hero Section</h2>
          </div>
          <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5">
            <p className="text-gray-300 leading-relaxed">{data.hero || "Not Available"}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <User className="w-5 h-5" />
            <h2 className="text-lg font-semibold">About</h2>
          </div>
          <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/5">
            <p className="text-gray-300 leading-relaxed">{data.about || "Not Available"}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 mb-2">
          <Code2 className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Skills Detected</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.skills?.length > 0 ? (
            data.skills.map((skill: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-gray-500 italic">No skills detected</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 mb-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Overall Feedback</h2>
        </div>
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-6 rounded-xl border border-indigo-500/20">
          <p className="text-gray-200 leading-relaxed">{data.overall_feedback || "No feedback available"}</p>
        </div>
      </div>

      {data.sections?.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-white/10">
          <h2 className="text-xl font-semibold text-white">Design Insights</h2>
          <div className="grid gap-6">
            {data.sections.map((section: any, i: number) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 hover:border-indigo-500/30 transition-colors">
                <h3 className="font-semibold text-lg text-white mb-4 capitalize flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  {section.section}
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Current State</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{section.existing}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 mb-3 uppercase tracking-wider">Suggestion</h4>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-lg">
                      <p className="text-gray-200 text-sm leading-relaxed">{section.suggestion}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
