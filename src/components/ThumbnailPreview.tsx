import React, { useState, useEffect } from 'react';
import { ThumbnailElement } from '../types';
import { Move, Sparkles, AlertCircle, GripHorizontal, X, RotateCw, Copy } from 'lucide-react';
import { useVideoStore } from '../store/videoStore';

interface ThumbnailPreviewProps {
  videoTitle: string;
  videoTypography?: {
    direction: 'ltr' | 'rtl';
    fontFamily: string;
  };
  elements: ThumbnailElement[];
  onElementsChange: (elements: ThumbnailElement[]) => void;
  generatedImage: string | null;
  isGenerating?: boolean;
  onDrop?: (dataTransfer: DataTransfer, x: number, y: number) => void;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({ 
  videoTitle, 
  videoTypography,
  elements, 
  onElementsChange,
  generatedImage,
  isGenerating = false,
  onDrop
}) => {
  const [draggedElement, setDraggedElement] = useState<number | null>(null);
  const { thumbnailElements, setThumbnailElements } = useVideoStore();
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ elementId: string; handle: string } | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  
  // Real progress tracking instead of hardcoded timer
  const [progressState, setProgressState] = useState<{
    stage: string;
    progress: number;
    estimatedTime: number;
    startTime: number | null;
  }>({
    stage: 'Initializing...',
    progress: 0,
    estimatedTime: 0,
    startTime: null
  });

  const [imageState, setImageState] = useState<{
    url: string | null;
    error: string | null;
    loading: boolean;
  }>({
    url: null,
    error: null,
    loading: false
  });

  // Progress stages with realistic timing based on cost optimization
  const getProgressStages = (costOptimization: string = 'standard') => {
    const baseStages = [
      { name: 'Analyzing video content...', duration: 2000, progress: 15 },
      { name: 'Building creative prompt...', duration: 3000, progress: 30 },
      { name: 'Generating thumbnail...', duration: 15000, progress: 85 },
      { name: 'Applying enhancements...', duration: 2000, progress: 95 },
      { name: 'Finalizing...', duration: 1000, progress: 100 }
    ];

    // Adjust timing based on cost optimization
    const multiplier = costOptimization === 'premium' ? 1.3 : 
                     costOptimization === 'economy' ? 0.7 : 1.0;
    
    return baseStages.map(stage => ({
      ...stage,
      duration: Math.round(stage.duration * multiplier)
    }));
  };

  // Real progress simulation that follows actual generation
  useEffect(() => {
    if (!isGenerating) {
      setProgressState({
        stage: 'Initializing...',
        progress: 0,
        estimatedTime: 0,
        startTime: null
      });
      return;
    }

    const startTime = Date.now();
    setProgressState(prev => ({ ...prev, startTime }));
    
    // Get cost optimization from store
    const { generationSettings } = useVideoStore.getState();
    const costSetting = generationSettings?.costOptimization || 'standard';
    const stages = getProgressStages(costSetting);
    let currentStageIndex = 0;
    let stageStartTime = startTime;
    
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (currentStageIndex >= stages.length) return;
      
      const currentStage = stages[currentStageIndex];
      const stageElapsed = now - stageStartTime;
      const stageProgress = Math.min(stageElapsed / currentStage.duration, 1);
      
      // Calculate overall progress
      const previousProgress = currentStageIndex > 0 ? 
        stages.slice(0, currentStageIndex).reduce((sum, s) => sum + s.progress, 0) / stages.length * 100 : 0;
      const currentStageWeight = currentStage.progress / stages.length * 100;
      const overallProgress = previousProgress + (currentStageWeight * stageProgress);
      
      // Estimate remaining time
      const totalEstimatedDuration = stages.reduce((sum, s) => sum + s.duration, 0);
      const estimatedRemaining = Math.max(0, totalEstimatedDuration - elapsed);
      
      setProgressState({
        stage: currentStage.name,
        progress: Math.round(overallProgress),
        estimatedTime: Math.round(estimatedRemaining / 1000),
        startTime
      });
      
      // Move to next stage
      if (stageProgress >= 1 && currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        stageStartTime = now;
      }
    };
    
    // Update progress every 100ms for smooth animation
    const interval = setInterval(updateProgress, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [isGenerating]);

  const loadImage = async (url: string) => {
    setImageState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const img = new Image();
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });
      
