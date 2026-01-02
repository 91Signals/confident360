'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowLeft, ShieldCheck, Zap, Star } from 'lucide-react';

function PricingContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('report_id');

  const plans = [
    {
      name: 'Basic Portfolio Check',
      price: '₹999',
      description: 'Best for quick validation & feedback',
      features: [
        'Portfolio Quality Check',
        'Overall Portfolio Score',
        'High-level Case Study Feedback',
        'Key Improvement Suggestions',
        '60 Days Access to Basic Job Listings'
      ],
      cta: 'Unlock Basic Report',
      color: 'amber',
      popular: false,
      icon: Zap,
      planId: 'basic'
    },
    {
      name: 'Premium Career Readiness',
      price: '₹4,999',
      description: 'Best for designers actively preparing for jobs',
      features: [
        'Complete Portfolio Readiness Score',
        'Detailed Portfolio Grading (all case studies)',
        'LinkedIn Profile Score & Optimization Insights',
        'Personalized Career Path Planning',
        '60 Days Access to Premium Job Listings',
        'Full UX Case Study Breakdown',
        'Actionable Improvement Roadmap'
      ],
      cta: 'Unlock Premium Report',
      color: 'blue',
      popular: true,
      icon: Star,
      planId: 'premium'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">UX Analyzer</span>
          </div>
          <Link 
            href={`/results?report_id=${reportId ?? ''}`}
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Unlock Full Report
          </h1>
          <p className="text-lg text-slate-400">
            Get detailed insights, actionable feedback, and career guidance to land your dream design job.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative rounded-3xl p-8 border transition-all duration-300 flex flex-col h-full
                ${plan.popular 
                  ? 'bg-slate-900/50 border-blue-500/50 shadow-2xl shadow-blue-900/20 scale-105 z-10' 
                  : 'bg-slate-900/30 border-white/10 hover:border-white/20'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg shadow-blue-900/40">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6 
                  ${plan.popular ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <plan.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm min-h-[40px]">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-500">/one-time</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">What you get</div>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-blue-400' : 'text-amber-400'}`} />
                    <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={`/pay/checkout?report_id=${reportId ?? ''}&plan=${plan.planId}`}
                className={`w-full py-4 px-6 rounded-xl font-bold text-center transition-all duration-200 
                  ${plan.popular 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5' 
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/5'
                  }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            Secure payment powered by Stripe. 100% money-back guarantee if not satisfied within 7 days.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
