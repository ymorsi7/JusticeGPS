import React, { useEffect, useRef } from 'react';

interface ConfidencePoint {
  timestamp: number;
  confidence: number; // This is a value from 0 to 1
  label: string;
  trigger: string;
}

interface ConfidenceTrendsProps {
  history: ConfidencePoint[];
  currentConfidence: number; // This is a value from 0 to 1
}

const ConfidenceTrends: React.FC<ConfidenceTrendsProps> = ({ history, currentConfidence }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i <= 4; i++) {
      const y = height - (height / 5) * i;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Draw data line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((point, index) => {
      const x = (width / (history.length - 1 || 1)) * index;
      const y = height - point.confidence * height;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#3b82f6';
    history.forEach((point, index) => {
      const x = (width / (history.length - 1 || 1)) * index;
      const y = height - point.confidence * height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

  }, [history]);

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  const lastPoint = history.length > 1 ? history[history.length - 2] : null;
  const trend = lastPoint ? currentConfidence - lastPoint.confidence : 0;
  
  const getTrendIndicator = () => {
    if (trend > 0.01) return '↑';
    if (trend < -0.01) return '↓';
    return '→';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Confidence Trends</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">
            {formatPercent(currentConfidence)}
            <span className={`ml-2 text-base ${trend > 0.01 ? 'text-green-500' : trend < -0.01 ? 'text-red-500' : 'text-gray-500'}`}>
              {getTrendIndicator()} {formatPercent(Math.abs(trend))}
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-40 mb-4 flex justify-center">
        <canvas ref={canvasRef} width="300" height="160" />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Recent Changes</h4>
        <ul className="space-y-1">
          {history.slice(-3).reverse().map((item) => (
            <li key={item.timestamp} className="flex justify-between items-center text-xs text-gray-500">
              <span>{item.trigger}: "{item.label}"</span>
              <span className="font-medium text-gray-700">{formatPercent(item.confidence)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ConfidenceTrends; 