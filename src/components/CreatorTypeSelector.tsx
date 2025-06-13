import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { CreatorType } from '../types';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

const creatorTypeInfo: Record<CreatorType, { title: string; description: string }> = {
  gaming: {
    title: 'Gaming',
    description: 'Gameplay, reviews, and gaming-related content.'
  },
  tutorial: {
    title: 'Tutorial',
    description: 'Step-by-step guides, how-tos, and instructional content.'
  },
  vlog: {
    title: 'Vlog',
    description: 'Personal day-in-the-life content, lifestyle videos.'
  },
  entertainment: {
    title: 'Entertainment',
    description: 'Sketches, comedy, challenges, and general entertainment.'
  },
  education: {
    title: 'Education',
    description: 'Educational content, explainers, and academic topics.'
  },
  review: {
    title: 'Review',
    description: 'Product reviews, critiques, and analysis.'
  },
  business: {
    title: 'Business',
    description: 'Corporate content, business advice, and professional topics.'
  },
  music: {
    title: 'Music',
    description: 'Music videos, performances, and music-related content.'
  },
  news: {
    title: 'News',
    description: 'News reports, current events, and informational content.'
  },
  other: {
    title: 'Other',
    description: 'Content that doesn\'t fit into other categories.'
  }
};

const CreatorTypeSelector: React.FC = () => {
  const { creatorType, setCreatorType } = useVideoStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hoverType, setHoverType] = useState<CreatorType | null>(null);

  return (
    <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-4 mt-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium">Creator Type</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>
      
      {isOpen && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-4">
            Select the type of content creator to optimize thumbnail generation
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(creatorTypeInfo) as CreatorType[]).map((type) => (
              <div 
                key={type}
                className={`p-3 rounded-lg cursor-pointer relative ${
                  creatorType === type 
                    ? 'bg-purple-600 border-purple-500' 
                    : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
                } border transition-all duration-200`}
                onClick={() => setCreatorType(type)}
                onMouseEnter={() => setHoverType(type)}
                onMouseLeave={() => setHoverType(null)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{creatorTypeInfo[type].title}</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
                
                {hoverType === type && (
                  <div className="absolute z-10 w-64 p-3 bg-gray-800 border border-gray-600 rounded-lg shadow-lg text-xs text-gray-300 top-full left-0 mt-1">
                    {creatorTypeInfo[type].description}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {creatorType && (
            <div className="mt-4 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
              <h4 className="text-sm font-medium">Selected: {creatorTypeInfo[creatorType].title}</h4>
              <p className="text-xs text-gray-400 mt-1">{creatorTypeInfo[creatorType].description}</p>
            </div>
          )}
          
          <button
            onClick={() => setCreatorType(null)}
            className="mt-3 text-sm text-purple-400 hover:text-purple-300"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default CreatorTypeSelector; 