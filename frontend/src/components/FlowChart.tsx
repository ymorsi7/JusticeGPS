import React, { useEffect, useRef } from 'react';

interface FlowChartProps {
  mermaidCode: string;
  darkMode: boolean;
}

const FlowChart: React.FC<FlowChartProps> = ({ mermaidCode, darkMode }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mermaidCode || !ref.current) return;

    // Dynamically import mermaid
    const loadMermaid = async () => {
      try {
        const mermaid = await import('mermaid');
        
        // Configure mermaid for dark/light mode
        mermaid.default.initialize({
          startOnLoad: false,
          theme: darkMode ? 'dark' : 'default',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 50,
            rankSpacing: 50,
          },
          themeVariables: darkMode ? {
            primaryColor: '#3b82f6',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#1d4ed8',
            lineColor: '#6b7280',
            secondaryColor: '#1f2937',
            tertiaryColor: '#374151',
            background: '#111827',
            nodeTextColor: '#ffffff',
            clusterBkg: '#1f2937',
            clusterBorder: '#374151',
            defaultLinkColor: '#6b7280',
            titleColor: '#ffffff',
            edgeLabelBackground: '#1f2937',
            mainBkg: '#1f2937',
            errorBkgColor: '#dc2626',
            errorTextColor: '#ffffff',
          } : {
            primaryColor: '#3b82f6',
            primaryTextColor: '#000000',
            primaryBorderColor: '#1d4ed8',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#e5e7eb',
            background: '#ffffff',
            nodeTextColor: '#000000',
            clusterBkg: '#f9fafb',
            clusterBorder: '#d1d5db',
            defaultLinkColor: '#6b7280',
            titleColor: '#000000',
            edgeLabelBackground: '#f9fafb',
            mainBkg: '#ffffff',
            errorBkgColor: '#fef2f2',
            errorTextColor: '#dc2626',
          }
        });

        // Clear previous content
        if (ref.current) {
          ref.current.innerHTML = '';
        }

        // Render the flowchart
        const { svg } = await mermaid.default.render('flowchart', mermaidCode);
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error loading mermaid:', error);
        // Fallback: display the mermaid code as text
        if (ref.current) {
          ref.current.innerHTML = `
            <div class="p-4 border rounded bg-gray-100">
              <p class="text-sm text-gray-600 mb-2">Flowchart could not be rendered. Mermaid code:</p>
              <pre class="text-xs overflow-x-auto">${mermaidCode}</pre>
            </div>
          `;
        }
      }
    };

    loadMermaid();
  }, [mermaidCode, darkMode]);

  return (
    <div className="w-full overflow-x-auto">
      <div 
        ref={ref} 
        className="flex justify-center"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};

export default FlowChart; 