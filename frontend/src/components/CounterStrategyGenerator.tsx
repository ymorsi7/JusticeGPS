import React from 'react';

interface CounterStrategyGeneratorProps {
  onGenerate: () => void;
  isLoading?: boolean;
}

const CounterStrategyGenerator: React.FC<CounterStrategyGeneratorProps> = ({ onGenerate, isLoading }) => {
  return (
    <div className="text-center">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Get an AI-powered second opinion. Refine your strategy for maximum impact.
      </p>
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed glow-effect"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            <span>Analyzing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">⚡️</span>
            <span>Suggest Improvements</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default CounterStrategyGenerator; 