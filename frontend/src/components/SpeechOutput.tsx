import React, { useState, useEffect } from 'react';

interface SpeechOutputProps {
  text: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

const SpeechOutput: React.FC<SpeechOutputProps> = ({ 
  text, 
  autoPlay = false, 
  onStart, 
  onEnd 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Set up event listeners
      utterance.onstart = () => {
        setIsPlaying(true);
        onStart?.();
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        onEnd?.();
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      
      setSpeech(utterance);
    }
  }, [text, onStart, onEnd]);

  useEffect(() => {
    if (autoPlay && speech && isSupported) {
      window.speechSynthesis.speak(speech);
    }
  }, [autoPlay, speech, isSupported]);

  const handlePlay = () => {
    if (speech && isSupported) {
      // Stop any currently playing speech
      window.speechSynthesis.cancel();
      // Start new speech
      window.speechSynthesis.speak(speech);
    }
  };

  const handleStop = () => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  };

  const handleResume = () => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-1">
        {isPlaying ? (
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-blue-600 animate-pulse"></div>
            <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-4 bg-blue-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        ) : (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      
      <span className="text-sm text-blue-800 font-medium">Audio Summary</span>
      
      <div className="flex items-center space-x-1 ml-auto">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Play audio"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Pause audio"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleResume}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Resume audio"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
        
        <button
          onClick={handleStop}
          className="p-1 text-red-600 hover:text-red-800 transition-colors"
          title="Stop audio"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SpeechOutput; 