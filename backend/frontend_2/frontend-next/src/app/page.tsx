'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, CheckCircle2, Users, Star, ShieldCheck, Zap } from 'lucide-react';
import LoadingState from '@/components/LoadingState';

export default function Home() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (url) formData.append('url', url);
    if (file) formData.append('file', file);

    try {
      const response = await fetch('/analyze', {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Portfolio Analyzer</span>
          </div>
          <div className="text-sm text-gray-500">Job Ready Assessment</div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div className="bg-white pb-16 pt-12 lg:pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
              Is your design portfolio <span className="text-blue-600">job ready?</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Get instant, AI-driven feedback to score your process, uncover gaps, and elevate your storytelling, getting you job ready faster.
            </p>
            
            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Expert-Trained AI</h3>
                <p className="text-gray-600">Trained on top design portfolios and vetted by leading designers from global brands.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Hiring Manager Approved</h3>
                <p className="text-gray-600">Gain the expert perspective from Fortune 500 hiring teams, available 24/7.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Precise Actionable Insights</h3>
                <p className="text-gray-600">Stop guessing what's preventing you from landing that dream job with immediate feedback.</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-16">
              <Users className="w-5 h-5" />
              <span>Trusted by <strong>12,847</strong> Designers</span>
            </div>

            {/* Analysis Form */}
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 text-center">Analyze Your Portfolio</h2>
              </div>
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio URL
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id="url"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="https://yourportfolio.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Resume (PDF)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors cursor-pointer relative bg-gray-50 hover:bg-blue-50">
                      <input
                        type="file"
                        id="file"
                        accept=".pdf"
                        required
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <span className="font-medium text-blue-600 hover:text-blue-500">
                            {file ? file.name : 'Upload a file'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">PDF up to 10MB</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!url || !file}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                  >
                    Analyze Portfolio
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gray-50 py-16 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Designers Are Saying</h2>
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
                <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <p className="text-sm font-bold text-gray-900">- {testimonial.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
