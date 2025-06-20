import React from 'react';

interface ConfidenceBarProps {
  confidence: number; // 0-1 scale
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'bg-green-500';
    if (conf >= 0.6) return 'bg-yellow-500';
    if (conf >= 0.4) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'High Confidence';
    if (conf >= 0.6) return 'Moderate Confidence';
    if (conf >= 0.4) return 'Low Confidence';
    return 'Very Low Confidence';
  };
  
  const getConfidenceIcon = (conf: number) => {
    if (conf >= 0.8) return '✅';
    if (conf >= 0.6) return '⚠️';
    if (conf >= 0.4) return '⚠️';
    return '❌';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Confidence Level:</span>
          <span className={`text-sm font-bold ${getConfidenceColor(confidence).replace('bg-', 'text-')}`}>
            {percentage}%
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-sm">{getConfidenceIcon(confidence)}</span>
          <span className="text-sm opacity-80">{getConfidenceLabel(confidence)}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${getConfidenceColor(confidence)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
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