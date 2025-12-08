'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, Users, Star, Play, ChevronDown } from 'lucide-react';
import LoadingState from '@/components/LoadingState';

export default function Home() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (url) formData.append('url', url);
    if (file) formData.append('file', file);

    try {
      const response = await fetch('https://portfolio-backend-266108283870.us-central1.run.app/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        router.push('/results');
      } else {
        console.error('Analysis failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">

      <main>
        {/* Nav */}
        <nav className="nav-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">U</div>
              <div className="text-white font-semibold">UX Analyzer</div>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <button className="hover:text-white">Mock Interview</button>
              <button className="hover:text-white">Features</button>
              <button className="hover:text-white">Pricing</button>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white">Log in</button>
              <button className="px-4 py-2 rounded-lg bg-white text-black font-semibold">Sign up</button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pb-16 pt-12 lg:pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400 mb-4">● Powered by Gemini 2.5</div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 heading-gradient">
              Is your design portfolio<br />
              job ready?
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-10">
              Get instant, AI-driven feedback to score your process, uncover gaps, and elevate your storytelling.
            </p>
            
            {/* Feature Grid (dark) */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
              {[
                { title: "Expert-Trained AI", desc: "Trained on top portfolios from FAANG designers." },
                { title: "Hiring Manager View", desc: "Get the perspective of Fortune 500 recruiters." },
                { title: "Actionable Insights", desc: "Specific feedback to improve your storytelling." }
              ].map((f, i) => (
                <div key={i} className="bg-[#111] border border-white/10 p-6 rounded-xl hover:border-indigo-500/50 transition-colors text-left">
                  <h3 className="text-lg font-semibold text-indigo-400 mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-2 text-gray-400 mb-16">
              <Users className="w-5 h-5" />
              <span>Trusted by <strong className="text-white">12,847</strong> Designers</span>
            </div>

            {/* Upload Card (dark) */}
            <div className="max-w-3xl mx-auto">
              <div className="gradient-border">
                <div className="upload-card p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                    <span>Upload Resume / Paste your portfolio link...</span>
                  </div>
                  <div className="glass-panel p-4 md:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500">
                          <LinkIcon className="h-5 w-5" />
                        </div>
                        <input
                          type="url"
                          id="url"
                          required
                          className="block w-full pl-10 pr-3 py-3 bg-transparent border border-white/10 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          placeholder="https://yourportfolio.com"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-200 hover:border-indigo-500/60 hover:text-white transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          {file ? file.name : 'Upload Resume'}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="file"
                          accept=".pdf"
                          required
                          className="hidden"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <span className="text-xs text-gray-500">PDF up to 10MB</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-2 tracking-[0.12em]">APPLYING FOR JOB ROLE</div>
                      <div className="relative">
                        <select
                          value={selectedRole || ''}
                          onChange={(e) => setSelectedRole(e.target.value || null)}
                          className="w-full appearance-none bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-white pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="" disabled>Select role</option>
                          <option value="Product Designer">Product Designer</option>
                          <option value="UX Designer">UX Designer</option>
                          <option value="UI Designer">UI Designer</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={!url || !file}
                      className="md:w-40 w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-base font-medium text-white brand-button focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02]"
                    >
                      Analyse
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-4">
                <Play className="w-4 h-4" />
                <span>See how it works</span>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-16 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 heading-gradient">What Designers Are Saying</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  text: "This tool helped me identify weak spots in my case studies that I hadn't noticed for months. Landed 3 interviews after updating!",
                  author: "Product Designer"
                },
                {
                  text: "The specific feedback on accessibility and visual hierarchy was a game changer. It's like having a senior designer review your work.",
                  author: "UX Researcher"
                },
                {
                  text: "Finally, a tool that understands the nuance of design storytelling. The phase scoring is incredibly accurate.",
                  author: "Senior UI Designer"
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-[#111] p-8 rounded-xl shadow-sm border border_white/10">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-gray-400 mb-4 italic">"{testimonial.text}"</p>
                  <p className="text_sm font-bold">- {testimonial.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