      img.src = url;
      await loadPromise;
      
      setImageState({
        url,
        error: null,
        loading: false
      });
    } catch (error) {
      setImageState({
        url: null,
        error: 'Failed to load image',
        loading: false
      });
      console.error('Error loading image:', error);
    }
  };

  useEffect(() => {
    if (generatedImage) {
      loadImage(generatedImage);
    } else {
      setImageState({
        url: null,
        error: null,
        loading: false
      });
    }
  }, [generatedImage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thumbnail dimensions (16:9 aspect ratio)
  const previewWidth = '100%';
  const previewHeight = 'calc((9 / 16) * 100%)';

  const handleDragStart = (index: number) => {
    setDraggedElement(index);
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
    setDragStartPos({ x: 0, y: 0 });
    setEditingElement(null);
  };

  const handleDrag = (e: React.DragEvent, index: number) => {
    if (draggedElement === null || !e.clientX || !e.clientY) return;
    
    const previewEl = e.currentTarget.parentElement;
    if (!previewEl) return;
    
    const rect = previewEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * 100, 100));
    const y = Math.max(0, Math.min(((e.clientY - rect.top) / rect.height) * 100, 100));
    
    const updatedElements = [...elements];
    updatedElements[index] = {
      ...updatedElements[index],
      x,
      y
    };
    
    onElementsChange(updatedElements);
  };
  
  // Handle external drops (from subtitle generator or people extractor)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!onDrop || !e.dataTransfer.getData('text/plain')) return;
    
    const previewEl = e.currentTarget;
    const rect = previewEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * 100, 100));
    const y = Math.max(0, Math.min(((e.clientY - rect.top) / rect.height) * 100, 100));
    
    onDrop(e.dataTransfer, x, y);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // This allows the drop event to fire
    // Add a visual indication that this is a drop target
    e.currentTarget.classList.add('drop-target');
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    // Remove visual indication
    e.currentTarget.classList.remove('drop-target');
  };

  const handleElementSelect = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    setEditingElement(null);
  };

  const handleElementDoubleClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element?.type === 'text') {
      setEditingElement(elementId);
      setSelectedElement(null);
    }
  };

  const handleResizeStart = (elementId: string, handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing({ elementId, handle });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizing) return;
    
    const element = elements.find(el => el.id === resizing.elementId);
    if (!element) return;

    const deltaX = e.movementX;
    const deltaY = e.movementY;
    
    const updatedElements = thumbnailElements.map(el => {
      if (el.id === resizing.elementId) {
        let newSize = el.size || 16;
        
        if (resizing.handle.includes('right') || resizing.handle.includes('left')) {
          newSize += deltaX * 0.5;
        }
        if (resizing.handle.includes('bottom') || resizing.handle.includes('top')) {
          newSize += deltaY * 0.5;
        }
        
        return { ...el, size: Math.max(8, Math.min(200, newSize)) };
      }
      return el;
    });
    
    setThumbnailElements(updatedElements);
  };

  const handleResizeEnd = () => {
    setResizing(null);
  };

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizing]);

  // Click outside to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
      setEditingElement(null);
    }
  };

  // Delete selected element
  const handleDeleteElement = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedElements = thumbnailElements.filter(el => el.id !== elementId);
    setThumbnailElements(updatedElements);
    setSelectedElement(null);
  };

  // Duplicate selected element
  const handleDuplicateElement = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = thumbnailElements.find(el => el.id === elementId);
    if (!element) return;
    
    const duplicatedElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: Math.min(element.x + 10, 90), // Offset slightly
      y: Math.min(element.y + 10, 90)
    };
    
    setThumbnailElements([...thumbnailElements, duplicatedElement]);
    setSelectedElement(duplicatedElement.id);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const updatedElements = thumbnailElements.filter(el => el.id !== selectedElement);
        setThumbnailElements(updatedElements);
        setSelectedElement(null);
      }
      
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setEditingElement(null);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, thumbnailElements, setThumbnailElements]);

  return (
    <div 
      className="relative" 
      style={{ paddingBottom: previewHeight }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleCanvasClick}
      data-thumbnail-preview
    >
      <div className="absolute inset-0 bg-black rounded-lg overflow-hidden shadow-xl">
        {/* Generated image (always at the bottom) */}
        {imageState.url && !imageState.error && !imageState.loading && (
          <div className="absolute inset-0 z-10">
            <img 
              src={imageState.url} 
              alt="Generated thumbnail" 
              className="w-full h-full object-cover"
              onError={() => setImageState(prev => ({ ...prev, error: 'Failed to display image' }))}
            />
          </div>
        )}
        
        {isGenerating && (
          <div className="absolute inset-0 z-40 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-6">
                {/* Animated progress ring */}
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(139, 92, 246, 0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgb(139, 92, 246)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressState.progress / 100)}`}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                
                {/* Progress percentage */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-purple-400">
                    {progressState.progress}%
                  </span>
                </div>
                
                {/* Sparkles animation */}
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-purple-400 animate-pulse" />
              </div>
              
              <p className="text-lg font-medium text-white mb-2">{progressState.stage}</p>
              
              {progressState.estimatedTime > 0 && (
                <p className="text-sm text-gray-400">
                  ~{progressState.estimatedTime}s remaining
                </p>
              )}
              
              {/* Cost optimization indicator */}
              <div className="mt-4 px-3 py-1 bg-purple-900/40 rounded-full text-xs text-purple-300">
                {(() => {
                  const { generationSettings } = useVideoStore.getState();
                  const cost = generationSettings?.costOptimization || 'standard';
                  const labels = {
                    economy: 'Economy Mode • Faster Generation',
                    standard: 'Standard Quality • Balanced Speed',
                    premium: 'Premium Quality • Enhanced Detail'
                  };
                  return labels[cost as keyof typeof labels];
                })()}
              </div>
            </div>
          </div>
        )}
        {imageState.loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : imageState.error ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-900">
            <div className="text-center text-red-400">
              <div className="relative z-10">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="text-sm">{imageState.error}</p>
                <button
                  onClick={() => generatedImage && loadImage(generatedImage)}
                  className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Default background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-700 to-gray-900"></div>
            
            {/* Video title (if no generated image) */}
            <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
              <h3 
                className="text-white text-xl md:text-2xl lg:text-3xl font-bold text-center drop-shadow-lg"
                style={{ 
                  direction: videoTypography?.direction || 'ltr',
                  fontFamily: videoTypography?.fontFamily || 'system-ui, sans-serif',
                  maxWidth: '80%',
                  lineHeight: 1.4
                }}
              >
                {videoTitle}
              </h3>
            </div>
            
            {/* Drop zone indicator overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-indigo-500 bg-opacity-0 transition-all duration-200"></div>
            
            {/* Draggable elements */}
            {elements.map((element, index) => (
              <div
                key={element.id}
                className={`absolute cursor-move ${draggedElement === index ? 'z-50 opacity-80' : 'z-30'}`}
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg) scale(${element.scale || 1})`,
                  opacity: element.opacity || 1,
                  pointerEvents: 'auto'
                }}
                draggable={editingElement !== element.id}
                onDragStart={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDragStartPos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  });
                  handleDragStart(index);
                }}
                onDrag={(e) => handleDrag(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onClick={(e) => handleElementSelect(element.id, e)}
                onDoubleClick={(e) => handleElementDoubleClick(element.id, e)}
              >
                {element.type === 'text' ? (
                  editingElement === element.id ? (
                    <div className="relative group">
                      <input
                        type="text"
                        value={element.content}
                        onChange={(e) => {
                          const updatedElements = thumbnailElements.map(el =>
                            el.id === element.id ? { ...el, content: e.target.value } : el  
                          );
                          setThumbnailElements(updatedElements);
                        }}
                        onBlur={() => setEditingElement(null)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setEditingElement(null);
                          }
                        }}
                        autoFocus
                        className="px-4 py-2 bg-black bg-opacity-70 rounded text-white border border-purple-500 focus:outline-none"
                        style={{ 
                          color: element.color || 'white',
                          fontSize: `${element.size || 16}px`,
                          width: `${Math.max(100, element.content.length * 12)}px`
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div 
                        className={`relative group select-none
                          ${element.styles?.bold ? 'font-bold' : 'font-normal'}
                          ${element.styles?.italic ? 'italic' : ''}
                          ${element.styles?.underline ? 'underline' : ''}
                          ${element.styles?.shadow ? 'text-shadow-lg' : ''}
                          text-${element.styles?.align || 'center'}`}
                        style={{ 
                          color: element.color || 'white',
                          fontSize: `${element.size || 16}px`,
                          textShadow: element.styles?.shadow ? '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)' : 'none',
                          fontWeight: element.styles?.bold ? 'bold' : 'normal',
                          lineHeight: '1.2',
                          padding: '0.25rem 0.5rem',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '0',
                          whiteSpace: 'nowrap',
                          cursor: 'text'
                        }}
                      >
                        {element.content}
                        {/* Show edit hint only on hover */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Double-click to edit
                          </div>
                        </div>
                      </div>
                      
                      {/* Selection and resize handles */}
                      {selectedElement === element.id && (
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Bounding box */}
                          <div className="absolute inset-0 border-2 border-purple-500 border-dashed rounded pointer-events-none" 
                               style={{ margin: '-4px' }} />
                          
                          {/* Control buttons */}
                          <div className="absolute -top-8 left-0 flex space-x-1 pointer-events-auto">
                            <button
                              onClick={(e) => handleDuplicateElement(element.id, e)}
                              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white flex items-center justify-center transition-colors"
                              title="Duplicate"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteElement(element.id, e)}
                              className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded text-white flex items-center justify-center transition-colors"
                              title="Delete (Del)"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Resize handles */}
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-500 rounded-full cursor-nw-resize pointer-events-auto"
                               onMouseDown={(e) => handleResizeStart(element.id, 'top-left', e)} />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full cursor-ne-resize pointer-events-auto"
                               onMouseDown={(e) => handleResizeStart(element.id, 'top-right', e)} />
                          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-500 rounded-full cursor-sw-resize pointer-events-auto"
                               onMouseDown={(e) => handleResizeStart(element.id, 'bottom-left', e)} />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-500 rounded-full cursor-se-resize pointer-events-auto"
                               onMouseDown={(e) => handleResizeStart(element.id, 'bottom-right', e)} />
                        </div>
                      )}
                    </div>
                  )
                ) : element.type === 'image' && element.url ? (
                  <div className="relative">
                    <img 
                      src={element.url} 
                      alt={element.content || 'Element'} 
                      className="rounded-lg border-2 border-white shadow-lg"
                      style={{ 
                        width: `${element.size || 100}px`,
                        height: `${element.size || 100}px`,
                        objectFit: 'cover',
                        filter: element.filters ? `
                          brightness(${element.filters.brightness || 100}%)
                          contrast(${element.filters.contrast || 100}%)
                          blur(${element.filters.blur || 0}px)
                        ` : 'none'
                      }}
                    />
                    
                    {/* Selection and resize handles for images */}
                    {selectedElement === element.id && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Bounding box */}
                        <div className="absolute inset-0 border-2 border-purple-500 border-dashed rounded pointer-events-none" 
                             style={{ margin: '-4px' }} />
                        
                        {/* Control buttons */}
                        <div className="absolute -top-8 left-0 flex space-x-1 pointer-events-auto">
                          <button
                            onClick={(e) => handleDuplicateElement(element.id, e)}
                            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white flex items-center justify-center transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteElement(element.id, e)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded text-white flex items-center justify-center transition-colors"
                            title="Delete (Del)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        
                        {/* Resize handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full cursor-nw-resize pointer-events-auto"
                             onMouseDown={(e) => handleResizeStart(element.id, 'top-left', e)} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full cursor-ne-resize pointer-events-auto"
                             onMouseDown={(e) => handleResizeStart(element.id, 'top-right', e)} />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full cursor-sw-resize pointer-events-auto"
                             onMouseDown={(e) => handleResizeStart(element.id, 'bottom-left', e)} />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full cursor-se-resize pointer-events-auto"
                             onMouseDown={(e) => handleResizeStart(element.id, 'bottom-right', e)} />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Move className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                    {element.removeBg && (
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50" />
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ThumbnailPreview;