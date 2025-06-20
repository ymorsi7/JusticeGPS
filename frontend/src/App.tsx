import React, { useState, useEffect } from 'react';
import './index.css';

// Import all the new premium components
import FlowChart from './components/FlowChart';
import CaseTimeline from './components/CaseTimeline';
import ProgressTracker from './components/ProgressTracker';
import RadarChart from './components/RadarChart';
import ConfidenceTrends from './components/ConfidenceTrends';
import Confetti from './components/Confetti';
import SpeechOutput from './components/SpeechOutput';
import CounterStrategyGenerator from './components/CounterStrategyGenerator';
import InteractivePrecedentExplorer from './components/InteractivePrecedentExplorer';
import FormAutoFillPreview from './components/FormAutoFillPreview';
import ConfidenceBar from './components/ConfidenceBar';
import ExplainabilityToggle from './components/ExplainabilityToggle';

interface QueryResponse {
  answer: string;
  confidence: number;
  reasoning_chain: string[];
  flowchart: string | null;
  citations: string[];
  quality_metrics: {
    has_citations: boolean;
    has_structure: boolean;
    has_practical_guidance: boolean;
    is_complete: boolean;
    suggestions: string[];
  };
  sources: Array<{
    rule_number: string;
    heading: string;
    part: string;
    part_title: string;
    excerpt: string;
    score: number;
    full_text: string;
  }>;
  session_id: string;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<'civil_procedure' | 'arbitration'>('civil_procedure');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplainability, setShowExplainability] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [confidenceHistory, setConfidenceHistory] = useState<Array<{
    timestamp: number;
    confidence: number;
    label: string;
    trigger: string;
  }>>([]);

  // Civil Procedure specific state
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    id: string;
    title: string;
    date: string;
    ruleCitation?: string;
    description: string;
    status: 'completed' | 'pending' | 'overdue';
    daysFromStart: number;
  }>>([]);
  const [progressSteps, setProgressSteps] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
    deadline?: string;
    ruleCitation?: string;
    formLink?: string;
    mermaidNodeId?: string;
    priority: 'high' | 'medium' | 'low';
  }>>([]);
  const [formFields, setFormFields] = useState<Array<{
    id: string;
    label: string;
    value: string;
    type: 'text' | 'number' | 'date' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
  }>>([]);

  // Arbitration specific state
  const [radarMetrics, setRadarMetrics] = useState<Array<{
    name: string;
    value: number;
    color: string;
  }>>([]);
  const [precedents, setPrecedents] = useState<Array<{
    id: string;
    title: string;
    citation: string;
    relevance: number;
    content: string;
    keySentences: string[];
    date: string;
    jurisdiction: string;
  }>>([]);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          mode,
          session_id: Date.now().toString()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data);
        
        // Add to confidence history
        const newPoint = {
          timestamp: Date.now(),
          confidence: data.confidence,
          label: query.substring(0, 30) + '...',
          trigger: 'query submitted'
        };
        setConfidenceHistory(prev => [...prev, newPoint]);

        // Trigger confetti for high confidence
        if (data.confidence >= 90) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }

        // Generate timeline events for civil procedure
        if (mode === 'civil_procedure') {
          generateTimelineEvents(data);
          generateProgressSteps(data);
          generateFormFields(data);
        }

        // Generate radar metrics for arbitration
        if (mode === 'arbitration') {
          generateRadarMetrics(data);
          generatePrecedents(data);
        }
      }
    } catch (error) {
      console.error('Error submitting query:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimelineEvents = (_data: QueryResponse) => {
    const events = [
      {
        id: '1',
        title: 'Issue Claim Form',
        date: new Date().toLocaleDateString(),
        ruleCitation: 'CPR 7.5',
        description: 'Submit claim form to court',
        status: 'completed' as const,
        daysFromStart: 0
      },
      {
        id: '2',
        title: 'Serve Claim Form',
        date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        ruleCitation: 'CPR 7.5',
        description: 'Serve claim form on defendant within 4 months',
        status: 'pending' as const,
        daysFromStart: 120
      },
      {
        id: '3',
        title: 'Directions Hearing',
        date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        description: 'Case management conference',
        status: 'pending' as const,
        daysFromStart: 180
      }
    ];
    setTimelineEvents(events);
  };

  const generateProgressSteps = (_data: QueryResponse) => {
    const steps = [
      {
        id: '1',
        title: 'Issue Claim Form',
        description: 'Complete and submit claim form to court',
        status: 'completed' as const,
        ruleCitation: 'CPR 7.5',
        formLink: '/forms/n1',
        priority: 'high' as const
      },
      {
        id: '2',
        title: 'Serve on Defendant',
        description: 'Serve claim form within 4 months of issue',
        status: 'in-progress' as const,
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        ruleCitation: 'CPR 7.5',
        priority: 'high' as const
      },
      {
        id: '3',
        title: 'File Directions Questionnaire',
        description: 'Complete and file N181 form',
        status: 'not-started' as const,
        formLink: '/forms/n181',
        priority: 'medium' as const
      }
    ];
    setProgressSteps(steps);
  };

  const generateFormFields = (_data: QueryResponse) => {
    const fields = [
      {
        id: 'claimant',
        label: 'Claimant Name',
        value: 'John Smith',
        type: 'text' as const,
        required: true
      },
      {
        id: 'defendant',
        label: 'Defendant Name',
        value: 'ABC Company Ltd',
        type: 'text' as const,
        required: true
      },
      {
        id: 'amount',
        label: 'Claim Amount',
        value: '£75,000',
        type: 'text' as const,
        required: true
      },
      {
        id: 'track',
        label: 'Track',
        value: 'Multi-track',
        type: 'select' as const,
        required: true,
        options: ['Small claims', 'Fast track', 'Multi-track']
      }
    ];
    setFormFields(fields);
  };

  const generateRadarMetrics = (_data: QueryResponse) => {
    const metrics = [
      { name: 'Jurisdiction Strength', value: 85, color: '#3b82f6' },
      { name: 'Environmental Evidence', value: 72, color: '#10b981' },
      { name: 'Strategic Advantage', value: 68, color: '#f59e0b' },
      { name: 'Precedent Support', value: 91, color: '#ef4444' },
      { name: 'Weakness Risk', value: 35, color: '#8b5cf6' }
    ];
    setRadarMetrics(metrics);
  };

  const generatePrecedents = (_data: QueryResponse) => {
    const mockPrecedents = [
      {
        id: '1',
        title: 'Saluka v. Czech Republic',
        citation: 'PCA Case No. 2001-04',
        relevance: 0.92,
        content: 'This case established important principles regarding fair and equitable treatment in investment arbitration...',
        keySentences: [
          'The Tribunal finds that the Czech Republic violated the fair and equitable treatment standard.',
          'Discriminatory treatment without reasonable justification constitutes a breach of international law.'
        ],
        date: '2006',
        jurisdiction: 'PCA'
      }
    ];
    setPrecedents(mockPrecedents);
  };

  const handleCounterStrategy = async (strategyQuery: string) => {
    setQuery(strategyQuery);
    // This would trigger the same submit logic
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Confetti trigger={showConfetti} />
      
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                JusticeGPS
              </h1>
              
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('civil_procedure')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    mode === 'civil_procedure'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Civil Procedure
                </button>
                <button
                  onClick={() => setMode('arbitration')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    mode === 'arbitration'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Arbitration
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ExplainabilityToggle
                showExplainability={showExplainability}
                onToggle={() => setShowExplainability(!showExplainability)}
                darkMode={darkMode}
              />
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Query Input */}
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Ask your legal question
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === 'civil_procedure' 
                  ? "e.g., What is the deadline for serving a claim form under CPR 7.5?"
                  : "e.g., What are the key arguments in environmental investment disputes?"
                }
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'
                }`}
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {mode === 'civil_procedure' ? 'Civil Procedure Mode' : 'Arbitration Mode'}
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <span>Submit Query</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Response Section */}
        {response && (
          <div className="space-y-8">
            {/* Main Answer */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg border shadow-sm p-6`}>
              <div className="flex items-start justify-between mb-4">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Answer
                </h2>
                <ConfidenceBar confidence={response.confidence} />
              </div>
              
              <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <div dangerouslySetInnerHTML={{ __html: response.answer.replace(/\n/g, '<br>') }} />
              </div>
              
              {/* Speech Output */}
              <div className="mt-6">
                <SpeechOutput 
                  text={response.answer.replace(/<[^>]*>/g, '')} 
                  autoPlay={response.confidence >= 90}
                />
              </div>
            </div>

            {/* Mode-specific Components */}
            {mode === 'civil_procedure' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Interactive Flowchart */}
                <div>
                  <FlowChart
                    chartData={response.flowchart}
                    citations={response.citations}
                    onNodeClick={(nodeId, citation) => {
                      console.log('Clicked node:', nodeId, 'Citation:', citation);
                    }}
                  />
                </div>

                {/* Case Timeline */}
                <div>
                  <CaseTimeline events={timelineEvents} totalDays={365} />
                </div>

                {/* Progress Tracker */}
                <div>
                  <ProgressTracker
                    steps={progressSteps}
                    onStepClick={(step) => {
                      console.log('Clicked step:', step);
                    }}
                    onFormClick={(formLink) => {
                      console.log('Clicked form:', formLink);
                    }}
                  />
                </div>

                {/* Form Auto-Fill Preview */}
                <div>
                  <FormAutoFillPreview
                    formType="N1"
                    fields={formFields}
                    onFieldChange={(fieldId, value) => {
                      setFormFields(prev => 
                        prev.map(field => 
                          field.id === fieldId ? { ...field, value } : field
                        )
                      );
                    }}
                    onDownload={() => {
                      console.log('Downloading form...');
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div>
                  <RadarChart metrics={radarMetrics} />
                </div>

                {/* Confidence Trends */}
                <div>
                  <ConfidenceTrends data={confidenceHistory} />
                </div>

                {/* Counter Strategy Generator */}
                <div>
                  <CounterStrategyGenerator
                    currentStrategy={response.answer}
                    onGenerate={handleCounterStrategy}
                    isLoading={isLoading}
                  />
                </div>

                {/* Interactive Precedent Explorer */}
                <div>
                  <InteractivePrecedentExplorer
                    precedents={precedents}
                    onPrecedentClick={(precedent) => {
                      console.log('Selected precedent:', precedent);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sources and Citations */}
            {response.sources && response.sources.length > 0 && (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-lg border shadow-sm p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Sources & Citations
                </h3>
                <div className="space-y-4">
                  {response.sources.map((source, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-600">{source.rule_number}</span>
                        <span className="text-sm text-gray-500">Relevance: {Math.round(source.score * 100)}%</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{source.heading}</p>
                      <p className="text-xs text-gray-500">{source.part_title}</p>
                      <p className="text-sm text-gray-600 mt-2">{source.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App; 