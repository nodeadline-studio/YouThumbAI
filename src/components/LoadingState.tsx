import React from 'react';

interface LoadingStateProps {
  message?: string;
  progress?: number; // 0-100
  subMessage?: string;
  type?: 'generating' | 'processing' | 'blending' | 'uploading' | 'analyzing';
  showCancel?: boolean;
  onCancel?: () => void;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Processing...', 
  progress,
  subMessage,
  type = 'processing',
  showCancel = false,
  onCancel
}) => {
  const getIcon = () => {
    switch (type) {
      case 'generating':
        return '✨';
      case 'processing':
        return '⚙️';
      case 'blending':
        return '🎨';
      case 'uploading':
        return '☁️';
      case 'analyzing':
        return '🔍';
      default:
        return '⚙️';
    }
  };

  const getLoadingAnimation = () => {
    switch (type) {
      case 'generating':
        return 'animate-pulse';
      case 'blending':
        return 'animate-bounce';
      default:
        return 'animate-spin';
    }
  };

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="flex flex-col items-center space-y-4">
          {/* Main loading icon */}
          <div className="relative">
            <div className={`text-4xl ${getLoadingAnimation()}`}>
              {getIcon()}
            </div>
            {type === 'processing' && (
              <div className="loading-spinner absolute inset-0 m-auto"></div>
            )}
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full max-w-xs">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                ></div>
              </div>
              <div className="text-xs text-center mt-1 opacity-75">
                {Math.round(progress)}%
              </div>
            </div>
          )}

          {/* Main message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-1">
              {message}
            </h3>
            {subMessage && (
              <p className="text-sm text-gray-300 opacity-90">
                {subMessage}
              </p>
            )}
          </div>

          {/* Loading stages indicator */}
          {type === 'generating' && (
            <div className="flex space-x-2 text-xs text-gray-400">
              <span className={progress !== undefined && progress > 20 ? 'text-green-400' : ''}>
                📝 Analyzing
              </span>
              <span className={progress !== undefined && progress > 50 ? 'text-green-400' : ''}>
                🎯 Creating
              </span>
              <span className={progress !== undefined && progress > 80 ? 'text-green-400' : ''}>
                ✨ Finishing
              </span>
            </div>
          )}

          {type === 'blending' && (
            <div className="flex space-x-2 text-xs text-gray-400">
              <span className={progress !== undefined && progress > 30 ? 'text-green-400' : ''}>
                🔍 Analyzing
              </span>
              <span className={progress !== undefined && progress > 60 ? 'text-green-400' : ''}>
                🎨 Blending
              </span>
              <span className={progress !== undefined && progress > 90 ? 'text-green-400' : ''}>
                ✅ Complete
              </span>
            </div>
          )}

          {/* Cancel button */}
          {showCancel && onCancel && (
            <button 
              onClick={onCancel}
              className="btn btn-secondary btn-sm mt-4"
            >
              Cancel
            </button>
          )}

          {/* Loading tips */}
          <div className="text-xs text-gray-400 text-center max-w-sm mt-4">
            {type === 'generating' && (
              <p>💡 Tip: The AI is analyzing your content to create the perfect thumbnail</p>
            )}
            {type === 'blending' && (
              <p>🎯 Tip: Text is being naturally integrated into your image for professional results</p>
            )}
            {type === 'processing' && (
              <p>⚡ Tip: Complex operations are processed locally for your privacy</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState; 