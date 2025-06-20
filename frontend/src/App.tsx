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
import LoadingSpinner from './components/LoadingSpinner';
import NotificationToast from './components/NotificationToast';
import ParticleBackground from './components/ParticleBackground';
import FloatingActionButton from './components/FloatingActionButton';

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
  const [mode, setMode] = useState<'civil_procedure' | 'arbitration_strategy'>('civil_procedure');
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

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

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

  const showNotification = (message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    showNotification('Processing your query...', 'info');
    
    try {
      const response = await fetch('http://localhost:8000/api/query', {
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

        // Show success notification
        showNotification('Analysis complete!', 'success');

        // Trigger confetti for high confidence
        if (data.confidence >= 90) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          showNotification('Excellent confidence level! 🎉', 'success');
        }

        // Generate timeline events for civil procedure
        if (mode === 'civil_procedure') {
          generateTimelineEvents(data);
          generateProgressSteps(data);
          generateFormFields(data);
        }

        // Generate radar metrics for arbitration
        if (mode === 'arbitration_strategy') {
          generateRadarMetrics(data);
          generatePrecedents(data);
        }
      } else {
        showNotification('Failed to process query. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      showNotification('Network error. Please check your connection.', 'error');
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

  const handleQuickQuery = () => {
    const quickQueries = [
      "What is the deadline for serving a claim form?",
      "How do I apply for summary judgment?",
      "What are the key steps in arbitration?",
      "How to challenge an arbitration award?"
    ];
    const randomQuery = quickQueries[Math.floor(Math.random() * quickQueries.length)];
    setQuery(randomQuery);
    showNotification('Quick query loaded! Click submit to analyze.', 'info');
  };

  const handleHelp = () => {
    showNotification('Help documentation coming soon! 📚', 'info');
  };

  const handleSettings = () => {
    showNotification('Settings panel coming soon! ⚙️', 'info');
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'dark' : ''}`}>
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-secondary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-200"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-400"></div>
      </div>

      {/* Confetti Overlay */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Notification Toast */}
      <NotificationToast
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={hideNotification}
        duration={4000}
      />

      {/* Header */}
      <header className="relative z-10">
        <div className="glass-card mx-4 mt-4 mb-8">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-effect">
                  <span className="text-white text-xl font-bold">⚖️</span>
                </div>
                <h1 className="text-2xl font-bold gradient-text">
                  JusticeGPS
                </h1>
              </div>
              
              {/* Mode Toggle */}
              <div className="glass-card p-1">
                <div className="flex bg-white/20 dark:bg-slate-700/20 rounded-lg p-1">
                  <button
                    onClick={() => setMode('civil_procedure')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      mode === 'civil_procedure'
                        ? 'bg-gradient-primary text-white shadow-lg transform scale-105'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>📋</span>
                      <span>Civil Procedure</span>
                    </span>
                  </button>
                  <button
                    onClick={() => setMode('arbitration_strategy')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      mode === 'arbitration_strategy'
                        ? 'bg-gradient-secondary text-white shadow-lg transform scale-105'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>⚖️</span>
                      <span>Arbitration</span>
                    </span>
                  </button>
                </div>
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
                className="glass-card p-3 hover:scale-110 transition-all duration-300"
              >
                <span className="text-xl">
                  {darkMode ? '☀️' : '🌙'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Query Input */}
        <div className="mb-8 animate-fade-in-up">
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="query" className="block text-lg font-semibold mb-3 text-slate-700 dark:text-slate-200">
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
                  className="input-modern resize-none"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="badge">
                    {mode === 'civil_procedure' ? '📋 Civil Procedure' : '⚖️ Arbitration Strategy'}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    AI-powered legal assistance
                  </span>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <LoadingSpinner size="sm" variant="primary" text="" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>🚀</span>
                      <span>Submit Query</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Response Section */}
        {response && (
          <div className="space-y-8 animate-fade-in-up animation-delay-200">
            {/* Main Answer */}
            <div className="glass-card p-8 card-hover">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-success rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">💡</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Answer
                  </h2>
                </div>
                <ConfidenceBar confidence={response.confidence} />
              </div>
              
              <div className="prose prose-lg max-w-none prose-slate dark:prose-invert">
                <div 
                  className="text-slate-700 dark:text-slate-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: response.answer.replace(/\n/g, '<br>') }} 
                />
              </div>
              
              {/* Speech Output */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
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
                <div className="animate-fade-in-up animation-delay-300">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>🔄</span>
                      <span>Process Flow</span>
                    </h3>
                    <FlowChart
                      chartData={response.flowchart}
                      citations={response.citations}
                      onNodeClick={(nodeId, citation) => {
                        console.log('Clicked node:', nodeId, 'Citation:', citation);
                      }}
                    />
                  </div>
                </div>

                {/* Case Timeline */}
                <div className="animate-fade-in-up animation-delay-400">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>📅</span>
                      <span>Case Timeline</span>
                    </h3>
                    <CaseTimeline events={timelineEvents} totalDays={365} />
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="animate-fade-in-up animation-delay-500">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>📊</span>
                      <span>Progress Tracker</span>
                    </h3>
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
                </div>

                {/* Form Auto-Fill Preview */}
                <div className="animate-fade-in-up animation-delay-500">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>📝</span>
                      <span>Form Preview</span>
                    </h3>
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
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div className="animate-fade-in-up animation-delay-300">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>📈</span>
                      <span>Case Analysis</span>
                    </h3>
                    <RadarChart metrics={radarMetrics} />
                  </div>
                </div>

                {/* Confidence Trends */}
                <div className="animate-fade-in-up animation-delay-400">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>📊</span>
                      <span>Confidence Trends</span>
                    </h3>
                    <ConfidenceTrends data={confidenceHistory} />
                  </div>
                </div>

                {/* Counter Strategy Generator */}
                <div className="animate-fade-in-up animation-delay-500">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>🎯</span>
                      <span>Counter Strategy</span>
                    </h3>
                    <CounterStrategyGenerator
                      currentStrategy={response.answer}
                      onGenerate={handleCounterStrategy}
                      isLoading={isLoading}
                    />
                  </div>
                </div>

                {/* Interactive Precedent Explorer */}
                <div className="animate-fade-in-up animation-delay-500">
                  <div className="glass-card p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <span>🔍</span>
                      <span>Precedent Explorer</span>
                    </h3>
                    <InteractivePrecedentExplorer
                      precedents={precedents}
                      onPrecedentClick={(precedent) => {
                        console.log('Selected precedent:', precedent);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sources and Citations */}
            {response.sources && response.sources.length > 0 && (
              <div className="animate-fade-in-up animation-delay-500">
                <div className="glass-card p-8">
                  <h3 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                    <span>📚</span>
                    <span>Sources & Citations</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {response.sources.map((source, index) => (
                      <div key={index} className="glass-card p-4 card-hover">
                        <div className="flex items-center justify-between mb-3">
                          <span className="badge font-semibold">{source.rule_number}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {Math.round(source.score * 100)}% relevant
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                          {source.heading}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                          {source.part_title}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                          {source.excerpt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button */}
        <FloatingActionButton
          onQuickQuery={handleQuickQuery}
          onHelp={handleHelp}
          onSettings={handleSettings}
        />
      </main>
    </div>
  );
};

export default App; 