import React, { useEffect, useRef } from 'react';

interface ConfidencePoint {
  timestamp: number;
  confidence: number;
  label: string;
  trigger: string; // e.g., "case cited", "step added"
}

interface ConfidenceTrendsProps {
  data: ConfidencePoint[];
  title?: string;
}

const ConfidenceTrends: React.FC<ConfidenceTrendsProps> = ({ 
  data, 
  title = "Confidence Trends" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = 600;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate scales
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const minTime = Math.min(...data.map(d => d.timestamp));
    const maxTime = Math.max(...data.map(d => d.timestamp));
    const timeRange = maxTime - minTime;
    
    const minConfidence = Math.min(...data.map(d => d.confidence));
    const maxConfidence = Math.max(...data.map(d => d.confidence));
    const confidenceRange = maxConfidence - minConfidence;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Draw confidence labels
      const confidence = maxConfidence - (confidenceRange * i) / 5;
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(confidence)}%`, padding - 5, y + 3);
    }

    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = padding + (chartWidth * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw confidence line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = padding + ((point.timestamp - minTime) / timeRange) * chartWidth;
      const y = padding + ((maxConfidence - point.confidence) / confidenceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw data points
    data.forEach((point) => {
      const x = padding + ((point.timestamp - minTime) / timeRange) * chartWidth;
      const y = padding + ((maxConfidence - point.confidence) / confidenceRange) * chartHeight;
      
      // Draw point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw label
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, x, y - 10);
    });

    // Draw axis labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Confidence (%)', 0, 0);
    ctx.restore();

  }, [data]);

  const getLatestConfidence = () => {
    if (data.length === 0) return 0;
    return data[data.length - 1].confidence;
  };

  const getConfidenceChange = () => {
    if (data.length < 2) return 0;
    return data[data.length - 1].confidence - data[0].confidence;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">
            {getLatestConfidence()}%
          </div>
          <div className={`text-sm ${getChangeColor(getConfidenceChange())}`}>
            {getChangeIcon(getConfidenceChange())} {Math.abs(getConfidenceChange())}%
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          className="border rounded-lg"
          style={{ width: '600px', height: '200px' }}
        />
      </div>
      
      {/* Recent triggers */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Recent Changes</h4>
        {data.slice(-3).reverse().map((point, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{point.label}</span>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">{point.trigger}</span>
              <span className="font-medium text-gray-800">{point.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfidenceTrends; 