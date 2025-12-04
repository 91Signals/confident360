'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const loadingSteps = [
  "Connecting to portfolio...",
  "Scanning case studies...",
  "Extracting project links...",
  "Analyzing portfolio...",
  "Generating insights...",
  "Compiling reports...",
  "Finalizing results..."
];

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < loadingSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
      </div>
      
      <div className="w-full max-w-md space-y-4">
        {loadingSteps.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center space-x-3 transition-all duration-500 ${
              index === currentStep 
                ? 'opacity-100 scale-105 text-indigo-400 font-medium' 
                : index < currentStep 
                  ? 'opacity-50 text-gray-400' 
                  : 'opacity-30 text-gray-600'
            }`}
          >
            {index < currentStep ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : index === currentStep ? (
              <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-white/10" />
            )}
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
