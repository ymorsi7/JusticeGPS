import React, { useState } from 'react';

interface Precedent {
  id: string;
  title: string;
  citation: string;
  relevance: number;
  content: string;
  keySentences: string[];
  date: string;
  jurisdiction: string;
}

interface InteractivePrecedentExplorerProps {
  precedents: Precedent[];
  onPrecedentClick?: (precedent: Precedent) => void;
}

const InteractivePrecedentExplorer: React.FC<InteractivePrecedentExplorerProps> = ({
  precedents,
  onPrecedentClick
}) => {
  const [expandedPrecedent, setExpandedPrecedent] = useState<string | null>(null);
  const [selectedPrecedent, setSelectedPrecedent] = useState<Precedent | null>(null);

  const handlePrecedentClick = (precedent: Precedent) => {
    if (expandedPrecedent === precedent.id) {
      setExpandedPrecedent(null);
      setSelectedPrecedent(null);
    } else {
      setExpandedPrecedent(precedent.id);
      setSelectedPrecedent(precedent);
      onPrecedentClick?.(precedent);
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'bg-green-100 text-green-800';
    if (relevance >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const highlightKeySentences = (content: string, keySentences: string[]) => {
    let highlightedContent = content;
    keySentences.forEach(sentence => {
      const regex = new RegExp(`(${sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedContent = highlightedContent.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    return highlightedContent;
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Interactive Precedent Explorer</h3>
        <p className="text-sm text-gray-600 mt-1">
          Click on any precedent to view detailed analysis and key sentences
        </p>
      </div>

      <div className="divide-y">
        {precedents.map((precedent) => (
          <div key={precedent.id} className="transition-all duration-200">
            {/* Precedent Header */}
            <div
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handlePrecedentClick(precedent)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-800">{precedent.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRelevanceColor(precedent.relevance)}`}>
                      {Math.round(precedent.relevance * 100)}% relevant
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{precedent.citation}</span>
                    <span>{precedent.jurisdiction}</span>
                    <span>{precedent.date}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedPrecedent === precedent.id ? 'rotate-180' : ''
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedPrecedent === precedent.id && (
              <div className="px-4 pb-4 bg-gray-50">
                <div className="bg-white rounded-lg border p-4 space-y-4">
                  {/* Key Sentences */}
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Key Sentences</h5>
                    <div className="space-y-2">
                      {precedent.keySentences.map((sentence, index) => (
                        <div
                          key={index}
                          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="text-sm text-gray-700">
                            <span className="font-medium text-yellow-800">•</span> {sentence}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full Content */}
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Full Content</h5>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: highlightKeySentences(precedent.content, precedent.keySentences)
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 pt-3 border-t">
                    <button
                      onClick={() => onPrecedentClick?.(precedent)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <span>📋</span>
                      <span>Use in Analysis</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      <span>🔗</span>
                      <span>View Full Case</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Precedent Side Panel */}
      {selectedPrecedent && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l shadow-lg z-40 transform transition-transform">
          <div className="p-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Precedent Details</h3>
              <button
                onClick={() => setSelectedPrecedent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">{selectedPrecedent.title}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Citation:</strong> {selectedPrecedent.citation}</div>
                  <div><strong>Jurisdiction:</strong> {selectedPrecedent.jurisdiction}</div>
                  <div><strong>Date:</strong> {selectedPrecedent.date}</div>
                  <div><strong>Relevance:</strong> {Math.round(selectedPrecedent.relevance * 100)}%</div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-800 mb-2">Key Legal Principles</h5>
                <div className="space-y-2">
                  {selectedPrecedent.keySentences.map((sentence, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-gray-700">{sentence}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractivePrecedentExplorer; 