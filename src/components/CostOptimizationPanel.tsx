import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { DollarSign, ChevronUp, ChevronDown, Info } from 'lucide-react';

const CostOptimizationPanel: React.FC = () => {
  const { generationSettings, updateGenerationSettings } = useVideoStore();
  const [isOpen, setIsOpen] = useState(false);

  const costOptions = [
    {
      value: 'economy',
      label: 'Economy',
      description: 'Lower quality setting, smaller file size, reduced costs',
      savings: '~40%'
    },
    {
      value: 'standard',
      label: 'Standard',
      description: 'Balanced quality and cost, recommended for most thumbnails',
      savings: '0%'
    },
    {
      value: 'premium',
      label: 'Premium',
      description: 'Highest quality, best for detailed thumbnails',
      savings: '-20%'
    }
  ];

  return (
    <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-4 mt-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-400" />
          <h3 className="text-lg font-medium">Cost Optimization</h3>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>
      
      {isOpen && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-4">
            Adjust quality settings to optimize generation costs
          </p>
          
          <div className="space-y-3">
            {costOptions.map((option) => (
              <div 
                key={option.value}
                className={`p-3 rounded-lg cursor-pointer border ${
                  generationSettings.costOptimization === option.value
                    ? 'bg-gray-700 border-blue-500'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                }`}
                onClick={() => updateGenerationSettings({ costOptimization: option.value as 'economy' | 'standard' | 'premium' })}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{option.label}</span>
                      {option.value === 'economy' && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-900 text-green-300 rounded">
                          SAVE {option.savings}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                  </div>
                  
                  <div className="flex items-center">
                    {option.value === 'economy' && <DollarSign className="h-4 w-4 text-green-400" />}
                    {option.value === 'standard' && (
                      <>
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <DollarSign className="h-4 w-4 text-green-400" />
                      </>
                    )}
                    {option.value === 'premium' && (
                      <>
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <DollarSign className="h-4 w-4 text-green-400" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-start">
            <Info className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              Economy mode uses standard quality generation instead of HD, reducing costs while still providing acceptable thumbnails. Premium uses the same HD quality as Standard but may include additional tokens and detail in prompts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostOptimizationPanel; 