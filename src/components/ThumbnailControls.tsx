import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { Sliders, Type, Image, Plus, Zap, Move, Trash2, Edit3, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronUp } from 'lucide-react';
import { nanoid } from '../utils/helpers';
import CreatorTypeSelector from './CreatorTypeSelector';
import ParticipantManager from './ParticipantManager';
import CostOptimizationPanel from './CostOptimizationPanel';

interface ThumbnailControlsProps {
  selectedElementId: string | null;
  showElementControls: boolean;
  onEditElement?: (id: string) => void;
  onClose: () => void;
}

interface TextStyles {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
  shadow: boolean;
}

const ThumbnailControls: React.FC<ThumbnailControlsProps> = ({ selectedElementId, showElementControls, onEditElement, onClose }) => {
  const { videoData, thumbnailElements, setThumbnailElements, contextSummary, generationSettings, updateGenerationSettings } = useVideoStore();
  const [showTextControls, setShowTextControls] = useState(false);
  const [clickbaitIntensity, setClickbaitIntensity] = useState(5);
  const [selectedThumbnails, setSelectedThumbnails] = useState<string[]>([]);
  const [styleConsistency, setStyleConsistency] = useState(100);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedControl, setDraggedControl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [textStyles, setTextStyles] = useState<TextStyles>({
    bold: false,
    italic: false,
    underline: false,
    align: 'center',
    shadow: true
  });
  const [imageControls, setImageControls] = useState({
    rotation: 0,
    opacity: 1,
    scale: 1,
    removeBg: false,
    filters: {
      brightness: 100,
      contrast: 100,
      blur: 0
    }
  });

  // Find selected element
  const selectedElement = thumbnailElements.find(el => el.id === selectedElementId);

  // Early return with empty state if no video data
  if (!videoData || !videoData.language) {
    return (
      <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-4">
        <div className="flex items-center mb-4">
          <Sliders className="h-5 w-5 mr-2 text-purple-400" />
          <h3 className="text-lg font-medium">Thumbnail Controls</h3>
        </div>
        <p className="text-gray-400 text-sm">Please enter a video URL to start customizing your thumbnail.</p>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, controlId: string) => {
    setIsDragging(true);
    setDraggedControl(controlId);
    e.dataTransfer.setData('text/plain', controlId);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedControl(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const controlId = e.dataTransfer.getData('text/plain');
    // Update control position logic here
  };

  const addTextElement = () => {
    const newElement = {
      id: nanoid(),
      type: 'text' as const,
      content: 'Click to edit',
      color: '#ffffff',
      size: 24,
      x: 50, // Center of thumbnail
      y: 50, // Center of thumbnail
      styles: {
        bold: false,
        italic: false,
        underline: false,
        align: 'center' as 'left' | 'center' | 'right',
        shadow: true
      }
    };
    
    setThumbnailElements([...thumbnailElements, newElement]);
    setShowTextControls(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const newElement = {
        id: nanoid(),
        type: 'image' as const,
        content: file.name,
        url: reader.result as string,
        size: 150,
        x: 50, // Center of thumbnail
        y: 50, // Center of thumbnail
      };
      
      setThumbnailElements([...thumbnailElements, newElement]);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        <Sliders className="h-5 w-5 mr-2 text-purple-400" />
        <h3 className="text-lg font-medium">Thumbnail Controls</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <div className="p-3 bg-gray-900 rounded-lg md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-400 flex items-center">
              Style Consistency
            </h4>
            <span className="text-sm text-gray-400">{styleConsistency}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="25"
              value={styleConsistency}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setStyleConsistency(value);
                useVideoStore.getState().setStyleConsistency(value);
              }}
              className="w-full accent-purple-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {styleConsistency === 100 ? 'Exactly match channel style' :
             styleConsistency === 75 ? 'Keep core elements with variation' :
             styleConsistency === 50 ? 'Use channel style as inspiration' :
             styleConsistency === 25 ? 'Minimal style reference' :
             'Fresh design'}
          </p>
        </div>

        <div className="p-3 bg-gray-900 rounded-lg md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-400 flex items-center">
              <Move 
                className="h-4 w-4 mr-2 cursor-move" 
                onDragStart={(e) => handleDragStart(e, 'clickbait')}
                onDragEnd={handleDragEnd}
              />
              Clickbait Intensity
            </h4>
            <span className="text-sm text-gray-400">{clickbaitIntensity}/10</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-gray-500" />
            <input
              type="range"
              min="1"
              max="10"
              value={clickbaitIntensity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setClickbaitIntensity(value);
                updateGenerationSettings({ clickbaitIntensity: value });
              }}
              className="w-full accent-purple-500"
            />
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {clickbaitIntensity <= 3 ? 'Professional and informative' :
             clickbaitIntensity <= 7 ? 'Engaging but balanced' :
             'Maximum attention-grabbing impact'}
          </p>
        </div>

        <div className="p-3 bg-gray-900 rounded-lg md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-400 flex items-center">
              <Move 
                className="h-4 w-4 mr-2 cursor-move"
                role="img"
                aria-label="Draggable handle"
                onDragStart={(e) => handleDragStart(e, 'title')}
                onDragEnd={handleDragEnd}
              />
              Video Context
            </h4>
            <button
              onClick={() => setIsContextOpen(!isContextOpen)}
              aria-expanded={isContextOpen}
              aria-controls="video-context"
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              {isContextOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          <div 
            id="video-context"
            className={`overflow-hidden transition-all duration-300 ${isContextOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {contextSummary && (
              <p className="text-sm text-gray-300 mb-4 italic">
                {contextSummary}
              </p>
            )}
            {videoData.channelReference && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-400 mb-2">Channel Thumbnails</h5>
                <p className="text-xs text-gray-500 mb-2">Select thumbnails to use as style reference</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {videoData.channelReference.thumbnails.latest.map((url, index) => (
                    <div
                      key={index}
                      className="group relative aspect-video"
                      onClick={() => {
                        const isSelected = selectedThumbnails.includes(url);
                        const newSelection = isSelected
                          ? selectedThumbnails.filter(t => t !== url)
                          : [...selectedThumbnails, url];
                        setSelectedThumbnails(newSelection);
                        useVideoStore.getState().setSelectedReferenceThumbnails(newSelection);
                      }}
                    >
                      <img
                        src={url}
                        alt={`Channel thumbnail ${index + 1}`}
                        className={`w-full h-full object-cover rounded-md transition-all ${
                          selectedThumbnails.includes(url)
                            ? 'ring-2 ring-purple-500'
                            : 'opacity-70 group-hover:opacity-100'
                        }`}
                      />
                      {selectedThumbnails.includes(url) && (
                        <div className="absolute top-1 right-1 bg-purple-500 rounded-full w-4 h-4 flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Creative Direction */}
        <div className="p-3 bg-gray-900 rounded-lg md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-400">Creative Direction</h4>
          </div>
          <div className="flex flex-col space-y-2">
            {['original', 'dynamic', 'artistic'].map((style) => (
              <div 
                key={style}
                className={`p-2 border rounded-lg flex items-center cursor-pointer ${
                  generationSettings.creativeDirection === style
                    ? 'bg-purple-900 bg-opacity-30 border-purple-500'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                }`}
                onClick={() => updateGenerationSettings({ creativeDirection: style as 'original' | 'dynamic' | 'artistic' })}
              >
                <div className="h-4 w-4 rounded-full mr-2 flex-shrink-0 border border-gray-600 flex items-center justify-center">
                  {generationSettings.creativeDirection === style && (
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm capitalize">{style}</div>
                  <p className="text-xs text-gray-400">
                    {style === 'original' ? 'Match channel identity' : 
                     style === 'dynamic' ? 'Action and motion focused' : 
                     'Creative interpretation'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Add New Elements */}
        <div className="p-3 bg-gray-900 rounded-lg md:col-span-2 lg:col-span-1">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Add Elements</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
              onClick={addTextElement}
            >
              <Type className="h-4 w-4 mr-2" />
              <span className="text-sm">Add Text</span>
            </button>
            
            <label className="flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer">
              <Image className="h-4 w-4 mr-2" />
              <span className="text-sm">Add Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
        
        {/* Variation Count */}
        <div className="p-3 bg-gray-900 rounded-lg md:col-span-2 lg:col-span-1">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Variation Count</h4>
          <div className="flex justify-between">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                className={`flex-1 py-2 mx-1 rounded-lg text-sm ${
                  generationSettings.variationCount === count
                    ? 'bg-purple-600'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => updateGenerationSettings({ variationCount: count as 1 | 2 | 3 })}
              >
                {count} {count === 1 ? 'Variation' : 'Variations'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* New components */}
      <CreatorTypeSelector />
      <ParticipantManager />
      <CostOptimizationPanel />
    </div>
  );
};

export default ThumbnailControls;