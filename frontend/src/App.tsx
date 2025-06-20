import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FlowChart from './components/FlowChart';
import PdfPreview from './components/PdfPreview';
import ConfidenceBar from './components/ConfidenceBar';
import ExplainabilityToggle from './components/ExplainabilityToggle';

interface QueryResponse {
  answer: string;
  confidence: number;
  sources: Array<{
    title: string;
    content: string;
    type: string;
  }>;
  flowchart?: string;
  reasoning_chain: string[];
  session_id: string;
}

interface Mode {
  id: string;
  name: string;
  description: string;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<string>('civil_procedure');
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showExplainability, setShowExplainability] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);

  useEffect(() => {
    // Generate session ID
    setSessionId(`session_${Date.now()}`);
    
    // Load sample questions
    loadSampleQuestions();
  }, [mode]);

  const loadSampleQuestions = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/sample-questions/${mode}`);
      const data = await response.json();
      setSampleQuestions(data.questions);
    } catch (error) {
      console.error('Error loading sample questions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          mode: mode,
          session_id: sessionId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data);
      } else {
        console.error('Error submitting query');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  const handleSampleQuestion = (question: string) => {
    setQuery(question);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Router>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              JusticeGPS
            </h1>
            <p className="text-lg opacity-80">
              AI-Powered Legal Analysis Assistant
            </p>
            
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`mt-4 px-4 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </header>

          {/* Mode Selection */}
          <div className="mb-8">
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setMode('civil_procedure')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  mode === 'civil_procedure'
                    ? 'bg-blue-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                UK Civil Procedure
              </button>
              <button
                onClick={() => setMode('arbitration_strategy')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  mode === 'arbitration_strategy'
                    ? 'bg-purple-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Arbitration Strategy
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            {/* Query Form */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Ask about ${mode === 'civil_procedure' ? 'UK Civil Procedure Rules' : 'arbitration strategy'}...`}
                    className={`w-full p-4 rounded-lg border resize-none ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      loading || !query.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : mode === 'civil_procedure'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </button>
                  <button
                    type="button"
                    onClick={startVoiceRecognition}
                    disabled={isListening}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isListening
                        ? 'bg-red-600 text-white'
                        : darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    {isListening ? '🎤 Listening...' : '🎤 Voice'}
                  </button>
                </div>
              </div>
            </form>

            {/* Sample Questions */}
            {sampleQuestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Sample Questions:</h3>
                <div className="flex flex-wrap gap-2">
                  {sampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuestion(question)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Response */}
            {response && (
              <div className={`rounded-lg p-6 mb-6 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                {/* Confidence Bar */}
                <div className="mb-4">
                  <ConfidenceBar confidence={response.confidence} />
                </div>

                {/* Explainability Toggle */}
                <div className="mb-4">
                  <ExplainabilityToggle
                    showExplainability={showExplainability}
                    onToggle={() => setShowExplainability(!showExplainability)}
                    darkMode={darkMode}
                  />
                </div>

                {/* Answer */}
                <div className="prose prose-invert max-w-none mb-6">
                  <div 
                    className={`markdown-content ${
                      darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}
                    dangerouslySetInnerHTML={{ 
                      __html: response.answer.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                    }}
                  />
                </div>

                {/* Flowchart */}
                {response.flowchart && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Procedural Flowchart:</h3>
                    <FlowChart mermaidCode={response.flowchart} darkMode={darkMode} />
                  </div>
                )}

                {/* Explainability Panel */}
                {showExplainability && (
                  <div className={`rounded-lg p-4 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <h3 className="text-lg font-semibold mb-3">Analysis Details:</h3>
                    
                    {/* Sources */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Sources:</h4>
                      <div className="space-y-2">
                        {response.sources.map((source, index) => (
                          <div key={index} className={`p-2 rounded ${
                            darkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            <div className="font-medium">{source.title}</div>
                            <div className="text-sm opacity-80">{source.content.substring(0, 200)}...</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reasoning Chain */}
                    <div>
                      <h4 className="font-semibold mb-2">Reasoning Chain:</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        {response.reasoning_chain.map((step, index) => (
                          <li key={index} className="text-sm">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PDF Preview Placeholder */}
            {mode === 'civil_procedure' && (
              <div className={`rounded-lg p-6 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <h3 className="text-lg font-semibold mb-3">Court Forms Preview:</h3>
                <PdfPreview 
                  formType="N181" 
                  darkMode={darkMode}
                />
              </div>
            )}

            {/* Arbitration Heatmap Placeholder */}
            {mode === 'arbitration_strategy' && (
              <div className={`rounded-lg p-6 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <h3 className="text-lg font-semibold mb-3">Precedent Analysis:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        darkMode ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <th className="text-left p-2">Case</th>
                        <th className="text-left p-2">Outcome</th>
                        <th className="text-left p-2">Support</th>
                        <th className="text-left p-2">Key Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b ${
                        darkMode ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <td className="p-2">Burlington v. Ecuador</td>
                        <td className="p-2">Counterclaim Accepted</td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded text-xs bg-red-500 text-white">Adverse</span>
                        </td>
                        <td className="p-2">Environmental damages</td>
                      </tr>
                      <tr className={`border-b ${
                        darkMode ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <td className="p-2">Perenco v. Ecuador</td>
                        <td className="p-2">Counterclaim Dismissed</td>
                        <td className="p-2">
                          <span className="px-2 py-1 rounded text-xs bg-green-500 text-white">Supportive</span>
                        </td>
                        <td className="p-2">Evidence standards</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Router>
    </div>
  );
};

export default App; 