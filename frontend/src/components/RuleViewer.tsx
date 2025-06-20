import React from 'react';
import ReactMarkdown from 'react-markdown';

interface RuleViewerProps {
  rule: any;
  isOpen: boolean;
  onClose: () => void;
}

const RuleViewer: React.FC<RuleViewerProps> = ({ rule, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl h-full overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                CPR {rule.rule_number} - {rule.heading}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Part {rule.part}: {rule.part_title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Relevance Score: {rule.score}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{rule.full_text}</ReactMarkdown>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Context Excerpt
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <ReactMarkdown>{rule.excerpt}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleViewer; 