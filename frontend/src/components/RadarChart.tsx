import React, { useEffect, useRef } from 'react';

interface RadarMetric {
  name: string;
  value: number; // 0-100
  color: string;
}

interface RadarChartProps {
  metrics: RadarMetric[];
  title?: string;
  chanceOfSuccess: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ metrics, title = "Argument Strength Analysis", chanceOfSuccess }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || metrics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 40;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circles
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axis lines
    const angleStep = (2 * Math.PI) / metrics.length;
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    
    metrics.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Draw metric labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    metrics.forEach((metric, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      ctx.fillText(metric.name, x, y);
    });

    // Draw radar area
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    metrics.forEach((metric, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const valueRadius = (radius * metric.value) / 100;
      const x = centerX + valueRadius * Math.cos(angle);
      const y = centerY + valueRadius * Math.sin(angle);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    metrics.forEach((metric, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const valueRadius = (radius * metric.value) / 100;
      const x = centerX + valueRadius * Math.cos(angle);
      const y = centerY + valueRadius * Math.sin(angle);
      
      ctx.fillStyle = metric.color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw value labels
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.fillText(`${metric.value}%`, x, y - 15);
    });

  }, [metrics]);

  const getAverageScore = () => {
    return Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(getAverageScore())}`}>
            {getAverageScore()}%
          </div>
          <div className="text-xs text-gray-500">Average Score</div>
        </div>
      </div>
      
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          className="border rounded-lg"
          style={{ width: '300px', height: '300px' }}
        />
      </div>

      {/* Chance of Success Gauge */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-gray-700">Chance of Success</span>
          <span className={`text-lg font-bold ${getScoreColor(chanceOfSuccess)}`}>{chanceOfSuccess}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getScoreColor(chanceOfSuccess).replace('text-', 'bg-')}`} 
            style={{ width: `${chanceOfSuccess}%` }}
          ></div>
        </div>
      </div>
      
      {/* Metrics Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: metric.color }}
            />
            <span className="text-sm text-gray-700">{metric.name}</span>
            <span className="text-sm font-medium text-gray-900 ml-auto">
              {metric.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChart; 