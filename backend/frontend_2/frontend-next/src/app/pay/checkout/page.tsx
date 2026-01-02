'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowLeft, ShieldCheck, Copy, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reportId = searchParams.get('report_id');
  const plan = searchParams.get('plan');
  
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Plan configurations
  const planDetails = {
    basic: {
      name: 'Basic Portfolio Check',
      price: '₹999',
      amount: 999,
      features: [
        'Portfolio Quality Check',
        'Overall Portfolio Score',
        'High-level Case Study Feedback',
        'Key Improvement Suggestions',
        '60 Days Access to Basic Job Listings'
      ],
      color: 'amber'
    },
    premium: {
      name: 'Premium Career Readiness',
      price: '₹4,999',
      amount: 4999,
      features: [
        'Complete Portfolio Readiness Score',
        'Detailed Portfolio Grading (all case studies)',
        'LinkedIn Profile Score & Optimization Insights',
        'Personalized Career Path Planning',
        '60 Days Access to Premium Job Listings',
        'Full UX Case Study Breakdown',
        'Actionable Improvement Roadmap'
      ],
      color: 'blue'
    }
  };

  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.basic;
  
  // UPI payment string
  const upiId = 'akashshivu.jk@ybl'; // Replace with your actual UPI ID
  const paymentString = `upi://pay?pa=${upiId}&pn=UX Analyzer&am=${selectedPlan.amount}&cu=INR&tn=Payment for ${selectedPlan.name} - Report ${reportId}`;

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(paymentString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation failed:', err);
      });
  }, [paymentString]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!plan) {
    router.push(`/pay?report_id=${reportId ?? ''}`);
    return null;
  }

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
            href={`/pay?report_id=${reportId ?? ''}`}
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 mb-6">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Complete Your Payment
          </h1>
          <p className="text-lg text-slate-400">
            Scan the QR code below with any UPI app to complete your payment
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* QR Code Section */}
          <div className="rounded-3xl p-8 border bg-slate-900/50 border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Scan to Pay</h2>
            
            <div className="bg-white rounded-2xl p-6 mb-6 flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Payment QR Code" className="w-full max-w-[300px]" />
              ) : (
                <div className="w-[300px] h-[300px] bg-slate-100 animate-pulse rounded-lg" />
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <div className="text-sm text-slate-400 mb-2">UPI ID</div>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-white font-mono text-sm">{upiId}</code>
                  <button
                    onClick={handleCopyUPI}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy UPI ID"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> Open any UPI app (Google Pay, PhonePe, Paytm) and scan this QR code to complete the payment instantly.
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-3xl p-8 border bg-slate-900/30 border-white/10 flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedPlan.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">One-time payment</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{selectedPlan.price}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8 flex-1">
              <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                What's included
              </div>
              {selectedPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${selectedPlan.color === 'blue' ? 'text-blue-400' : 'text-amber-400'}`} />
                  <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-lg font-bold mb-4">
                <span className="text-slate-300">Total Amount</span>
                <span className="text-white text-2xl">{selectedPlan.price}</span>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <div className="text-xs text-slate-400 mb-2">Report ID</div>
                <code className="text-white font-mono text-sm break-all">{reportId}</code>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-sm text-green-300">
                🔒 <strong>Secure Payment:</strong> After successful payment, your report will be unlocked automatically within 5 minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center space-y-4">
          <Link
            href={`/results?report_id=${reportId ?? ''}&unlock=1`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-center transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5"
          >
            <CheckCircle2 className="w-5 h-5" />
            Continue to Report
          </Link>
          
          <p className="text-slate-500 text-sm">
            Having trouble? Contact us at <a href="mailto:support@uxanalyzer.com" className="text-blue-400 hover:text-blue-300 underline">support@uxanalyzer.com</a>
          </p>
          <p className="text-slate-600 text-xs">
            100% money-back guarantee if not satisfied within 7 days
          </p>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Loading payment details...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
