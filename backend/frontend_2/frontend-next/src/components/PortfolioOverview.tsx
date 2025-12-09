import React from 'react';
import { ExternalLink } from 'lucide-react';

interface PortfolioOverviewProps {
  data: any;
}

export default function PortfolioOverview({ data }: PortfolioOverviewProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold text-gray-900">Portfolio Overview</h1>
        {data.url && (
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            Visit Portfolio <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Hero Section</h2>
          <p className="text-gray-600 leading-relaxed">{data.hero || "Not Available"}</p>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">About</h2>
          <p className="text-gray-600 leading-relaxed">{data.about || "Not Available"}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Skills Detected</h2>
        <div className="flex flex-wrap gap-2">
          {data.skills?.length > 0 ? (
            data.skills.map((skill: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))
          ) : (
            <span className="text-gray-400 italic">No skills detected</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Overall Feedback</h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
          <p className="text-gray-700 leading-relaxed">{data.overall_feedback || "No feedback available"}</p>
        </div>
      </div>

      {data.sections?.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">Design Insights</h2>
          <div className="grid gap-6">
            {data.sections.map((section: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 capitalize">{section.section}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Current</h4>
                    <p className="text-gray-600 text-sm">{section.existing}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2 uppercase tracking-wider">Suggestion</h4>
                    <p className="text-gray-800 text-sm bg-blue-50 p-3 rounded">{section.suggestion}</p>
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
