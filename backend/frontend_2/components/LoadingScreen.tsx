
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const steps = [
  "Connecting to portfolio...",
  "Scanning for case studies...",
  "Extracting project links...",
  "Analyzing research methodologies...",
  "Evaluating visual hierarchy...",
  "Checking accessibility standards...",
  "Synthesizing final scores..."
];

export const LoadingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Very fast interval for high-speed perception
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 75);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-blue-400 animate-spin relative z-10" />
      </div>
      
      <h2 className="mt-8 text-2xl font-bold text-slate-200 tracking-tight">
        AI Analysis in Progress
      </h2>
      
      <div className="mt-6 w-full max-w-md space-y-3">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`flex items-center space-x-3 transition-all duration-300 ${
              index === currentStep 
                ? 'opacity-100 translate-x-0' 
                : index < currentStep 
                  ? 'opacity-50' 
                  : 'opacity-20 translate-x-2'
            }`}
          >
            {index < currentStep ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <div className={`w-5 h-5 rounded-full border-2 ${index === currentStep ? 'border-blue-500 border-t-transparent animate-spin' : 'border-slate-700'}`} />
            )}
            <span className={`text-sm ${index === currentStep ? 'text-blue-200 font-medium' : 'text-slate-400'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
