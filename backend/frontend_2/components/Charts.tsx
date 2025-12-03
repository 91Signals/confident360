import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { SectionScore } from '../types';

interface RadarProps {
  data: SectionScore[];
}

export const AnalysisRadar: React.FC<RadarProps> = ({ data }) => {
  // Transform data for the chart. Normalize scores to 100 scale for visualization
  const chartData = data.map(d => ({
    subject: d.name.split(' ')[0], // Shorten name for chart
    A: (d.score / d.maxScore) * 100,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-[300px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="#3b82f6"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full -z-10"></div>
    </div>
  );
};

interface DoughnutProps {
  score: number;
  showPlaceholder?: boolean;
}

export const ScoreDoughnut: React.FC<DoughnutProps> = ({ score, showPlaceholder = false }) => {
  const data = [
    { name: 'Score', value: showPlaceholder ? 0 : score },
    { name: 'Remaining', value: showPlaceholder ? 100 : 100 - score },
  ];

  const startAngle = 90;
  const endAngle = -270;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={startAngle}
            endAngle={endAngle}
            dataKey="value"
            stroke="none"
            cornerRadius={5}
          >
            <Cell fill="url(#scoreGradient)" />
            <Cell fill="#1e293b" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`text-4xl font-bold tracking-tighter ${showPlaceholder ? 'text-slate-600' : 'text-white'}`}>
          {showPlaceholder ? 'XX' : score}
        </span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">/100</span>
      </div>
    </div>
  );
};
