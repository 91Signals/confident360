"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, ArrowLeft } from "lucide-react";

export default function BookSessionPage() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("report_id");
  const unlock = searchParams.get("unlock");
  const resultsHref = reportId
    ? `/results?report_id=${reportId}${unlock ? `&unlock=${unlock}` : ""}`
    : "/";
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-600/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-100">UX Analyzer</span>
          </div>
          <Link href={resultsHref} className="text-sm text-blue-400 hover:text-white font-medium flex items-center space-x-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Results</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Expert Review Session</h1>
          <p className="text-slate-400 mb-6">This is a placeholder page. Soon you will be able to book a 30‑minute deep dive with a Senior Product Designer for personalized feedback.</p>
          <Link href={resultsHref} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Link>
        </div>
      </main>
    </div>
  );
}
