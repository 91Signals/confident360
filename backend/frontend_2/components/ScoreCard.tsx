import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { SectionScore } from '../types';

interface Props {
  section: SectionScore;
}

export const ScoreCard: React.FC<Props> = ({ section }) => {
  const [isOpen, setIsOpen] = useState(false);
  const percentage = Math.round((section.score / section.maxScore) * 100);
  
  const getScoreColor = (p: number) => {
    if (p >= 80) return 'bg-emerald-500';
    if (p >= 60) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  const getScoreTextColor = (p: number) => {
    if (p >= 80) return 'text-emerald-400';
    if (p >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-200">{section.name}</h3>
            <span className={`font-mono text-sm font-bold ${getScoreTextColor(percentage)}`}>
              {section.score}/{section.maxScore}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getScoreColor(percentage)} transition-all duration-1000 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        <div className="text-slate-500">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Expandable Content */}
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0 border-t border-slate-800/50 text-sm text-slate-400 bg-slate-900/30">
          <p className="mb-3 leading-relaxed">{section.feedback}</p>
          
          {section.subSections && (
            <div className="space-y-2 mt-4">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Breakdown</h4>
              {section.subSections.map((sub, idx) => (
                 <div key={idx} className="flex justify-between items-center text-xs">
                   <span>{sub.name}</span>
                   <span className="text-slate-300 font-medium">{sub.score} pts</span>
                 </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};