import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  variant = 'primary' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'border-primary-500',
    secondary: 'border-secondary-500',
    success: 'border-success-500',
    warning: 'border-warning-500',
    error: 'border-error-500'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        {/* Main spinner */}
        <div 
          className={`${sizeClasses[size]} border-2 border-slate-200 dark:border-slate-700 rounded-full animate-spin`}
        >
          <div 
            className={`absolute inset-0 border-2 border-transparent border-t-current rounded-full ${variantClasses[variant]}`}
          />
        </div>
        
        {/* Pulsing ring effect */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-t-current rounded-full ${variantClasses[variant]} animate-pulse opacity-30`}
          style={{ animationDelay: '0.5s' }}
        />
        
        {/* Outer glow ring */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-t-current rounded-full ${variantClasses[variant]} animate-pulse opacity-20`}
          style={{ animationDelay: '1s' }}
        />
      </div>
      
      {text && (
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {text}
          </p>
          <div className="flex space-x-1 mt-2 justify-center">
            <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner; 