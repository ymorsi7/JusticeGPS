import React from 'react';

interface ExplainabilityToggleProps {
  showExplainability: boolean;
  onToggle: () => void;
  darkMode: boolean;
}

const ExplainabilityToggle: React.FC<ExplainabilityToggleProps> = ({ showExplainability, onToggle, darkMode }) => {
  return (
    <button 
      onClick={onToggle} 
      className="glass-card px-4 py-2 hover:scale-105 transition-all duration-300 flex items-center space-x-2"
    >
      <span className="text-lg">
        {showExplainability ? '🔍' : '👁️'}
      </span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {showExplainability ? 'Hide' : 'Show'} AI
      </span>
    </button>
  );
};

export default ExplainabilityToggle; 