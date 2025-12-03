'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  ArrowRight, 
  Layout, 
  Search,
  CheckCircle2,
  Loader2,
  Mic,
  Brain,
  Briefcase,
  Target,
  Sparkles,
  Upload,
  X,
  Users,
  Linkedin,
  MessageSquare,
  Volume2,
  Power,
  MicOff,
  PenTool,
  MousePointer2,
  ChevronDown,
  Award,
  Play,
  Download,
  RefreshCcw,
  AlertCircle,
  ArrowLeft,
  User,
  Clock,
  ExternalLink,
  MessagesSquare,
  Lock
} from 'lucide-react';
import { AppState, AnalysisResult, ProjectCategory, SectionScore } from './types';
import { analyzeCaseStudy, extractPortfolioDetails, extractProjectLinks, mockGoogleLogin } from './services/geminiService';
import { LoadingScreen } from './components/LoadingScreen';
import { ScoreCard } from './components/ScoreCard';
import { AnalysisRadar, ScoreDoughnut } from './components/Charts';
import { VoiceInterview } from './components/VoiceInterview';

// Custom hook for animated number counter
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
};

interface DashboardItem {
  url: string;
  status: 'pending' | 'analyzing' | 'complete';
  result?: AnalysisResult;
}

// Unified Scanning & Processing Screen
const ScaffoldingLoader = ({ items, onComplete }: { items: DashboardItem[], onComplete: () => void }) => {
  // Determine global status
  const allComplete = items.length > 0 && items.every(i => i.status === 'complete');
  const anyItems = items.length > 0;

  return (
     <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden p-6">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="z-10 w-full max-w-5xl">
           <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight animate-in fade-in slide-in-from-bottom-4 transition-all duration-500">
                 {!anyItems ? "Scanning Portfolio..." : allComplete ? "Analysis Complete" : `Processing ${items.length} Case Studies...`}
              </h2>
              <p className="text-slate-400 text-lg animate-in fade-in slide-in-from-bottom-5 delay-100 max-w-2xl mx-auto">
                 {!anyItems ? "Our AI is connecting to the source and identifying key projects for review." : allComplete ? "Your personalized report is ready. Uncover gaps and elevate your storytelling." : "AI is currently scoring your design process, visual hierarchy, and problem-solving methodologies."}
              </p>
           </div>

           {!anyItems ? (
              // Phase 1: Scanning Animation
              <div className="flex flex-col items-center animate-in fade-in duration-700">
                 <div className="relative w-32 h-32 mb-10">
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                    <div className="absolute inset-3 rounded-full border-r-2 border-purple-500 animate-spin reverse duration-700"></div>
                    <div className="absolute inset-6 rounded-full border-b-2 border-pink-500 animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-8 h-8 text-indigo-400/50 animate-pulse" />
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-300"></div>
                 </div>
              </div>
           ) : (
              // Phase 2: Processing Grid
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full animate-in fade-in zoom-in duration-500">
                 {items.map((item, idx) => {
                    const isComplete = item.status === 'complete';
                    const isAnalyzing = item.status === 'analyzing';
                    
                    // Mock title from URL
                    const title = item.result?.projectDetails.title || item.url.split('/').pop()?.replace(/-/g, ' ') || `Case Study ${idx + 1}`;

                    return (
                       <div key={idx} className={`relative bg-slate-900/80 backdrop-blur-sm border ${isAnalyzing ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] scale-105 z-10' : isComplete ? 'border-emerald-500/30' : 'border-slate-800 opacity-60'} rounded-2xl p-6 overflow-hidden transition-all duration-500 group`}>
                          {/* Progress Line for Analyzing */}
                          {isAnalyzing && (
                             <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20">
                                <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                             </div>
                          )}
                          
                          <div className="flex justify-between items-start mb-6">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-500 ${isComplete ? 'bg-emerald-500/20 text-emerald-400' : isAnalyzing ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                                {isComplete ? <CheckCircle2 className="w-6 h-6" /> : isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                             </div>
                             {isComplete && (
                                <span className="text-[10px] font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">COMPLETE</span>
                             )}
                             {isAnalyzing && (
                                <span className="text-[10px] font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20 animate-pulse">ANALYZING</span>
                             )}
                          </div>
                          
                          <h3 className="text-white text-lg font-semibold capitalize truncate mb-2 group-hover:text-indigo-200 transition-colors">{title}</h3>
                          <p className="text-xs text-slate-500 truncate font-mono mb-4">{item.url}</p>
                          
                          {isComplete ? (
                             <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between animate-in fade-in">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Overall Score</span>
                                <span className="text-2xl font-bold text-white tracking-tight">{item.result?.overallScore}<span className="text-sm text-slate-500 font-normal ml-0.5">/100</span></span>
                             </div>
                          ) : (
                             <div className="mt-4 pt-4 border-t border-slate-800/50">
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                   <div className={`h-full bg-indigo-500 rounded-full transition-all duration-300 ${isAnalyzing ? 'w-2/3 animate-pulse' : 'w-0'}`}></div>
                                </div>
                             </div>
                          )}
                       </div>
                    )
                 })}
              </div>
           )}

           {/* Phase 3: Action Button */}
           <div className={`mt-16 flex justify-center transition-all duration-700 ${allComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                 <button 
                    onClick={onComplete}
                    className="group relative bg-white text-slate-950 pl-8 pr-6 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3"
                 >
                    View Full Report
                    <div className="bg-slate-950 rounded-full p-1 text-white group-hover:translate-x-1 transition-transform">
                       <ArrowRight className="w-4 h-4" />
                    </div>
                 </button>
           </div>
        </div>
     </div>
  );
}

// Bot Icon Component
const BotIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
        <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/>
        <path d="M4 12a8 8 0 0 1 16 0v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1Z"/>
        <path d="M10 12h.01"/>
        <path d="M14 12h.01"/>
    </svg>
)

export default function App() {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [inputUrl, setInputUrl] = useState('');
  const [selectedRole, setSelectedRole] = useState('Product Designer');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', linkedin: '', portfolioUrl: '' });
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number | null>(null);
  
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // New States for Flow
  const [isScanning, setIsScanning] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  
  // Paywall State
  const [showPaywall, setShowPaywall] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Interview State
  const [interviewMode, setInterviewMode] = useState<'intro' | 'walkthrough' | 'critique'>('intro');

  const handleStartAnalysis = async () => {
    if (!inputUrl.trim() && !resumeFile) return;
    setState(AppState.AUTH);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  // Centralized Analysis Flow
  const startScanning = async () => {
    // 1. Setup UI for Scanning
    setState(AppState.RESULTS);
    setIsScanning(true);
    setDashboardItems([]);
    
    try {
        // 2. Identify Target & Extract Links
        // Delay slightly to let the "Scanning..." animation play for effect
        await new Promise(r => setTimeout(r, 1500));

        const targetUrl = inputUrl.trim() || (resumeFile ? `resume://${resumeFile.name}` : 'https://example.com/portfolio');
        const projectLinks = await extractProjectLinks(targetUrl);
        
        const initialItems: DashboardItem[] = projectLinks.map(url => ({
            url,
            status: 'pending'
        }));
        
        // 3. Show items in the ScaffoldingLoader
        setDashboardItems(initialItems);

        // 4. Start processing them one by one
        await processAnalysisQueue(initialItems);

    } catch (e) {
        console.error("Scan failed", e);
        setIsScanning(false);
        setState(AppState.IDLE);
    }
  };

  const processAnalysisQueue = async (items: DashboardItem[]) => {
    // We work on a local copy to update state sequentially
    let currentItems = [...items];
    
    for (let i = 0; i < currentItems.length; i++) {
        // Mark current as analyzing
        currentItems[i] = { ...currentItems[i], status: 'analyzing' };
        setDashboardItems([...currentItems]);

        try {
            const result = await analyzeCaseStudy(currentItems[i].url);
            currentItems[i] = { ...currentItems[i], status: 'complete', result };
            setDashboardItems([...currentItems]);
        } catch (e) {
            console.error(`Analysis failed for ${currentItems[i].url}`, e);
        }
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = await mockGoogleLogin();
      
      let finalFormData = {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        linkedin: user.linkedin,
        portfolioUrl: inputUrl // Pre-fill with what user entered
      };

      // If a resume was uploaded, we want to simulate extracting info from it
      // and asking the user to confirm, rather than skipping straight to scanning.
      if (resumeFile) {
        const resumeDetails = await extractPortfolioDetails(`resume://${resumeFile.name}`);
        finalFormData = {
          ...finalFormData,
          mobile: resumeDetails.mobile || finalFormData.mobile,
          linkedin: resumeDetails.linkedin || finalFormData.linkedin
        };
        
        setFormData(finalFormData);
        setUserAvatar(user.avatar);
        setState(AppState.LEAD_CAPTURE);
      } else {
        // Standard flow for URL only -> Go straight to scanning
        setFormData(finalFormData);
        setUserAvatar(user.avatar);
        startScanning(); // Trigger unified flow
      }
    } catch (e) {
      console.error("Login failed", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleContinueWithEmail = async () => {
    setIsExtracting(true);
    try {
      const targetUrl = inputUrl.trim() || (resumeFile ? `resume://${resumeFile.name}` : '');
      const details = await extractPortfolioDetails(targetUrl);
      setFormData({ ...details, portfolioUrl: inputUrl });
      setState(AppState.LEAD_CAPTURE);
    } catch (e) {
      console.error(e);
      setState(AppState.LEAD_CAPTURE); 
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use the confirmed portfolio URL from the form if present
    if (formData.portfolioUrl) {
        setInputUrl(formData.portfolioUrl);
    }
    // Trigger unified flow
    startScanning();
  };

  const handleGenerateReport = () => {
    setIsPaid(true);
    setReportGenerated(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePayment = () => {
    setPaymentProcessing(true);
    // Simulate processing payment - Fast
    setTimeout(() => {
      setPaymentProcessing(false);
      setShowPaywall(false);
      handleGenerateReport();
    }, 1000);
  };

  const handleReset = () => {
    setInputUrl('');
    setResumeFile(null);
    setDashboardItems([]);
    setFormData({ name: '', email: '', mobile: '', linkedin: '', portfolioUrl: '' });
    setUserAvatar(null);
    setState(AppState.IDLE);
    setReportGenerated(false);
    setIsScanning(false);
    setShowPaywall(false);
    setIsPaid(false);
  };

  const handleViewDetails = (index: number) => {
     if (!isPaid) {
        setShowPaywall(true);
        return;
     }
     setActiveResultIndex(index);
  };

  const activeResult = activeResultIndex !== null ? dashboardItems[activeResultIndex]?.result : null;
  
  const completedItems = dashboardItems.filter(item => item.status === 'complete' && item.result);
  const allItemsComplete = dashboardItems.length > 0 && completedItems.length === dashboardItems.length;

  // --- Aggregated Calculations ---
  const portfolioScore = completedItems.length > 0 
    ? Math.round(completedItems.reduce((acc, curr) => acc + (curr.result?.overallScore || 0), 0) / completedItems.length)
    : 0;

  // Aggregated Competency Data
  const aggregatedSections: SectionScore[] = [];
  if (completedItems.length > 0) {
    const sectionMap = new Map<string, {total: number, max: number, count: number}>();
    
    completedItems.forEach(item => {
       item.result?.sections.forEach(sec => {
          let label = sec.name;
          if (label.includes('Research')) label = 'Research';
          else if (label.includes('Problem')) label = 'Problem';
          else if (label.includes('Ideation')) label = 'Ideation';
          else if (label.includes('Visual')) label = 'Visuals';
          else if (label.includes('Validation')) label = 'Validation';
          else if (label.includes('Storytelling')) label = 'Storytelling';
          
          if (label !== 'Bonus') {
              const current = sectionMap.get(label) || { total: 0, max: 0, count: 0 };
              sectionMap.set(label, {
                 total: current.total + sec.score,
                 max: current.max + sec.maxScore,
                 count: current.count + 1
              });
          }
       });
    });

    sectionMap.forEach((value, key) => {
       aggregatedSections.push({
          name: key,
          score: Math.round(value.total / value.count),
          maxScore: Math.round(value.max / value.count),
          feedback: ''
       });
    });
    
    const order = ['Research', 'Problem', 'Ideation', 'Visuals', 'Validation', 'Storytelling'];
    aggregatedSections.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  } else {
      // Placeholder data
      aggregatedSections.push(
          { name: 'Research', score: 70, maxScore: 100, feedback: '' },
          { name: 'Problem', score: 60, maxScore: 100, feedback: '' },
          { name: 'Ideation', score: 50, maxScore: 100, feedback: '' },
          { name: 'Visuals', score: 80, maxScore: 100, feedback: '' },
          { name: 'Validation', score: 65, maxScore: 100, feedback: '' },
          { name: 'Storytelling', score: 75, maxScore: 100, feedback: '' }
      );
  }

  // Domain Expertise
  const aggregatedDomains = Array.from(
    new Set(completedItems.flatMap(i => i.result?.domains || []))
  ).slice(0, 3);

  // Job Fit logic
  const getSectionAverage = (keyword: string) => {
    if (completedItems.length === 0) return 0;
    let total = 0;
    let count = 0;
    completedItems.forEach(item => {
      item.result?.sections.forEach(s => {
        if (s.name.includes(keyword)) {
          total += (s.score / s.maxScore) * 100;
          count++;
        }
      });
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const productDesignScore = Math.round((getSectionAverage('Research') + getSectionAverage('Problem') + getSectionAverage('Validation')) / 3);
  const visualDesignScore = getSectionAverage('Visual');
  const researchScore = getSectionAverage('Research');
  const generalistScore = completedItems.length > 0 ? portfolioScore : 0;

  const jobFits = [
    { role: 'Product Designer', score: productDesignScore, icon: MousePointer2 },
    { role: 'UX/UI Generalist', score: generalistScore, icon: Layout },
    { role: 'Visual Designer', score: visualDesignScore, icon: PenTool },
    { role: 'UX Researcher', score: researchScore, icon: Search },
  ];

  const aggregatedImprovements = completedItems
    .flatMap(item => item.result?.improvements || [])
    .filter(i => i.priority === 'High')
    .slice(0, 3);

  const designerCount = useCounter(2345, 2500);

  // --- Hero View ---
  if (state === AppState.IDLE) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 relative overflow-x-hidden selection:bg-indigo-500/30 font-sans">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px] pointer-events-none"></div>

        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">UX Analyzer</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
               <button onClick={() => setState(AppState.INTERVIEW)} className="text-sm font-medium text-zinc-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><Mic className="w-4 h-4" />Mock Interview</button>
               <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/5 transition-all">Features</a>
               <a href="#" className="text-sm font-medium text-zinc-400 hover:text-white px-4 py-2 rounded-full hover:bg-white/5 transition-all">Pricing</a>
            </nav>

            <div className="flex items-center gap-3">
               <button onClick={() => setState(AppState.AUTH)} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3">Log in</button>
               <button onClick={() => setState(AppState.AUTH)} className="bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-lg shadow-white/5">Sign up</button>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-8 hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-medium text-indigo-200 tracking-wide">Powered by Gemini 2.5</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Is your design portfolio <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">job ready?</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Get instant, AI-driven feedback to score your process, uncover gaps, and elevate your storytelling.
          </p>

          <div className="w-full max-w-3xl mx-auto">
              {/* Updated Main Input Area: Textarea with embedded upload button */}
              <div className="relative bg-zinc-900/50 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all hover:border-white/20 group mb-6">
                  {/* Decorative Top Line */}
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                  <textarea
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="Upload Resume / Paste your portfolio link..."
                      className="w-full h-48 bg-transparent text-lg text-white placeholder-zinc-600 p-6 resize-none focus:outline-none font-medium pb-16"
                  />
                  
                  {/* Upload Resume Button - Positioned Inside Textarea at Bottom Left */}
                  <div className="absolute bottom-4 left-6">
                    <label className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-medium cursor-pointer transition-colors px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/10 hover:bg-white/10 group/upload">
                        <div className="p-1 rounded-md bg-zinc-800 group-hover/upload:bg-zinc-700 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                        </div>
                        <span>Upload Resume</span>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    </label>
                  </div>

                  {/* Uploaded File Chip */}
                  {resumeFile && (
                      <div className="absolute top-4 right-4 bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in zoom-in">
                          <FileText className="w-3 h-3" />
                          <span className="max-w-[150px] truncate">{resumeFile.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); }} className="hover:text-white"><X className="w-3 h-3" /></button>
                      </div>
                  )}
              </div>

              {/* Controls Row: Job Role Selector and Analyze Button */}
              <div className="flex flex-col md:flex-row items-end gap-4">
                  <div className="flex-1 w-full text-left">
                      <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Applying for Job Role</label>
                      <div className="relative group w-full">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Briefcase className="h-5 w-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                          </div>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="block w-full pl-12 pr-10 py-3.5 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all hover:bg-zinc-900/80 cursor-pointer appearance-none shadow-lg backdrop-blur-xl font-medium"
                          >
                            <option value="Product Designer">Product Designer</option>
                            <option value="UX/UI Designer">UX/UI Designer</option>
                            <option value="Visual Designer">Visual Designer</option>
                            <option value="UX Researcher">UX Researcher</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <ChevronDown className="h-5 w-5 text-zinc-500" aria-hidden="true" />
                          </div>
                      </div>
                  </div>

                  <button 
                      onClick={handleStartAnalysis}
                      disabled={!inputUrl.trim() && !resumeFile}
                      className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[50px] shrink-0"
                  >
                      <Sparkles className="w-4 h-4" />
                      <span>Analyse</span>
                  </button>
              </div>
          </div>

          <div className="mt-10">
             <button onClick={() => setShowVideoModal(true)} className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium group">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors"><Play className="w-3 h-3 fill-current" /></div>
                <span>See how it works</span>
             </button>
          </div>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[
                { icon: Brain, color: "text-indigo-400", title: "Expert-Trained AI", desc: "Trained on top portfolios from FAANG designers." },
                { icon: Briefcase, color: "text-violet-400", title: "Hiring Manager View", desc: "Get the perspective of Fortune 500 recruiters." },
                { icon: Target, color: "text-pink-400", title: "Actionable Insights", desc: "Specific feedback to improve your storytelling." }
              ].map((feature, idx) => (
                <div key={idx} className="group p-8 rounded-3xl bg-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 hover:bg-white/[0.04] flex flex-col items-center text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                   <div className={`w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]`}>
                      <feature.icon className="w-8 h-8 stroke-[1.5]" />
                   </div>
                   <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
                   <p className="text-base text-zinc-400 leading-relaxed max-w-[260px]">{feature.desc}</p>
                </div>
              ))}
          </div>
        </main>

        {/* Deep Analysis Features Bento Grid */}
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
              Everything you need to boost <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                your design career
              </span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
               From AI-powered portfolio critiques and real-time mock interviews to LinkedIn SEO scoring—unlock the comprehensive toolkit built to get you hired faster.
            </p>
          </div>

          <div className="space-y-6">
            {/* Top Row: Elite Training & Mock Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Elite Data Training (Timeline) */}
              <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all h-[400px] flex flex-col shadow-2xl hover:bg-zinc-900/60">
                 <div className="flex items-start gap-4 mb-6 relative z-10">
                    <Brain className="w-6 h-6 text-zinc-400 mt-1" />
                    <div>
                       <h3 className="text-xl font-bold text-white mb-1">Elite Data Training</h3>
                       <p className="text-zinc-400 text-sm leading-relaxed max-w-md">Our model is fine-tuned on thousands of successful portfolios from top tech companies.</p>
                    </div>
                 </div>
                 {/* Timeline Visual */}
                 <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 flex-1 relative overflow-hidden">
                    <div className="absolute top-6 left-6 right-6 flex justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                       <span>Data In</span><span>Training</span><span>Validation</span><span>Testing</span><span>Deploy</span><span>Audit</span><span>Review</span><span>Success</span>
                    </div>
                    <div className="absolute top-16 left-0 w-full h-px bg-white/5"></div>
                    {/* Timeline Nodes */}
                    <div className="absolute top-10 left-[10%] flex flex-col gap-4">
                       <div className="flex items-center gap-3">
                          <div className="h-10 px-4 bg-zinc-900 border border-white/10 rounded-lg flex items-center gap-2 text-sm text-zinc-300 shadow-lg"><Layout className="w-4 h-4 text-indigo-400" /> FAANG Portfolios</div>
                          <div className="w-16 h-px bg-white/10"></div>
                       </div>
                       <div className="ml-12 flex items-center gap-3">
                          <div className="w-4 h-16 border-l border-b border-white/10 rounded-bl-xl"></div>
                          <div className="h-10 px-4 bg-zinc-900 border border-white/10 rounded-lg flex items-center gap-2 text-sm text-zinc-300 shadow-lg mt-8"><Brain className="w-4 h-4 text-emerald-400" /> Design Systems</div>
                       </div>
                    </div>
                     <div className="absolute bottom-10 right-[20%] animate-pulse">
                         <div className="flex items-center gap-2 text-indigo-400 font-handwriting text-xl -rotate-6"><Award className="w-4 h-4" /> <span>Hired!</span></div>
                     </div>
                 </div>
              </div>

              {/* Card 2: Mock Interviews (Glowing Orb) */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all h-[400px] flex flex-col cursor-pointer shadow-2xl hover:bg-zinc-900/60" onClick={() => setState(AppState.INTERVIEW)}>
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                     <Mic className="w-6 h-6 text-zinc-400 mt-1" />
                     <div>
                        <h3 className="text-xl font-bold text-white mb-1">Voice Mock Interviews</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">Practice behavioral and technical questions with our Gemini Live voice agent.</p>
                     </div>
                  </div>
                  {/* Orb Visual */}
                  <div className="flex-1 flex items-center justify-center relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
                     <div className="relative w-32 h-32 rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-150 opacity-50 animate-[ping_3s_linear_infinite]"></div>
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-125 opacity-70"></div>
                        <div className="w-16 h-16 bg-zinc-900 rounded-full border border-white/10 flex items-center justify-center shadow-inner relative z-10">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-sm animate-pulse"></div>
                        </div>
                        <div className="absolute left-0 -translate-x-12"><Mic className="w-6 h-6 text-zinc-600 opacity-50" /></div>
                        <div className="absolute right-0 translate-x-12"><Volume2 className="w-6 h-6 text-zinc-600 opacity-50" /></div>
                     </div>
                     <div className="absolute bottom-4 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full animate-bounce">Try Live Demo</div>
                  </div>
              </div>
            </div>

            {/* Bottom Row: LinkedIn SEO, Personas, Feedback */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Card 3: LinkedIn SEO (Code) */}
               <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all h-[320px] flex flex-col shadow-2xl hover:bg-zinc-900/60">
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                     <Linkedin className="w-6 h-6 text-zinc-400 mt-1" />
                     <div>
                        <h3 className="text-lg font-bold text-white mb-1">LinkedIn SEO Scoring</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">Ensure recruiters find you. We analyze your keywords against job descriptions.</p>
                     </div>
                  </div>
                  <div className="bg-zinc-950 rounded-xl border border-white/10 p-4 font-mono text-[10px] text-zinc-400 leading-relaxed overflow-hidden shadow-2xl">
                      <div className="flex gap-1.5 mb-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                      </div>
                      <span className="text-purple-400">&lt;meta</span> name=<span className="text-green-400">"keywords"</span><br/>
                      &nbsp;&nbsp;content=<span className="text-green-400">"Product Design, Figma, UX Research"</span><span className="text-purple-400"> /&gt;</span><br/><br/>
                      <span className="text-slate-500">// Analysis Result</span><br/>
                      <span className="text-purple-400">const</span> matchScore = <span className="text-blue-400">98</span>;<br/>
                      <span className="text-purple-400">if</span> (matchScore {'>'} <span className="text-blue-400">90</span>) {'{'}<br/>
                      &nbsp;&nbsp;recruiters.notify(<span className="text-green-400">"Top Candidate"</span>);<br/>
                      {'}'}
                      <div className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-bounce">
                          <Search className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                      </div>
                  </div>
               </div>

               {/* Card 4: Hiring Personas (User Card) */}
               <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all h-[320px] flex flex-col shadow-2xl hover:bg-zinc-900/60">
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                     <Users className="w-6 h-6 text-zinc-400 mt-1" />
                     <div>
                        <h3 className="text-lg font-bold text-white mb-1">Hiring Personas</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">Switch between Recruiter, Design Manager, and Peer Review modes.</p>
                     </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center relative">
                      <div className="w-32 h-32 bg-gradient-to-t from-indigo-500/20 to-transparent rounded-full blur-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="bg-white rounded-2xl p-4 shadow-xl w-full max-w-[200px] relative z-10 transform rotate-2 transition-transform hover:rotate-0">
                          <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden">
                                      <img src="https://i.pravatar.cc/150?u=sarah" alt="Recruiter" />
                                  </div>
                                  <div className="text-[10px]">
                                      <div className="font-bold text-zinc-900">Sarah Jenkins</div>
                                      <div className="text-zinc-400 text-[8px]">Senior Recruiter @ TechCo</div>
                                  </div>
                              </div>
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full w-3/4 mb-2"></div>
                          <div className="h-2 bg-zinc-100 rounded-full w-1/2"></div>
                      </div>
                      <div className="bg-white/50 rounded-2xl w-[180px] h-[100px] absolute top-[60%] z-0 shadow-lg"></div>
                  </div>
               </div>

               {/* Card 5: Instant Critique (Chat) */}
               <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all h-[320px] flex flex-col shadow-2xl hover:bg-zinc-900/60">
                  <div className="flex items-start gap-4 mb-6 relative z-10">
                     <MessageSquare className="w-6 h-6 text-zinc-400 mt-1" />
                     <div>
                        <h3 className="text-lg font-bold text-white mb-1">Instant Critique</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">Real-time actionable feedback on your case studies.</p>
                     </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-end gap-3 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none"></div>
                      {/* Chat Bubbles */}
                      <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-xl rounded-tl-none text-[10px] text-zinc-400 backdrop-blur-sm">
                          Can you review my problem statement?
                      </div>
                      <div className="bg-zinc-800 border border-white/10 p-3 rounded-xl rounded-bl-none flex gap-3 items-start shadow-lg relative z-20">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 overflow-hidden shrink-0 border border-white/20">
                              <BotIcon />
                          </div>
                          <div>
                              <div className="flex justify-between items-baseline mb-1">
                                  <span className="font-bold text-white text-xs">AI Agent</span>
                                  <span className="text-[8px] text-zinc-500">Just now</span>
                              </div>
                              <p className="text-[10px] text-zinc-300 leading-relaxed">It's a bit vague. Try adding specific metrics. How much did user retention increase?</p>
                          </div>
                      </div>
                      <div className="bg-zinc-900/50 border border-white/5 p-3 rounded-xl rounded-tl-none flex gap-3 items-center opacity-60 blur-[1px]">
                           <div className="w-6 h-6 rounded-full bg-zinc-700"></div>
                           <div className="h-2 bg-zinc-700 rounded w-24"></div>
                      </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Auth View ---
  if (state === AppState.AUTH) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {isLoggingIn && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-300 font-medium">Authenticating...</p>
            </div>
          )}
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Sign in or Create account</h2>
            <p className="text-slate-400 text-sm">Join thousands of designers getting hired</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-colors"
            >
              <div className="w-5 h-5"><GoogleIcon /></div>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleContinueWithEmail(); }} className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="you@design.co"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
               </div>
               <button 
                 type="submit"
                 disabled={isExtracting}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
               >
                 {isExtracting ? <Loader2 className="animate-spin w-5 h-5" /> : "Continue"}
               </button>
            </form>
          </div>
          
          <p className="mt-8 text-center text-xs text-slate-500">
             By clicking continue, you agree to our <a href="#" className="underline hover:text-white">Terms of Service</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
          </p>
        </div>
      </div>
    );
  }

  // --- Lead Capture / Detail Confirmation ---
  if (state === AppState.LEAD_CAPTURE) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-500">
          
          {resumeFile && (
             <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                   <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                   <p className="text-sm font-medium text-blue-200">Analyzing Resume: {resumeFile.name}</p>
                   <p className="text-xs text-blue-400/80">We've pre-filled some details for you.</p>
                </div>
             </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Confirm your details</h2>
            <p className="text-slate-400 text-sm">We'll tailor the analysis based on your profile</p>
          </div>

          <form onSubmit={handleFinalSubmit} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={formData.mobile}
                    onChange={e => setFormData({...formData, mobile: e.target.value})}
                  />
               </div>
             </div>
             
             <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">LinkedIn Profile</label>
                <input 
                  type="url" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin}
                  onChange={e => setFormData({...formData, linkedin: e.target.value})}
                />
             </div>

             {/* Added Portfolio Link Field */}
             <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Portfolio Link</label>
                <input 
                  type="url" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="https://yourportfolio.com"
                  value={formData.portfolioUrl}
                  onChange={e => setFormData({...formData, portfolioUrl: e.target.value})}
                />
             </div>

             <div className="pt-4">
               <button 
                 type="submit"
                 className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/25"
               >
                 Start Portfolio Scan
               </button>
             </div>
          </form>
        </div>
      </div>
    );
  }

  // --- Scaffolding / Processing View (Unified) ---
  if (state === AppState.RESULTS && isScanning) {
    return <ScaffoldingLoader items={dashboardItems} onComplete={() => setIsScanning(false)} />;
  }

  // --- Results View (Dashboard) ---
  if (state === AppState.RESULTS) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
        {/* Sidebar Navigation */}
        <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col fixed h-full z-20">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center space-x-3 mb-6 cursor-pointer" onClick={handleReset}>
               <div className="bg-blue-600 p-1.5 rounded-lg"><BarChart3 className="w-5 h-5 text-white" /></div>
               <span className="font-bold text-lg text-slate-100">UX Analyzer</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
               {userAvatar ? (
                 <img src={userAvatar} alt="User" className="w-10 h-10 rounded-full border border-slate-700" />
               ) : (
                 <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {formData.name.charAt(0) || 'U'}
                 </div>
               )}
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{formData.name || 'Designer'}</p>
                  <p className="text-xs text-slate-500 truncate">{selectedRole}</p>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Projects Analyzed</div>
             {dashboardItems.map((item, idx) => {
               // Safe fallback for title
               const title = item.result?.projectDetails?.title || item.url.split('/').pop()?.replace(/-/g, ' ') || `Case Study ${idx + 1}`;
               
               return (
                 <button
                   key={idx}
                   onClick={() => handleViewDetails(idx)}
                   className={`w-full text-left p-3 rounded-lg border transition-all group ${
                     activeResultIndex === idx 
                       ? 'bg-blue-600/10 border-blue-500/50' 
                       : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                   }`}
                 >
                   <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${activeResultIndex === idx ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500'}`}>
                         {item.result?.overallScore || '-'}
                      </span>
                      {item.result?.walkthroughScore ? <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded">Interviewed</span> : null}
                   </div>
                   <h4 className={`text-sm font-medium truncate ${activeResultIndex === idx ? 'text-blue-100' : 'text-slate-300'}`}>
                     {title}
                   </h4>
                   <div className="flex items-center mt-2 text-xs text-slate-500 space-x-2">
                      {item.status === 'analyzing' && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>{item.status === 'complete' ? 'Ready' : 'Processing...'}</span>
                   </div>
                 </button>
               );
             })}
          </div>

          <div className="p-4 border-t border-slate-800">
             <button onClick={() => setState(AppState.INTERVIEW)} className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-xl transition-all text-sm font-medium group">
                <Mic className="w-4 h-4 group-hover:text-white" />
                <span>Practice Interview</span>
             </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-80 p-8 min-h-screen">
           {/* Top Bar */}
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    Portfolio Report
                    {isPaid && <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20">PRO</span>}
                 </h1>
                 <p className="text-slate-400 text-sm">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex gap-3">
                 <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white hover:border-slate-600 transition-all">
                    <Download className="w-4 h-4" /> Export PDF
                 </button>
                 <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-900/20 transition-all">
                    <RefreshCcw className="w-4 h-4" /> New Analysis
                 </button>
              </div>
           </div>
          
           {/* Paywall Overlay */}
           {showPaywall && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                 <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                    
                    <div className="flex gap-8">
                       <div className="flex-1">
                          <h2 className="text-2xl font-bold text-white mb-2">Unlock Full Report</h2>
                          <p className="text-slate-400 text-sm mb-6">Get deep insights, detailed section breakdowns, and actionable improvements to land your dream job.</p>
                          
                          <div className="space-y-4 mb-8">
                             {[
                                "Detailed Section Scores & Feedback",
                                "Competency Radar Charts",
                                "Prioritized Improvement List",
                                "PDF Export Capability",
                                "Compare with Industry Standards"
                             ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                   <div className="bg-green-500/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4 text-green-400" /></div>
                                   <span className="text-slate-300 text-sm">{feature}</span>
                                </div>
                             ))}
                          </div>
                          
                          <button 
                             onClick={handlePayment}
                             disabled={paymentProcessing}
                             className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                          >
                             {paymentProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>
                                   <span>Unlock Now</span>
                                   <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-2">$9.99</span>
                                </>
                             )}
                          </button>
                          <p className="text-center text-xs text-slate-500 mt-3">One-time payment. 100% Secure.</p>
                       </div>
                       
                       <div className="w-48 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                             <Lock className="w-8 h-8 text-blue-400" />
                          </div>
                          <div className="text-3xl font-bold text-white mb-1">85<span className="text-sm text-slate-500">%</span></div>
                          <p className="text-xs text-slate-400">of candidates improve their score after unlocking.</p>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {activeResultIndex === null ? (
              // --- Summary Dashboard (Default View) ---
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {/* Top Stats Row */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:border-slate-600 transition-all">
                       <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 z-10">Overall Score</h3>
                       <div className="scale-125 z-10"><ScoreDoughnut score={portfolioScore} /></div>
                    </div>

                    <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative group hover:border-slate-600 transition-all">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Competency Map</h3>
                          <div className="flex gap-2">
                             {aggregatedDomains.map(d => (
                                <span key={d} className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">{d}</span>
                             ))}
                          </div>
                       </div>
                       <div className="h-48 w-full"><AnalysisRadar data={aggregatedSections} /></div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-600 transition-all">
                       <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Designer Ranking</h3>
                       <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="text-4xl font-bold text-white mb-1">Top 15%</div>
                          <p className="text-xs text-slate-500 text-center">Your portfolio outperforms 85% of peers.</p>
                       </div>
                       <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500 to-green-400 w-[85%] h-full"></div>
                       </div>
                    </div>
                 </div>

                 {/* Job Fit & Improvements */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Job Fit */}
                    <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                       <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Role Suitability</h3>
                       <div className="grid grid-cols-2 gap-4">
                          {jobFits.map((fit, i) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-slate-900 rounded-lg text-slate-400"><fit.icon className="w-5 h-5" /></div>
                                   <div>
                                      <div className="font-semibold text-sm text-slate-200">{fit.role}</div>
                                      <div className="text-xs text-slate-500">Based on content analysis</div>
                                   </div>
                                </div>
                                <div className={`text-lg font-bold ${fit.score > 70 ? 'text-emerald-400' : fit.score > 50 ? 'text-amber-400' : 'text-slate-500'}`}>
                                   {fit.score}%
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    {/* Top Improvements */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                       <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Quick Wins</h3>
                       <div className="space-y-4">
                          {aggregatedImprovements.length > 0 ? aggregatedImprovements.map((imp, i) => (
                             <div key={i} className="flex gap-3 items-start">
                                <div className="mt-0.5 bg-rose-500/20 p-1 rounded text-rose-400 shrink-0"><AlertCircle className="w-3.5 h-3.5" /></div>
                                <div>
                                   <p className="text-sm text-slate-300 font-medium leading-tight mb-1">{imp.issue}</p>
                                   <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{imp.recommendation}</p>
                                </div>
                             </div>
                          )) : (
                             <div className="text-center py-8 text-slate-500 text-sm">No critical issues found! Great job.</div>
                          )}
                       </div>
                       {/* See Full Report Button (Paywall Trigger) */}
                       {!isPaid && (
                          <div className="mt-6 pt-6 border-t border-slate-800">
                             <button onClick={() => setShowPaywall(true)} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg flex items-center justify-center gap-2">
                                See Full Report <ArrowRight className="w-4 h-4" />
                             </button>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           ) : (
              // --- Detail View for Single Case Study ---
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                 <button onClick={() => setActiveResultIndex(null)} className="flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                 </button>

                 {activeResult && (
                    <div className="space-y-8">
                       {/* Header Card */}
                       <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                             <Layout className="w-32 h-32 text-white" />
                          </div>
                          
                          <div className="relative z-10">
                             <div className="flex items-center gap-3 mb-4">
                                <span className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 uppercase tracking-wide">
                                   {activeResult.category}
                                </span>
                                {activeResult.walkthroughScore > 0 && (
                                   <span className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30 uppercase tracking-wide flex items-center gap-1">
                                      <Mic className="w-3 h-3" /> Walkthrough Score: {activeResult.walkthroughScore}/3
                                   </span>
                                )}
                             </div>
                             
                             <h2 className="text-3xl font-bold text-white mb-4">{activeResult.projectDetails.title}</h2>
                             
                             <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2"><User className="w-4 h-4" /> {activeResult.projectDetails.role}</div>
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {activeResult.projectDetails.timeline}</div>
                                <a href={activeResult.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                                   <ExternalLink className="w-4 h-4" /> View Project
                                </a>
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Main Score Breakdown */}
                          <div className="lg:col-span-2 space-y-6">
                             <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Section Analysis</h3>
                                <span className="text-sm text-slate-500">Expand for details</span>
                             </div>
                             
                             <div className="space-y-4">
                                {activeResult.sections.map((section, idx) => (
                                   <ScoreCard key={idx} section={section} />
                                ))}
                             </div>
                          </div>

                          {/* Sidebar Stats */}
                          <div className="space-y-6">
                             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Case Study Score</h4>
                                <ScoreDoughnut score={activeResult.overallScore} />
                             </div>

                             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Key Strengths</h4>
                                <div className="flex flex-wrap gap-2">
                                   {activeResult.keywords.map(k => (
                                      <span key={k} className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-300 border border-slate-700">{k}</span>
                                   ))}
                                </div>
                             </div>

                             <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6">
                                <div className="flex items-start gap-3 mb-4">
                                   <Sparkles className="w-5 h-5 text-indigo-400 mt-1" />
                                   <h4 className="font-bold text-white">AI Summary</h4>
                                </div>
                                <p className="text-sm text-indigo-100 leading-relaxed opacity-90">
                                   {activeResult.summary}
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           )}
        </main>
      </div>
    );
  }

  // --- Interview Mode ---
  if (state === AppState.INTERVIEW) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col">
         <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md h-16 flex items-center justify-between px-6">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setState(AppState.IDLE)}>
               <div className="bg-blue-600 p-1.5 rounded-lg"><BarChart3 className="w-5 h-5 text-white" /></div>
               <span className="font-bold text-lg text-slate-100">UX Analyzer</span>
            </div>
            <button onClick={() => setState(AppState.IDLE)} className="text-sm font-medium text-slate-400 hover:text-white">Exit Interview</button>
         </header>
         
         <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
               <div className="p-6">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Interview Modules</h2>
                  <div className="space-y-2">
                     <button 
                        onClick={() => setInterviewMode('intro')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${interviewMode === 'intro' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                     >
                        <User className="w-4 h-4" />
                        Intro Test
                     </button>
                     <button 
                        onClick={() => setInterviewMode('walkthrough')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${interviewMode === 'walkthrough' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                     >
                        <Layout className="w-4 h-4" />
                        Portfolio Walkthrough
                     </button>
                     <button 
                        onClick={() => setInterviewMode('critique')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${interviewMode === 'critique' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                     >
                        <MessagesSquare className="w-4 h-4" />
                        Design Critique
                     </button>
                  </div>
               </div>
               
               <div className="mt-auto p-6 border-t border-slate-800">
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                     <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-xs uppercase"><Sparkles className="w-3 h-3" /> AI Interviewer</div>
                     <p className="text-xs text-slate-400 leading-relaxed">
                        Powered by Gemini Live. Speak naturally. The AI will interrupt, ask follow-ups, and score your responses.
                     </p>
                  </div>
               </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-slate-950 p-8 flex flex-col relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none"></div>
               
               <div className="mb-8 relative z-10 text-center">
                  <h1 className="text-3xl font-bold text-white mb-2">
                     {interviewMode === 'intro' && "Introduction Screening"}
                     {interviewMode === 'walkthrough' && "Case Study Deep Dive"}
                     {interviewMode === 'critique' && "Live Design Critique"}
                  </h1>
                  <p className="text-slate-400 text-sm max-w-xl mx-auto">
                     {interviewMode === 'intro' && "Practice your 'Tell me about yourself' pitch. The AI will look for clarity, structure, and impact."}
                     {interviewMode === 'walkthrough' && "Select a project and walk through it. Be ready for interruptions and deep-dive questions on your process."}
                     {interviewMode === 'critique' && "The AI will describe a design scenario or component. Critique it using standard usability heuristics."}
                  </p>
               </div>

               <VoiceInterview mode={interviewMode} />
            </main>
         </div>
      </div>
    );
  }

  // --- Google Icon Component ---
  function GoogleIcon() {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }
}