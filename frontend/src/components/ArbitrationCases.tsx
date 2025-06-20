import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ArbitrationCase {
  case_name: string;
  citation: string;
  summary: string;
  supportive: boolean | null;
  markdown_text: string;
  full_text: string;
  score?: number;
  excerpt?: string;
}

interface ArbitrationCasesProps {
  cases: ArbitrationCase[];
  onCaseClick: (caseData: ArbitrationCase) => void;
}

const ArbitrationCases: React.FC<ArbitrationCasesProps> = ({ cases, onCaseClick }) => {
  const [selectedCase, setSelectedCase] = useState<ArbitrationCase | null>(null);
  const [filter, setFilter] = useState<string>('');

  const filteredCases = cases.filter((caseData: ArbitrationCase) => {
    return (
      caseData.case_name.toLowerCase().includes(filter.toLowerCase()) ||
      caseData.summary.toLowerCase().includes(filter.toLowerCase())
    );
  });

  const handleCaseClick = (caseData: ArbitrationCase) => {
    setSelectedCase(caseData);
    onCaseClick(caseData);
  };

  const getSupportiveColor = (supportive: boolean | null) => {
    if (supportive === true) return 'bg-green-100 border-green-300';
    if (supportive === false) return 'bg-red-100 border-red-300';
    return 'bg-gray-100 border-gray-300';
  };

  const getSupportiveText = (supportive: boolean | null) => {
    if (supportive === true) return '✅ Supportive';
    if (supportive === false) return '❌ Adverse';
    return '⚖️ Neutral';
  };

  return (
    <div className="w-full">
      {/* Filters and Search */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('supportive')}
            className={`px-3 py-1 rounded ${filter === 'supportive' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            Supportive
          </button>
          <button
            onClick={() => setFilter('adverse')}
            className={`px-3 py-1 rounded ${filter === 'adverse' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          >
            Adverse
          </button>
          <button
            onClick={() => setFilter('neutral')}
            className={`px-3 py-1 rounded ${filter === 'neutral' ? 'bg-gray-500 text-white' : 'bg-gray-200'}`}
          >
            Neutral
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search cases..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded"
        />
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left">Case Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Citation</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Supportive</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Score</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((caseData: ArbitrationCase, index: number) => (
              <tr 
                key={index} 
                className={`hover:bg-gray-50 cursor-pointer ${getSupportiveColor(caseData.supportive)}`}
                onClick={() => handleCaseClick(caseData)}
              >
                <td className="border border-gray-300 px-4 py-2 font-medium">
                  {caseData.case_name}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  {caseData.citation}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  {caseData.status}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    caseData.supportive === true ? 'bg-green-200 text-green-800' :
                    caseData.supportive === false ? 'bg-red-200 text-red-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {getSupportiveText(caseData.supportive)}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(caseData.score * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{caseData.score?.toFixed(2) || 'N/A'}</span>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCaseClick(caseData);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Case Details Side Panel */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-full overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{selectedCase.case_name}</h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Citation:</strong> {selectedCase.citation}</p>
                <p><strong>Status:</strong> {selectedCase.status}</p>
                <p><strong>Institution:</strong> {selectedCase.institution}</p>
                <p><strong>Relevance Score:</strong> {selectedCase.score?.toFixed(3) || 'N/A'}</p>
                <p><strong>Supportive:</strong> {getSupportiveText(selectedCase.supportive)}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{selectedCase.full_text}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArbitrationCases; 