import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, CheckCircle, Image, Palette, Wand2 } from 'lucide-react';

interface LoadingStateProps {
  stage?: 'analyzing' | 'extracting' | 'generating' | 'optimizing' | 'finalizing';
  progress?: number;
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  stage = 'analyzing', 
  progress = 0,
  message 
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  const stageInfo = {
    analyzing: {
      icon: Loader2,
      title: 'Analyzing Video',
      description: 'Understanding your video content and style...',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900 bg-opacity-20'
    },
    extracting: {
      icon: Image,
      title: 'Extracting Elements',
      description: 'Identifying key visual elements and themes...',
      color: 'text-green-400',
      bgColor: 'bg-green-900 bg-opacity-20'
    },
    generating: {
      icon: Sparkles,
      title: 'Creating Thumbnail',
      description: 'AI is generating your professional thumbnail...',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900 bg-opacity-20'
    },
    optimizing: {
      icon: Wand2,
      title: 'Optimizing Design',
      description: 'Perfecting composition and visual impact...',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900 bg-opacity-20'
    },
    finalizing: {
      icon: CheckCircle,
      title: 'Almost Ready',
      description: 'Finalizing your awesome thumbnail...',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900 bg-opacity-20'
    }
  };

  const currentStage = stageInfo[stage];
  const Icon = currentStage.icon;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentProgress(prev => {
        if (prev < progress) {
          return Math.min(prev + 2, progress);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Animated Icon */}
      <div className={`relative p-6 rounded-full ${currentStage.bgColor} border border-gray-600`}>
        <Icon className={`w-12 h-12 ${currentStage.color} animate-spin`} />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-spin" 
             style={{ borderTopColor: 'currentColor', animationDuration: '3s' }}>
        </div>
      </div>

      {/* Stage Information */}
      <div className="text-center space-y-2">
        <h3 className={`text-xl font-semibold ${currentStage.color}`}>
          {currentStage.title}
        </h3>
        <p className="text-gray-400 max-w-md">
          {message || currentStage.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(currentProgress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${
              stage === 'analyzing' ? 'from-blue-500 to-blue-400' :
              stage === 'extracting' ? 'from-green-500 to-green-400' :
              stage === 'generating' ? 'from-purple-500 to-purple-400' :
              stage === 'optimizing' ? 'from-yellow-500 to-yellow-400' :
              'from-emerald-500 to-emerald-400'
            }`}
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="flex space-x-4">
        {Object.entries(stageInfo).map(([key, info], index) => {
          const isActive = key === stage;
          const isCompleted = Object.keys(stageInfo).indexOf(key) < Object.keys(stageInfo).indexOf(stage);
          const StageIcon = info.icon;

          return (
            <div 
              key={key}
              className={`flex flex-col items-center space-y-1 ${
                isActive ? 'opacity-100' : isCompleted ? 'opacity-60' : 'opacity-30'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-green-500' : isActive ? info.bgColor : 'bg-gray-700'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <StageIcon className={`w-4 h-4 ${isActive ? info.color : 'text-gray-500'}`} />
                )}
              </div>
              <span className="text-xs text-gray-400 capitalize">{key}</span>
            </div>
          );
        })}
      </div>

      {/* Fun Facts */}
      <div className="mt-6 p-4 bg-gray-800 bg-opacity-30 rounded-lg border border-gray-700 max-w-md">
        <div className="flex items-center space-x-2 mb-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-400">Did you know?</span>
        </div>
        <p className="text-xs text-gray-400">
          {stage === 'analyzing' && "Your thumbnail can increase video views by up to 154%!"}
          {stage === 'extracting' && "We analyze thousands of visual elements to find the perfect style."}
          {stage === 'generating' && "DALL-E 3 creates unique, high-quality images in seconds."}
          {stage === 'optimizing' && "Professional thumbnails use specific color psychology principles."}
          {stage === 'finalizing' && "Great thumbnails are the #1 factor in video click-through rates."}
        </p>
      </div>
    </div>
  );
};

export default LoadingState; 