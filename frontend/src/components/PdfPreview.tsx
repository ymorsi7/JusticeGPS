import React, { useState } from 'react';

interface PdfPreviewProps {
  formType: string;
  darkMode: boolean;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ formType, darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState<number>(1);

  // Mock form data - in a real implementation, this would load actual PDF forms
  const getFormContent = (formType: string) => {
    switch (formType) {
      case 'N181':
        return {
          title: 'Form N181 - Directions Questionnaire',
          content: `
            <div class="form-preview">
              <div class="form-header">
                <h3>Form N181 - Directions Questionnaire</h3>
                <p>Civil Procedure Rules 1998, Rule 26.3</p>
              </div>
              
              <div class="form-section">
                <h4>Part A: Case Information</h4>
                <div class="form-field">
                  <label>Claim Number:</label>
                  <input type="text" placeholder="Enter claim number" disabled />
                </div>
                <div class="form-field">
                  <label>Claimant(s):</label>
                  <input type="text" placeholder="Enter claimant name(s)" disabled />
                </div>
                <div class="form-field">
                  <label>Defendant(s):</label>
                  <input type="text" placeholder="Enter defendant name(s)" disabled />
                </div>
              </div>
              
              <div class="form-section">
                <h4>Part B: Track Allocation</h4>
                <div class="radio-group">
                  <label>
                    <input type="radio" name="track" value="small" disabled />
                    Small Claims Track (up to £10,000)
                  </label>
                  <label>
                    <input type="radio" name="track" value="fast" disabled />
                    Fast Track (£10,000 - £25,000)
                  </label>
                  <label>
                    <input type="radio" name="track" value="multi" disabled />
                    Multi-Track (over £25,000)
                  </label>
                </div>
              </div>
              
              <div class="form-section">
                <h4>Part C: Case Management</h4>
                <div class="form-field">
                  <label>Estimated trial length:</label>
                  <select disabled>
                    <option>Select duration</option>
                    <option>1 day or less</option>
                    <option>1-3 days</option>
                    <option>3-5 days</option>
                    <option>Over 5 days</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Expert evidence required:</label>
                  <select disabled>
                    <option>Select option</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </div>
            </div>
          `
        };
      
      case 'N244':
        return {
          title: 'Form N244 - Application Notice',
          content: `
            <div class="form-preview">
              <div class="form-header">
                <h3>Form N244 - Application Notice</h3>
                <p>Civil Procedure Rules 1998, Part 23</p>
              </div>
              
              <div class="form-section">
                <h4>Application Details</h4>
                <div class="form-field">
                  <label>What order are you asking the court to make?</label>
                  <textarea placeholder="Describe the order you are seeking" disabled></textarea>
                </div>
                <div class="form-field">
                  <label>Why are you asking for this order?</label>
                  <textarea placeholder="Explain your reasons" disabled></textarea>
                </div>
              </div>
            </div>
          `
        };
      
      default:
        return {
          title: 'Court Form Preview',
          content: `
            <div class="form-preview">
              <p>Form preview not available for ${formType}</p>
            </div>
          `
        };
    }
  };

  const formData = getFormContent(formType);

  return (
    <div className={`border rounded-lg overflow-hidden ${
      darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
    }`}>
      <div className={`p-4 border-b ${
        darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
      }`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{formData.title}</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              darkMode 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      
      <div className={`transition-all duration-300 ${
        isExpanded ? 'max-h-96' : 'max-h-32'
      } overflow-hidden`}>
        <div 
          className={`p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
          dangerouslySetInnerHTML={{ __html: formData.content }}
        />
      </div>
      
      {!isExpanded && (
        <div className={`p-4 border-t ${
          darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        }`}>
          <p className="text-sm opacity-80">
            Click "Expand" to view the full form. This is a preview of the {formType} court form.
          </p>
        </div>
      )}
    </div>
  );
};

export default PdfPreview; 