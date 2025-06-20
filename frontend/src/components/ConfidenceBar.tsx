import React from 'react';

interface ConfidenceBarProps {
  confidence: number; // 0-1 scale
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'from-success-400 to-success-600';
    if (conf >= 0.6) return 'from-warning-400 to-warning-600';
    if (conf >= 0.4) return 'from-accent-400 to-accent-600';
    return 'from-error-400 to-error-600';
  };
  
  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'High Confidence';
    if (conf >= 0.6) return 'Moderate Confidence';
    if (conf >= 0.4) return 'Low Confidence';
    return 'Very Low Confidence';
  };
  
  const getConfidenceIcon = (conf: number) => {
    if (conf >= 0.8) return '🎯';
    if (conf >= 0.6) return '⚠️';
    if (conf >= 0.4) return '🤔';
    return '❌';
  };

  const getConfidenceBg = (conf: number) => {
    if (conf >= 0.8) return 'bg-success-50 dark:bg-success-900/20';
    if (conf >= 0.6) return 'bg-warning-50 dark:bg-warning-900/20';
    if (conf >= 0.4) return 'bg-accent-50 dark:bg-accent-900/20';
    return 'bg-error-50 dark:bg-error-900/20';
  };

  return (
    <div className="glass-card p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Confidence:</span>
          <span className={`text-lg font-bold bg-gradient-to-r ${getConfidenceColor(confidence)} bg-clip-text text-transparent`}>
            {percentage}%
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getConfidenceIcon(confidence)}</span>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${getConfidenceBg(confidence)}`}>
            {getConfidenceLabel(confidence)}
          </span>
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className={`progress-fill bg-gradient-to-r ${getConfidenceColor(confidence)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default ConfidenceBar; 