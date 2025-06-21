import React, { useState } from 'react';

interface Precedent {
  caseName: string;
  citation: string;
  summary: string;
  claimantArgument: string;
  respondentArgument: string;
  tribunalReasoning: string;
  relevance: string;
}

interface InteractivePrecedentExplorerProps {
  precedents: Precedent[];
}

const InteractivePrecedentExplorer: React.FC<InteractivePrecedentExplorerProps> = ({ precedents }) => {
  const [selectedPrecedent, setSelectedPrecedent] = useState<Precedent | null>(precedents.length > 0 ? precedents[0] : null);

  const DetailCard = ({ title, content }: { title: string, content: string }) => (
    <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg">
      <h4 className="font-semibold text-primary-700 dark:text-primary-400 mb-2">{title}</h4>
      <p className="text-sm text-slate-700 dark:text-slate-300">{content}</p>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Precedent List */}
      <div className="md:w-1/3">
        <div className="space-y-2">
          {precedents.map((precedent) => (
            <button
              key={precedent.caseName}
              onClick={() => setSelectedPrecedent(precedent)}
              className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                selectedPrecedent?.caseName === precedent.caseName
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                  : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="font-bold">{precedent.caseName}</div>
              <div className="text-xs opacity-80">{precedent.citation}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Details View */}
      <div className="md:w-2/3">
        {selectedPrecedent && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedPrecedent.caseName}</h3>
            <DetailCard title="Summary" content={selectedPrecedent.summary} />
            <DetailCard title="Claimant's Argument" content={selectedPrecedent.claimantArgument} />
            <DetailCard title="Respondent's Argument" content={selectedPrecedent.respondentArgument} />
            <DetailCard title="Tribunal's Reasoning" content={selectedPrecedent.tribunalReasoning} />
            <DetailCard title="Relevance to Your Case" content={selectedPrecedent.relevance} />
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractivePrecedentExplorer; 