import React, { useEffect, useState } from 'react';
import { Play, Square, Circle, Video, Camera } from 'lucide-react';

interface DemoEnhancerProps {
  enabled?: boolean;
  onRecordingStateChange?: (recording: boolean) => void;
}

const DemoEnhancer: React.FC<DemoEnhancerProps> = ({ 
  enabled = false, 
  onRecordingStateChange 
}) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('');
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Check if demo mode is enabled
    const demoMode = localStorage.getItem('demo-mode') === 'true' || enabled;
    setIsDemoMode(demoMode);
    
    if (demoMode) {
      // Add demo-specific styling
      document.body.classList.add('demo-mode');
      
      // Smooth scrolling for better recording
      document.documentElement.style.scrollBehavior = 'smooth';
      
      // Enhanced cursor visibility
      document.body.style.cursor = 'default';
    }

    return () => {
      document.body.classList.remove('demo-mode');
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, [enabled]);

  const startRecording = (scenario: string) => {
    setCurrentScenario(scenario);
    setIsRecording(true);
    setShowIndicator(true);
    onRecordingStateChange?.(true);
    
    // Add recording indicator styles
    document.body.classList.add('recording');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setShowIndicator(false);
    setCurrentScenario('');
    onRecordingStateChange?.(false);
    
    // Remove recording indicator styles
    document.body.classList.remove('recording');
  };

  const demoScenarios = [
    { id: 'tutorial', name: 'Tutorial Demo', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { id: 'gaming', name: 'Gaming Demo', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    { id: 'business', name: 'Business Demo', url: 'https://www.youtube.com/watch?v=YQHsXMglC9A' },
    { id: 'batch', name: 'Batch Processing', url: 'multiple' },
    { id: 'advanced', name: 'Advanced Features', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
  ];

  if (!isDemoMode) return null;

  return (
    <>
      {/* Recording Indicator */}
      {showIndicator && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          <Circle className="w-3 h-3 fill-current" />
          <span className="text-sm font-medium">REC</span>
          <span className="text-xs opacity-80">{currentScenario}</span>
        </div>
      )}

      {/* Demo Control Panel */}
      <div className="fixed bottom-4 left-4 z-50 bg-gray-900 bg-opacity-90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <Video className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Demo Controls</span>
        </div>
        
        <div className="space-y-2">
          {demoScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => isRecording ? stopRecording() : startRecording(scenario.name)}
              disabled={isRecording && currentScenario !== scenario.name}
              className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                currentScenario === scenario.name
                  ? 'bg-red-600 text-white'
                  : isRecording
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{scenario.name}</span>
                {currentScenario === scenario.name ? (
                  <Square className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </div>
              <div className="text-xs opacity-60 mt-1">{scenario.url}</div>
            </button>
          ))}
        </div>

        {/* Recording Status */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-500'}`} />
            <span className="text-gray-400">
              {isRecording ? `Recording: ${currentScenario}` : 'Ready to record'}
            </span>
          </div>
        </div>
      </div>

      {/* Demo Enhancement Styles */}
      <style>{`
        .demo-mode {
          user-select: none;
        }
        
        .demo-mode * {
          animation-duration: 0.3s !important;
          transition-duration: 0.3s !important;
        }
        
        .recording .demo-mode button:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }
        
        .recording .demo-mode input:focus {
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
          transition: box-shadow 0.2s ease;
        }
        
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .recording .demo-mode .generate-button {
          animation: pulse-subtle 2s infinite;
        }
      `}</style>
    </>
  );
};

export default DemoEnhancer; 