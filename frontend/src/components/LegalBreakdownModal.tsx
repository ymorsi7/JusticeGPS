import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

interface BreakdownData {
  global_summary: string;
  claimant_arguments: string;
  respondent_arguments: string;
  tribunal_reasoning: string;
}

interface LegalBreakdownModalProps {
  show: boolean;
  onClose: () => void;
  caseName: string;
  breakdown: BreakdownData | null;
  isLoading: boolean;
}

const LegalBreakdownModal: React.FC<LegalBreakdownModalProps> = ({ show, onClose, caseName, breakdown, isLoading }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-inherit rounded-t-2xl">
              <h2 className="text-2xl font-bold gradient-text">{caseName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Detailed Case Analysis</p>
            </header>
            
            <div className="p-8 overflow-y-auto flex-grow">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <LoadingSpinner text="Analyzing case..." />
                  <p className="mt-4 text-slate-500 dark:text-slate-400">This may take a moment...</p>
                </div>
              )}

              {breakdown && !isLoading && (
                <div className="space-y-8">
                  <Section title="Global Summary" content={breakdown.global_summary} icon="🌍" />
                  <Section title="Claimant's Arguments" content={breakdown.claimant_arguments} icon="🗣️" />
                  <Section title="Respondent's Arguments" content={breakdown.respondent_arguments} icon="👂" />
                  <Section title="Tribunal's Reasoning" content={breakdown.tribunal_reasoning} icon="⚖️" />
                </div>
              )}
            </div>

            <footer className="p-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-inherit rounded-b-2xl">
              <button
                onClick={onClose}
                className="btn-primary w-full"
              >
                Close
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Section: React.FC<{ title: string; content: string; icon: string }> = ({ title, content, icon }) => (
  <div>
    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center">
      <span className="text-2xl mr-3">{icon}</span>
      {title}
    </h3>
    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  </div>
);

export default LegalBreakdownModal; 