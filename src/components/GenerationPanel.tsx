import React, { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { Sparkles, Loader2, Sliders, Bolt, Palette, Tag, AlignJustify, UserCheck } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { isReplicateConfigured } from '../services/replicateService';
import './GenerationPanel.css';

interface GenerationPanelProps {
  onGenerate?: () => Promise<void>;
}

const GenerationPanel: React.FC<GenerationPanelProps> = ({ onGenerate }) => {
  const { generationSettings, updateGenerationSettings, styleConsistency, setStyleConsistency, videoData } = useVideoStore();
  const [loading, setLoading] = useState(false);
  const [replicateConfigured, setReplicateConfigured] = useState(false);

  useEffect(() => {
    const checkReplicate = async () => {
      const configured = isReplicateConfigured();
      setReplicateConfigured(configured);
    };
    checkReplicate();
  }, []);
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (onGenerate) {
        await onGenerate();
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <CollapsibleSection id="creative-direction" title="Creative Direction" defaultExpanded={true}>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div 
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
              generationSettings.creativeDirection === 'original' 
                ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                : 'border-gray-700 hover:border-gray-500'
            }`}
            onClick={() => updateGenerationSettings({ creativeDirection: 'original' })}
          >
            <div className="h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded mb-2 flex items-center justify-center">
              <div className="text-lg font-bold">Original</div>
            </div>
            <h4 className="text-sm font-medium">Original Style</h4>
            <p className="text-xs text-gray-400 mt-1">Matches channel identity</p>
          </div>
          
          <div 
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
              generationSettings.creativeDirection === 'dynamic' 
                ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                : 'border-gray-700 hover:border-gray-500'
            }`}
            onClick={() => updateGenerationSettings({ creativeDirection: 'dynamic' })}
          >
            <div className="h-20 bg-gradient-to-br from-blue-900 to-purple-800 rounded mb-2 flex items-center justify-center">
              <div className="text-lg font-bold">Dynamic</div>
            </div>
            <h4 className="text-sm font-medium">Dynamic</h4>
            <p className="text-xs text-gray-400 mt-1">Action and motion focused</p>
          </div>
          
          <div 
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all ${
              generationSettings.creativeDirection === 'artistic' 
                ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                : 'border-gray-700 hover:border-gray-500'
            }`}
            onClick={() => updateGenerationSettings({ creativeDirection: 'artistic' })}
          >
            <div className="h-20 bg-gradient-to-br from-orange-900 to-pink-800 rounded mb-2 flex items-center justify-center">
              <div className="text-lg font-bold">Artistic</div>
            </div>
            <h4 className="text-sm font-medium">Artistic</h4>
            <p className="text-xs text-gray-400 mt-1">Creative interpretation</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Face Swap Section */}
      {replicateConfigured && videoData?.thumbnailUrl && (
        <CollapsibleSection id="face-swap" title="Face Swap" defaultExpanded={true}>
          <div className="mt-3 p-4 bg-gray-800 bg-opacity-30 rounded-lg border border-gray-700">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <img 
                  src={videoData.thumbnailUrl} 
                  alt="Original thumbnail"
                  className="w-24 h-14 object-cover rounded border-2 border-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1 text-center">Original</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                                         <input
                       type="checkbox"
                       checked={generationSettings.enableFaceSwap || false}
                       onChange={(e) => updateGenerationSettings({ enableFaceSwap: e.target.checked })}
                       className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                     />
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium">Swap my face into new scene</span>
                  </label>
                </div>
                                 <p className="text-xs text-gray-400">
                   Uses AI to extract your face from the original thumbnail and place it in the new AI-generated background.
                   {!generationSettings.enableFaceSwap && " This creates more recognizable thumbnails while keeping a fresh style."}
                 </p>
                 {generationSettings.enableFaceSwap && (
                  <div className="mt-2 p-2 bg-indigo-900 bg-opacity-20 border border-indigo-500 rounded text-xs text-indigo-300">
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Face swap will be applied after AI generation (+~2 seconds)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {!replicateConfigured && videoData?.thumbnailUrl && (
        <CollapsibleSection id="face-swap-disabled" title="Face Swap (Disabled)">
          <div className="mt-3 p-4 bg-gray-800 bg-opacity-30 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">
              <UserCheck className="w-4 h-4 text-gray-500 inline mr-2" />
              Face swap requires Replicate API configuration. Add VITE_REPLICATE_API_TOKEN to your .env file to enable this feature.
            </div>
          </div>
        </CollapsibleSection>
      )}
      
      <CollapsibleSection id="clickbait-intensity" title="Attention Level" defaultExpanded={true}>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400">Subtle</span>
            <span className="text-sm font-bold">{generationSettings.clickbaitIntensity}</span>
            <span className="text-sm text-gray-400">Attention-Grabbing</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={generationSettings.clickbaitIntensity} 
            onChange={(e) => updateGenerationSettings({ clickbaitIntensity: Number(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-2">
            Controls how eye-catching and attention-grabbing the thumbnail will be.
          </p>
        </div>
      </CollapsibleSection>
      
      <CollapsibleSection id="cost-optimization" title="Quality Level">
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div 
            className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
              generationSettings.costOptimization === 'economy' 
                ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                : 'border-gray-700 hover:border-gray-500'
            }`}
            onClick={() => updateGenerationSettings({ costOptimization: 'economy' })}
          >
            <h4 className="text-sm font-medium">Economy</h4>
            <p className="text-xs text-gray-400 mt-1">Lower cost, faster</p>
          </div>
          
          <div 
            className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
              generationSettings.costOptimization === 'standard' 
                ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                : 'border-gray-700 hover:border-gray-500'
            }`}
            onClick={() => updateGenerationSettings({ costOptimization: 'standard' })}
          >
            <h4 className="text-sm font-medium">Standard</h4>
            <p className="text-xs text-gray-400 mt-1">Balanced</p>
          </div>
          
          <div 
            className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
              generationSettings.costOptimization === 'premium' 
                ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                : 'border-gray-700 hover:border-gray-500'
            }`}
            onClick={() => updateGenerationSettings({ costOptimization: 'premium' })}
          >
            <h4 className="text-sm font-medium">Premium</h4>
            <p className="text-xs text-gray-400 mt-1">Highest quality</p>
          </div>
        </div>
      </CollapsibleSection>
      
      <CollapsibleSection id="variations" title="Variation Count">
        <div className="mt-3">
          <div className="flex justify-center gap-4">
            <button 
              className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 text-xl font-bold transition-all ${
                generationSettings.variationCount === 1 
                  ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                  : 'border-gray-700 hover:border-gray-500'
              }`}
              onClick={() => updateGenerationSettings({ variationCount: 1 })}
            >
              1
            </button>
            <button 
              className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 text-xl font-bold transition-all ${
                generationSettings.variationCount === 2 
                  ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                  : 'border-gray-700 hover:border-gray-500'
              }`}
              onClick={() => updateGenerationSettings({ variationCount: 2 })}
            >
              2
            </button>
            <button 
              className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 text-xl font-bold transition-all ${
                generationSettings.variationCount === 3 
                  ? 'border-indigo-500 bg-indigo-900 bg-opacity-20' 
                  : 'border-gray-700 hover:border-gray-500'
              }`}
              onClick={() => updateGenerationSettings({ variationCount: 3 })}
            >
              3
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Number of thumbnail variations to generate. Higher values will use more API credits.
          </p>
        </div>
      </CollapsibleSection>
      
      <div className="mt-6">
        <button
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-medium flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Thumbnails
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GenerationPanel; 