import React from 'react';

interface ExplainabilityToggleProps {
  showExplainability: boolean;
  onToggle: () => void;
  darkMode: boolean;
}

const ExplainabilityToggle: React.FC<ExplainabilityToggleProps> = ({ showExplainability, onToggle, darkMode }) => {
  return (
    <button onClick={onToggle} className={darkMode ? 'dark-toggle' : 'light-toggle'}>
      {showExplainability ? 'Hide Explainability' : 'Show Explainability'}
    </button>
  );
};

export default ExplainabilityToggle; 