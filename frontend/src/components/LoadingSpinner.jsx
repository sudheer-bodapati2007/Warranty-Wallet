import React from 'react';
import { ShieldCheck } from 'lucide-react';

const LoadingSpinner = ({ label = "Loading warranties..." }) => {
  return (
    <div className="min-h-[350px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-600 dark:border-dark-700 dark:border-t-blue-500 animate-spin" />
        <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 absolute" />
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-medium text-sm animate-pulse">{label}</p>
    </div>
  );
};

export default LoadingSpinner;
