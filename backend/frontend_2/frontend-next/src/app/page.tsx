'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

const LOADING_STEPS = [
  "Connecting to portfolio...",
  "Scanning case studies...",
  "Extracting project links...",
  "Analyzing portfolio...",
  "Generating insights...",
  "Compiling reports...",
  "Finalizing results..."
];

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [designerCount, setDesignerCount] = useState(0);

  useEffect(() => {
    // Animate designer count
    const target = 12847;
    const duration = 2000;
    const interval = 20;
    const steps = duration / interval;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDesignerCount(Math.floor(current));
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoading) {
      const stepDuration = 700;
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < LOADING_STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, stepDuration);
      return () => clearInterval(timer);
    }
  }, [isLoading]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setCurrentStep(0);

    const formData = new FormData(e.currentTarget);

    try {
      // Direct call to Cloud Run to avoid Firebase Hosting 60s timeout
      const res = await fetch('https://portfolio-backend-p4cawy2t5q-uc.a.run.app/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Server error:', res.status, text);
        throw new Error(`Server responded with ${res.status}: ${text.slice(0, 100)}`);
      }

      const result = await res.json();

      if (result.error) {
        alert("Error: " + result.error);
        setIsLoading(false);
        return;
      }

      router.push(`/results?report_id=${result.report_id}`);
    } catch (error: any) {
      console.error('Fetch error:', error);
      alert(`An error occurred: ${error.message}`);
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-indigo-500/30">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Portfolio Analyzer
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!isLoading ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Hero */}
              <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Is your design portfolio <br />
                  <span className="text-indigo-500">job ready?</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Get instant, AI-driven feedback to score your process, uncover gaps, and elevate your storytelling.
                </p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-16">
                {[
                  { title: "Expert-Trained AI", desc: "Trained on top portfolios and vetted by global design leads." },
                  { title: "Hiring Manager Approved", desc: "Insights from Fortune 500 hiring perspectives." },
                  { title: "Actionable Insights", desc: "Precise feedback to fix gaps and land interviews." }
                ].map((f, i) => (
                  <div key={i} className="bg-[#111] border border-white/10 p-6 rounded-xl hover:border-indigo-500/50 transition-colors">
                    <h3 className="text-lg font-semibold text-indigo-400 mb-2">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* Social Proof */}
              <div className="text-center mb-12">
                <p className="text-gray-500">
                  Trusted by <strong className="text-white">{designerCount.toLocaleString()}</strong> Designers
                </p>
              </div>

              {/* Form */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto shadow-2xl shadow-indigo-500/10">
                <h2 className="text-2xl font-semibold text-center mb-8">Analyze Your Portfolio</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-300 mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      name="portfolioUrl"
                      id="portfolioUrl"
                      placeholder="https://yourportfolio.com"
                      required
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="resume" className="block text-sm font-medium text-gray-300 mb-2">
                      Upload Resume (PDF)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name="resume"
                        id="resume"
                        accept="application/pdf"
                        required
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 transition-all"
                      />
                      <Upload className="absolute right-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    Analyze Portfolio
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative w-24 h-24 mb-12">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>

              <div className="space-y-4 w-full max-w-md">
                {LOADING_STEPS.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: index <= currentStep ? 1 : 0.3,
                      x: 0,
                      color: index < currentStep ? '#10b981' : index === currentStep ? '#6366f1' : '#6b7280'
                    }}
                    className="flex items-center gap-4 text-lg font-medium"
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {index < currentStep ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : index === currentStep ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <div className="w-2 h-2 bg-current rounded-full" />
                      )}
                    </div>
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
