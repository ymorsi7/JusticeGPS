import React, { useState } from 'react';

interface FloatingActionButtonProps {
  onQuickQuery?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onQuickQuery,
  onHelp,
  onSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Quick action buttons */}
      <div className={`flex flex-col space-y-3 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {onQuickQuery && (
          <button
            onClick={onQuickQuery}
            className="glass-card w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Quick Query"
          >
            <span className="text-lg">⚡</span>
          </button>
        )}
        
        {onHelp && (
          <button
            onClick={onHelp}
            className="glass-card w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Help"
          >
            <span className="text-lg">❓</span>
          </button>
        )}
        
        {onSettings && (
          <button
            onClick={onSettings}
            className="glass-card w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            title="Settings"
          >
            <span className="text-lg">⚙️</span>
          </button>
        )}
      </div>

      {/* Main FAB */}
      <button
        onClick={toggleMenu}
        className={`glass-card w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-gradient-secondary rotate-45' : 'bg-gradient-primary hover:scale-110'
        }`}
        title={isOpen ? 'Close' : 'Quick Actions'}
      >
        <span className="text-white text-xl font-bold">
          {isOpen ? '×' : '+'}
        </span>
      </button>
    </div>
  );
};

export default FloatingActionButton; 