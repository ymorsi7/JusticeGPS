import React, { useEffect, useState } from 'react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  show: boolean;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  message, 
  type, 
  duration = 5000, 
  onClose, 
  show 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  const typeConfig = {
    success: {
      icon: '✅',
      bg: 'bg-gradient-success',
      border: 'border-success-200',
      text: 'text-success-800',
      darkText: 'dark:text-success-200'
    },
    warning: {
      icon: '⚠️',
      bg: 'bg-gradient-warning',
      border: 'border-warning-200',
      text: 'text-warning-800',
      darkText: 'dark:text-warning-200'
    },
    error: {
      icon: '❌',
      bg: 'bg-gradient-error',
      border: 'border-error-200',
      text: 'text-error-800',
      darkText: 'dark:text-error-200'
    },
    info: {
      icon: 'ℹ️',
      bg: 'bg-gradient-primary',
      border: 'border-primary-200',
      text: 'text-primary-800',
      darkText: 'dark:text-primary-200'
    }
  };

  const config = typeConfig[type];

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`glass-card p-4 min-w-[300px] transform transition-all duration-300 ${
          isVisible 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm">{config.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${config.text} ${config.darkText}`}>
              {message}
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors duration-200"
          >
            <span className="text-slate-600 dark:text-slate-300 text-xs">×</span>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full ${config.bg} rounded-full transition-all duration-300 ease-linear`}
            style={{ 
              width: isVisible ? '0%' : '100%',
              transition: `width ${duration}ms linear`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationToast; 