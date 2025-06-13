import React, { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import CollapsibleSection from './CollapsibleSection';
import { Type, Scissors, Plus, Circle } from 'lucide-react';

interface SubtitleSegment {
  id: string;
  text: string;
  style: 'title' | 'subtitle' | 'highlight' | 'question' | 'number';
}

const SubtitleGenerator: React.FC = () => {
  const { videoData } = useVideoStore();
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customText, setCustomText] = useState('');
  
  // Generate subtitle segments when video data changes
  useEffect(() => {
    if (videoData?.title) {
      generateSegmentsFromTitle(videoData.title);
    }
  }, [videoData]);
  
  // Mock function to generate segments - would use AI in production
  const generateSegmentsFromTitle = async (title: string) => {
    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock segmentation logic - in production this would be AI-driven
      const words = title.split(' ');
      const result: SubtitleSegment[] = [];
      
      // Title as a whole
      result.push({
        id: `segment-full-${Date.now()}`,
        text: title,
        style: 'title'
      });
      
      // First half of title as subtitle
      if (words.length > 3) {
        const firstHalf = words.slice(0, Math.ceil(words.length / 2)).join(' ');
        result.push({
          id: `segment-half1-${Date.now()}`,
          text: firstHalf,
          style: 'subtitle'
        });
        
        // Second half of title as subtitle
        const secondHalf = words.slice(Math.ceil(words.length / 2)).join(' ');
        result.push({
          id: `segment-half2-${Date.now()}`,
          text: secondHalf,
          style: 'subtitle'
        });
      }
      
      // Find any numbers in the title for highlight
      const numberMatches = title.match(/\d+/g);
      if (numberMatches) {
        numberMatches.forEach(match => {
          result.push({
            id: `segment-number-${match}-${Date.now()}`,
            text: match,
            style: 'number'
          });
        });
      }
      
      // Make the title a question
      if (!title.endsWith('?')) {
        const questionVersion = title.replace(/[.!]$/, '');
        result.push({
          id: `segment-question-${Date.now()}`,
          text: `${questionVersion}?`,
          style: 'question'
        });
      }
      
      // Add key phrases
      const keyPhrases = extractKeyPhrases(title);
      keyPhrases.forEach(phrase => {
        result.push({
          id: `segment-key-${Date.now()}-${phrase.substring(0, 10)}`,
          text: phrase,
          style: 'highlight'
        });
      });
      
      setSegments(result);
    } catch (error) {
      console.error("Failed to generate segments:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Helper function to extract key phrases
  const extractKeyPhrases = (text: string): string[] => {
    // This is a simplified version - in production would use NLP techniques
    const phrases: string[] = [];
    
    // Look for phrases between quotation marks
    const quoteMatches = text.match(/"([^"]*)"/g);
    if (quoteMatches) {
      quoteMatches.forEach(match => {
        phrases.push(match.replace(/"/g, ''));
      });
    }
    
    // Extract phrases based on common patterns
    const words = text.split(' ');
    if (words.length >= 4) {
      // Take first 3-4 words if title is long enough
      phrases.push(words.slice(0, Math.min(4, Math.ceil(words.length / 2))).join(' '));
      
      // Take last 3-4 words if title is long enough
      if (words.length >= 6) {
        phrases.push(words.slice(-Math.min(4, Math.ceil(words.length / 2))).join(' '));
      }
    }
    
    return [...new Set(phrases)]; // Remove duplicates
  };
  
  const handleDragStart = (segment: SubtitleSegment, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'text',
      content: segment.text,
      style: segment.style
    }));
  };
  
  const addCustomSegment = () => {
    if (!customText.trim()) return;
    
    const newSegment: SubtitleSegment = {
      id: `segment-custom-${Date.now()}`,
      text: customText,
      style: 'subtitle'
    };
    
    setSegments(prev => [newSegment, ...prev]);
    setCustomText('');
  };

  return (
    <CollapsibleSection id="subtitle-generator" title="Title & Subtitles" defaultExpanded={true}>
      <div className="space-y-4">
        <p className="text-sm text-gray-400 mb-2">
          Drag and drop title elements onto your thumbnail
        </p>
        
        {/* Video Title */}
        {videoData?.title && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Type className="h-4 w-4 mr-1" /> 
              Video Title
            </h4>
            <div 
              className="bg-indigo-900 bg-opacity-40 p-3 rounded-lg border border-indigo-700 text-white cursor-move"
              draggable
              onDragStart={(e) => handleDragStart({
                id: 'full-title',
                text: videoData.title,
                style: 'title'
              }, e)}
            >
              {videoData.title}
            </div>
          </div>
        )}
        
        {/* Generated Subtitle Segments */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium flex items-center">
              <Scissors className="h-4 w-4 mr-1" /> 
              Subtitle Segments
            </h4>
            
            <button
              onClick={() => videoData?.title && generateSegmentsFromTitle(videoData.title)}
              disabled={isGenerating || !videoData?.title}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-2 py-1 rounded flex items-center"
            >
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
          
          {/* Custom Text Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Add custom text"
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white flex-grow text-sm"
            />
            <button
              onClick={addCustomSegment}
              disabled={!customText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-3 rounded flex items-center"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          
          {segments.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {segments.map(segment => {
                // Apply different styling based on segment style
                let segmentClass = "p-2 rounded-lg cursor-move text-white text-sm";
                
                switch(segment.style) {
                  case 'title':
                    segmentClass += " bg-indigo-900 bg-opacity-40 border border-indigo-700";
                    break;
                  case 'subtitle':
                    segmentClass += " bg-blue-900 bg-opacity-40 border border-blue-700";
                    break;
                  case 'highlight':
                    segmentClass += " bg-yellow-900 bg-opacity-40 border border-yellow-700 font-bold";
                    break;
                  case 'question':
                    segmentClass += " bg-green-900 bg-opacity-40 border border-green-700 italic";
                    break;
                  case 'number':
                    segmentClass += " bg-red-900 bg-opacity-40 border border-red-700 font-bold text-center";
                    break;
                }
                
                return (
                  <div 
                    key={segment.id}
                    className={segmentClass}
                    draggable
                    onDragStart={(e) => handleDragStart(segment, e)}
                  >
                    {segment.style === 'number' ? (
                      <div className="flex items-center justify-center">
                        <Circle className="h-5 w-5 mr-1 text-red-400" fill="currentColor" />
                        {segment.text}
                      </div>
                    ) : (
                      segment.text
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-800 bg-opacity-30 rounded-lg">
              <Type className="h-6 w-6 mx-auto text-gray-500 mb-2" />
              <p className="text-gray-400">No subtitle segments available</p>
              {videoData?.title ? (
                <p className="text-xs text-gray-500 mt-1">Click "Regenerate" to create segments</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Load a video to generate subtitle segments</p>
              )}
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default SubtitleGenerator; 