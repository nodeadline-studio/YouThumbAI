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
      
      // Improved segmentation logic - avoid weird cuts and fragments
      const words = title.split(' ').filter(word => word.length > 0);
      const result: SubtitleSegment[] = [];
      
      // Only add full title if it's not too long
      if (title.length <= 60) {
        result.push({
          id: `segment-full-${Date.now()}`,
          text: title,
          style: 'title'
        });
      }
      
      // Smart phrase extraction - avoid single words and fragments
      if (words.length >= 3) {
        // Create meaningful phrases (3+ words minimum)
        for (let i = 0; i <= words.length - 3; i++) {
          const phrase = words.slice(i, i + Math.min(4, words.length - i)).join(' ');
          
          // Skip if phrase is too short, has weird symbols, or ends with incomplete words
          if (phrase.length >= 10 && 
              !phrase.includes('?') && 
              !phrase.match(/^[^a-zA-Z]*$/) && // Avoid symbol-only phrases
              !phrase.match(/\w{1}$/) &&     // Avoid single-character endings
              !phrase.endsWith('of') && 
              !phrase.endsWith('in') && 
              !phrase.endsWith('to') && 
              !phrase.endsWith('the')) {
            
            result.push({
              id: `segment-phrase-${i}-${Date.now()}`,
              text: phrase,
              style: 'subtitle'
            });
          }
        }
      }
      
      // Extract meaningful numbers only (2+ digits or standalone meaningful numbers)
      const numberMatches = title.match(/\b(\d{2,}|\b[1-9]\b(?=\s+(?:tips|ways|steps|things|reasons|facts)))/g);
      if (numberMatches) {
        numberMatches.forEach(match => {
          if (match.length >= 2 || parseInt(match) <= 20) { // Avoid single random digits
            result.push({
              id: `segment-number-${match}-${Date.now()}`,
              text: match,
              style: 'number'
            });
          }
        });
      }
      
      // Only add question version if it makes sense and isn't already a question
      if (!title.includes('?') && words.length >= 4) {
        const questionWords = ['how', 'what', 'why', 'when', 'where', 'which', 'can', 'will', 'is', 'are'];
        const startsWithQuestion = questionWords.some(qw => 
          title.toLowerCase().startsWith(qw + ' ')
        );
        
        if (startsWithQuestion || title.toLowerCase().includes('how to')) {
          const questionVersion = title.replace(/[.!]$/, '');
          result.push({
            id: `segment-question-${Date.now()}`,
            text: `${questionVersion}?`,
            style: 'question'
          });
        }
      }
      
      // Extract key action phrases
      const keyPhrases = extractMeaningfulPhrases(title);
      keyPhrases.forEach(phrase => {
        result.push({
          id: `segment-key-${Date.now()}-${phrase.substring(0, 10)}`,
          text: phrase,
          style: 'highlight'
        });
      });
      
      // Remove duplicates and sort by relevance
      const uniqueResults = result.filter((item, index, arr) => 
        index === arr.findIndex(other => other.text.toLowerCase() === item.text.toLowerCase())
      );
      
      setSegments(uniqueResults.slice(0, 8)); // Limit to 8 best suggestions
    } catch (error) {
      // Error handling without console
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Improved helper function to extract meaningful phrases
  const extractMeaningfulPhrases = (text: string): string[] => {
    const phrases: string[] = [];
    
    // Look for phrases between quotation marks
    const quoteMatches = text.match(/"([^"]+)"/g);
    if (quoteMatches) {
      quoteMatches.forEach(match => {
        const cleanPhrase = match.replace(/"/g, '');
        if (cleanPhrase.length >= 6) { // Only meaningful quoted content
          phrases.push(cleanPhrase);
        }
      });
    }
    
    // Extract action-oriented phrases
    const actionPatterns = [
      /\b(learn|master|discover|unlock|reveal|secret|ultimate|best|top|amazing|incredible)\s+[\w\s]{6,20}/gi,
      /\b(how to|step by step|tutorial|guide to|tips for)\s+[\w\s]{6,20}/gi,
      /\b\d+\s+(tips|ways|methods|secrets|tricks|hacks)\b/gi
    ];
    
    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (cleanMatch.length >= 8 && cleanMatch.length <= 40) {
            phrases.push(cleanMatch);
          }
        });
      }
    });
    
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