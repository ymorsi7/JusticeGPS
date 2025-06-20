import React from 'react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  deadline?: string;
  ruleCitation?: string;
  formLink?: string;
  mermaidNodeId?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  onStepClick?: (step: ProgressStep) => void;
  onFormClick?: (formLink: string) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  steps, 
  onStepClick, 
  onFormClick 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'in-progress':
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      case 'blocked':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'blocked': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Tracker</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`border-l-4 ${getPriorityColor(step.priority)} bg-gray-50 p-4 rounded-r-lg hover:bg-gray-100 transition-colors cursor-pointer`}
            onClick={() => onStepClick?.(step)}
          >
            <div className="flex items-start space-x-4">
              {getStatusIcon(step.status)}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">
                    Step {index + 1}: {step.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {step.ruleCitation && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {step.ruleCitation}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      step.status === 'blocked' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {step.deadline && (
                      <span className="text-xs text-gray-500">
                        Deadline: {step.deadline}
                      </span>
                    )}
                    {step.mermaidNodeId && (
                      <span className="text-xs text-blue-600 hover:text-blue-800">
                        📊 View in flowchart
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {step.formLink && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFormClick?.(step.formLink!);
                        }}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                      >
                        📄 View Form
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Progress Summary */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Progress: {steps.filter(s => s.status === 'completed').length} of {steps.length} steps
          </span>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ 
                width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker; 