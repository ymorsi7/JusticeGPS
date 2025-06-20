import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface FlowChartProps {
  chartData: string | null;
  onNodeClick?: (nodeId: string, ruleCitation: string) => void;
  citations?: string[];
}

const FlowChart: React.FC<FlowChartProps> = ({ chartData, onNodeClick, citations = [] }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  useEffect(() => {
    if (chartData && chartRef.current) {
      setIsLoading(true);

      // Clean up the chart data from markdown fences
      let cleanChartData = chartData.trim();
      const match = /^```(?:mermaid)?\s*\n(.*)\n\s*```$/s.exec(cleanChartData);
      if (match && match[1]) {
        cleanChartData = match[1].trim();
      }

      mermaid.render('flowchart', cleanChartData).then(({ svg }) => {
        if (chartRef.current) {
          chartRef.current.innerHTML = svg;
          
          // Add interactive functionality
          const nodes = chartRef.current.querySelectorAll('.node');
          nodes.forEach((node, index) => {
            const nodeElement = node as HTMLElement;
            const nodeId = nodeElement.id;
            const citation = citations[index] || '';
            
            nodeElement.style.cursor = 'pointer';
            nodeElement.style.transition = 'all 0.3s ease';
            
            nodeElement.addEventListener('click', () => {
              if (onNodeClick) {
                onNodeClick(nodeId, citation);
              }
            });
            
            nodeElement.addEventListener('mouseenter', () => {
              setHoveredNode(nodeId);
              nodeElement.style.transform = 'scale(1.05)';
              nodeElement.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
            });
            
            nodeElement.addEventListener('mouseleave', () => {
              setHoveredNode(null);
              nodeElement.style.transform = 'scale(1)';
              nodeElement.style.filter = 'none';
            });
          });
        }
        setIsLoading(false);
      });
    }
  }, [chartData, citations, onNodeClick]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-500">Flowchart will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {hoveredNode && (
        <div className="absolute top-0 right-0 bg-white p-3 rounded-lg shadow-lg border z-20 max-w-xs">
          <div className="text-sm font-semibold text-gray-700 mb-1">Rule Citation</div>
          <div className="text-xs text-gray-600">{citations.find((_, i) => `node${i}` === hoveredNode) || 'No citation available'}</div>
        </div>
      )}
      
      <div 
        ref={chartRef} 
        className="bg-white p-4 rounded-lg border shadow-sm overflow-auto"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
};

export default FlowChart; 