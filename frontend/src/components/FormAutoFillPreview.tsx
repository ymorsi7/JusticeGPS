import React, { useState } from 'react';

interface FormField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
}

interface FormAutoFillPreviewProps {
  formType: 'N1' | 'N181' | 'N244';
  fields: FormField[];
  onFieldChange?: (fieldId: string, value: string) => void;
  onDownload?: () => void;
}

const FormAutoFillPreview: React.FC<FormAutoFillPreviewProps> = ({
  formType,
  fields,
  onFieldChange,
  onDownload
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const getFormTitle = () => {
    switch (formType) {
      case 'N1': return 'Claim Form (N1)';
      case 'N181': return 'Directions Questionnaire (N181)';
      case 'N244': return 'Application Notice (N244)';
      default: return 'Form Preview';
    }
  };

  const renderField = (field: FormField) => {
    const commonClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";
    
    if (isEditing) {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              value={field.value}
              onChange={(e) => onFieldChange?.(field.id, e.target.value)}
              className={`${commonClasses} resize-none`}
              rows={3}
              placeholder={field.label}
            />
          );
        case 'select':
          return (
            <select
              value={field.value}
              onChange={(e) => onFieldChange?.(field.id, e.target.value)}
              className={commonClasses}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        case 'date':
          return (
            <input
              type="date"
              value={field.value}
              onChange={(e) => onFieldChange?.(field.id, e.target.value)}
              className={commonClasses}
            />
          );
        case 'number':
          return (
            <input
              type="number"
              value={field.value}
              onChange={(e) => onFieldChange?.(field.id, e.target.value)}
              className={commonClasses}
              placeholder={field.label}
            />
          );
        default:
          return (
            <input
              type="text"
              value={field.value}
              onChange={(e) => onFieldChange?.(field.id, e.target.value)}
              className={commonClasses}
              placeholder={field.label}
            />
          );
      }
    } else {
      return (
        <div className={`px-3 py-2 border rounded-lg bg-gray-50 ${field.value ? 'text-gray-900' : 'text-gray-500 italic'}`}>
          {field.value || `[${field.label}]`}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{getFormTitle()}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isEditing ? 'Edit form fields below' : 'Preview of auto-filled form'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                isEditing 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isEditing ? 'Preview' : 'Edit'}
            </button>
            
            {!isEditing && (
              <button
                onClick={onDownload}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📄 Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {fields.filter(f => f.required && !f.value).length} required fields remaining
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="mt-6 pt-6 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Form Auto-Fill Complete</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This form has been pre-filled based on your case details. You can edit any fields 
                    or download the completed form as a PDF.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormAutoFillPreview; 