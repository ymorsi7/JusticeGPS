import React, { useState } from 'react';

interface CounterStrategyGeneratorProps {
  currentStrategy: string;
  onGenerate: (query: string) => Promise<void>;
  isLoading?: boolean;
}

const CounterStrategyGenerator: React.FC<CounterStrategyGeneratorProps> = ({
  currentStrategy,
  onGenerate,
  isLoading = false
}) => {
  const [showGenerator, setShowGenerator] = useState(false);

  const handleGenerate = () => {
    const query = `Generate a counter-strategy to the following arbitration approach: ${currentStrategy}. Provide a stronger alternative with specific legal citations and reasoning.`;
    onGenerate(query);
    setShowGenerator(false);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Counter-Strategy Generator</h3>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>⚡</span>
          <span>Generate Counter-Strategy</span>
        </button>
      </div>

      {showGenerator && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800 mb-2">Generate Alternative Strategy</h4>
              <p className="text-sm text-gray-600 mb-3">
                This will analyze your current approach and suggest a stronger alternative strategy 
                with specific legal citations and reasoning.
              </p>
              
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500 mb-1">Current Strategy:</div>
                <div className="text-sm text-gray-700 line-clamp-3">
                  {currentStrategy}
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Generate Strategy</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowGenerator(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showGenerator && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⚡</div>
          <p className="text-sm">
            Click the button above to generate a counter-strategy to your current approach
          </p>
        </div>
      )}
    </div>
  );
};

export default CounterStrategyGenerator; 