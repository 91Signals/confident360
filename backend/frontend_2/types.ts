
export interface SectionScore {
  name: string;
  score: number; // 0-100
  maxScore: number;
  feedback: string;
  subSections?: { name: string; score: number }[];
}

export interface Improvement {
  phase: string;
  issue: string;
  recommendation: string;
  priority: 'High' | 'Medium' | 'Low';
}

export type ProjectCategory = "UX/UI" | "Branding" | "Package Design" | "Marketing Design";

export interface AnalysisResult {
  url: string;
  category: ProjectCategory;
  domains: string[];
  overallScore: number;
  walkthroughScore: number; // 1 (Low), 2 (Med), 3 (High)
  summary: string;
  keywords: string[];
  sections: SectionScore[];
  improvements: Improvement[];
  projectDetails: {
    title: string;
    role: string;
    timeline: string;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  AUTH = 'AUTH',
  LEAD_CAPTURE = 'LEAD_CAPTURE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  INTERVIEW = 'INTERVIEW'
}