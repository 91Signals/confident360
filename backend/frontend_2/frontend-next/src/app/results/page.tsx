'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PortfolioOverview from '@/components/PortfolioOverview';
import CaseStudyCard from '@/components/CaseStudyCard';
import LoadingState from '@/components/LoadingState';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/reports');
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const result = await response.json();
        
        setData(result);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load analysis results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (!data) {
     return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Results Found</h2>
            <Link href="/" className="text-blue-600 hover:underline">Go back and start an analysis</Link>
        </div>
      </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
            <h2 className="text-2xl font-bold text-gray-900">Case Studies Analysis</h2>
            <div className="grid gap-6">
              {data.case_studies.map((study: any, index: number) => (
                <CaseStudyCard key={index} data={study} />
              ))}
            </div>
          </div>
        )}
        
        {!data.portfolio && (!data.case_studies || data.case_studies.length === 0) && (
             <div className="text-center py-12">
                <p className="text-gray-500">No analysis data available to display.</p>
             </div>
        )}
      </div>
    </div>
  );
}
