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
import PdfPreview from './components/PdfPreview';

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
    url?: string;
    case_name?: string;
    status?: string;
    support?: {
      classification: 'Supportive' | 'Opposing' | 'Neutral' | 'Unknown';
      justification: string;
    };
    summary: string;
  }>;
  session_id: string;
  timelineEvents?: Array<any>;
  progressSteps?: Array<any>;
  formFields?: Array<any>;
  radarMetrics?: Array<any>;
  precedents?: Array<any>;
  formUrl?: string;
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
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [rewrittenStrategy, setRewrittenStrategy] = useState<string | null>(null);

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
  const [timelineEvents, setTimelineEvents] = useState<Array<any>>([]);
  const [progressSteps, setProgressSteps] = useState<Array<any>>([]);
  const [formFields, setFormFields] = useState<Array<any>>([]);

  // Arbitration specific state
  const [radarMetrics, setRadarMetrics] = useState<Array<any>>([]);
  const [precedents, setPrecedents] = useState<Array<any>>([]);

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
    
    // Add user's query to history before sending
    const updatedHistory = [...conversationHistory, { role: 'user', content: query }];

    try {
      const response = await fetch('http://localhost:8000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          mode,
          session_id: Date.now().toString(),
          conversation_history: updatedHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResponse(data);
        
        // Add AI response to history
        setConversationHistory([...updatedHistory, { role: 'assistant', content: data.answer }]);

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

        // Set state only from backend response
        setTimelineEvents(data.timelineEvents || []);
        setProgressSteps(data.progressSteps || []);
        setFormFields(data.formFields || []);
        setRadarMetrics(data.radarMetrics || []);
        setPrecedents(data.precedents || []);
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

  const handleRewriteStrategy = async () => {
    if (!response) return;

    setIsLoading(true);
    showNotification('Rewriting strategy...', 'info');

    try {
      const apiResponse = await fetch('http://localhost:8000/api/rewrite-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: response.answer,
          context: response.sources.map(s => s.summary).join('\\n\\n')
        }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        setRewrittenStrategy(data.rewritten_strategy);
        showNotification('Strategy rewritten!', 'success');
      } else {
        showNotification('Failed to rewrite strategy.', 'error');
      }
    } catch (error) {
      console.error('Error rewriting strategy:', error);
      showNotification('Network error during strategy rewrite.', 'error');
    } finally {
      setIsLoading(false);
    }
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {response && (
              <div className="glass-card p-6 animate-fade-in-up">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-lg">💡</span>
                  </div>
                  <h2 className="text-xl font-bold gradient-text">Answer</h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {response.answer}
                </p>
                <ConfidenceBar confidence={response.confidence} />
              </div>
            )}

            {response && response.flowchart && (
              <div className="glass-card p-6 animate-fade-in-up animation-delay-100">
                <h2 className="text-xl font-bold gradient-text mb-4">Procedural Flowchart</h2>
                <FlowChart chartData={response.flowchart} />
              </div>
            )}
            
            {mode === 'arbitration_strategy' && response && response.precedents && response.precedents.length > 0 && (
              <div className="glass-card p-6 animate-fade-in-up animation-delay-200">
                <h2 className="text-xl font-bold gradient-text mb-4">Precedent Explorer</h2>
                <InteractivePrecedentExplorer precedents={response.precedents} />
              </div>
            )}

            {response && response.timelineEvents && response.timelineEvents.length > 0 && (
              <div className="glass-card p-6 animate-fade-in-up animation-delay-200">
                <h2 className="text-xl font-bold gradient-text mb-4">Case Timeline</h2>
                <CaseTimeline events={response.timelineEvents} />
              </div>
            )}

            {showExplainability && response && (
              <div className="glass-card p-6 animate-fade-in-up animation-delay-200">
                <h2 className="text-xl font-bold gradient-text mb-4">AI Reasoning</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Reasoning Chain:</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-sm space-y-1 mt-2">
                      {response.reasoning_chain.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Quality Metrics:</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-sm space-y-1 mt-2">
                      <li>Citations Included: {response.quality_metrics.has_citations ? 'Yes' : 'No'}</li>
                      <li>Well-Structured: {response.quality_metrics.has_structure ? 'Yes' : 'No'}</li>
                      <li>Actionable Guidance: {response.quality_metrics.has_practical_guidance ? 'Yes' : 'No'}</li>
                      <li>Complete Answer: {response.quality_metrics.is_complete ? 'Yes' : 'No'}</li>
                    </ul>
                    {response.quality_metrics.suggestions.length > 0 && (
                       <div>
                         <h4 className="font-semibold text-slate-700 dark:text-slate-200 mt-2">Suggestions:</h4>
                         <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-sm space-y-1 mt-1">
                          {response.quality_metrics.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                         </ul>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {mode === 'arbitration_strategy' && response && response.radarMetrics && response.radarMetrics.metrics && (
               <div className="glass-card p-6 animate-fade-in-up animation-delay-300">
                 <h2 className="text-xl font-bold gradient-text mb-4">Case Analysis</h2>
                 <RadarChart metrics={response.radarMetrics.metrics} chanceOfSuccess={response.radarMetrics.chanceOfSuccess} />
               </div>
            )}

            {response && (
              <div className="glass-card p-6 animate-fade-in-up animation-delay-400">
                <h2 className="text-xl font-bold gradient-text mb-4">Confidence Trends</h2>
                <ConfidenceTrends history={confidenceHistory} currentConfidence={response.confidence} />
              </div>
            )}

            {mode === 'civil_procedure' && response && response.progressSteps && response.progressSteps.length > 0 && (
              <div className="glass-card p-6 animate-fade-in-up animation-delay-500">
                <h2 className="text-xl font-bold gradient-text mb-4">Progress Tracker</h2>
                <ProgressTracker steps={response.progressSteps} />
              </div>
            )}

            {response && response.sources && response.sources.length > 0 && (
              <div className="animate-fade-in-up animation-delay-500">
                <div className="glass-card p-8">
                  <h2 className="text-xl font-bold gradient-text mb-4">Sources & Citations</h2>
                  
                  {mode === 'arbitration_strategy' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                          <tr>
                            <th scope="col" className="px-6 py-3">Case Name</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Support</th>
                            <th scope="col" className="px-6 py-3">Relevance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {response.sources.map((source, index) => (
                            <tr key={index} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                              <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                                <a href={source.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">{source.case_name}</a>
                              </th>
                              <td className="px-6 py-4">{source.status}</td>
                              <td className="px-6 py-4">
                                <SupportBadge support={source.support} />
                              </td>
                              <td className="px-6 py-4">{(source.score * 100).toFixed(0)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {response.sources.map((source, index) => (
                        <div key={index} className="glass-card p-4 card-hover">
                          <a href={source.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            <div className="font-bold text-primary-600 dark:text-primary-400">
                              {source.rule_number}: {source.heading || 'N/A'}
                            </div>
                          </a>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Relevance: {(source.score * 100).toFixed(0)}%
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 truncate">
                            {source.excerpt}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {response && response.formUrl && (
              <div className="glass-card p-6 animate-fade-in-up animation-delay-300">
                <h2 className="text-xl font-bold gradient-text mb-4">Referenced Form</h2>
                <PdfPreview fileUrl={response.formUrl} />
              </div>
            )}
          </div>
        </div>

        {/* Strategy Rewriter Section */}
        {mode === 'arbitration_strategy' && response && (
          <div className="mt-8 animate-fade-in-up animation-delay-600">
             <div className="glass-card p-8">
                <h2 className="text-2xl font-bold gradient-text mb-4 text-center">AI Strategy Assistant</h2>
                <div className="max-w-2xl mx-auto">
                  <CounterStrategyGenerator 
                    onGenerate={handleRewriteStrategy}
                    isLoading={isLoading}
                  />
                  {rewrittenStrategy && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                       <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Suggested Improvement:</h3>
                       <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mt-2 prose prose-slate dark:prose-invert max-w-none">
                         {rewrittenStrategy}
                       </p>
                    </div>
                  )}
                </div>
             </div>
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

const SupportBadge = ({ support }: { support?: { classification: string; justification: string } }) => {
  if (!support) return <span className="badge-neutral">Unknown</span>;

  const { classification, justification } = support;

  const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-semibold relative group";
  
  const colorClasses = {
    'Supportive': "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    'Opposing': "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    'Neutral': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    'Unknown': "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
  };

  const badgeClass = colorClasses[classification] || colorClasses['Unknown'];

  return (
    <div className={`${baseClasses} ${badgeClass}`}>
      {classification}
      <div className="absolute bottom-full mb-2 w-72 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
        {justification}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
      </div>
    </div>
  );
};

export default App; 