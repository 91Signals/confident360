'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PortfolioOverview from '@/components/PortfolioOverview';
import CaseStudyCard from '@/components/CaseStudyCard';
import LoadingState from '@/components/LoadingState';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ResultsContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const reportId = searchParams.get('report_id');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = 'https://portfolio-backend-p4cawy2t5q-uc.a.run.app/reports';
        if (reportId) {
          url += `?report_id=${reportId}`;
        }

        // Direct call to Cloud Run to avoid Firebase Hosting 60s timeout
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const result = await response.json();
        
        // Transform list to object if it's an array
        if (Array.isArray(result)) {
          const portfolio = result.find((item: any) => item.type === 'portfolio');
          const case_studies = result.filter((item: any) => item.type === 'case_study');
          setData({ portfolio, case_studies });
        } else {
          setData(result);
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load analysis results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data || (!data.portfolio && (!data.case_studies || data.case_studies.length === 0))) {
     return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Results Found</h2>
            <p className="text-gray-600 mb-4">We couldn't find any analysis reports for this session.</p>
            <Link href="/" className="text-blue-600 hover:underline">Go back and start an analysis</Link>
        </div>
      </div>
     )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start New Analysis
          </Link>
          <div className="text-sm text-gray-500">
            Analysis generated on {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Portfolio Overview */}
        {data.portfolio && (
          <PortfolioOverview data={data.portfolio} />
        )}

        {/* Case Studies */}
        {data.case_studies && data.case_studies.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Project Analysis ({data.case_studies.length})</h2>
            <div className="grid gap-6">
              {data.case_studies.map((study: any, index: number) => (
                <CaseStudyCard key={study.id || index} data={study} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
