import React, { useState, useEffect } from 'react';
import { ThumbnailElement } from '../types';
import { Move, Sparkles, AlertCircle, GripHorizontal } from 'lucide-react';
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
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [imageState, setImageState] = useState<{
    url: string | null;
    error: string | null;
    loading: boolean;
  }>({
    url: null,
    error: null,
    loading: false
  });

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
    let timer: NodeJS.Timeout;
    
    if (isGenerating && !imageState.url) {
      setElapsedTime(0);
      setShowTimer(true);
      timer = setInterval(() => {
        setElapsedTime(prev => Math.min(prev + 1, 30));
      }, 1000);
    }
    
    return () => {
      clearInterval(timer);
      setElapsedTime(0);
      setShowTimer(false);
    };
  }, [isGenerating, imageState.url]);

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

  return (
    <div 
      className="relative" 
      style={{ paddingBottom: previewHeight }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
        
        {isGenerating && showTimer && (
          <div className="absolute inset-0 z-40 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-purple-400 animate-pulse" />
              </div>
              <p className="mt-4 text-lg font-medium text-white">Generating Thumbnail ({elapsedTime}/30s)</p>
              <p className="mt-2 text-sm text-gray-400">Creating something amazing...</p>
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
                onClick={(e) => {
                  if (element.type === 'text') {
                    e.stopPropagation();
                    setEditingElement(element.id);
                  }
                }}
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
                        autoFocus
                        className="px-4 py-2 bg-black bg-opacity-70 rounded text-white border border-purple-500 focus:outline-none"
                        style={{ 
                          color: element.color || 'white',
                          fontSize: `${element.size || 16}px`,
                          width: `${Math.max(100, element.content.length * 12)}px`
                        }}
                      />
                      <GripHorizontal className="absolute -top-6 left-1/2 -translate-x-1/2 h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div 
                      className={`px-4 py-2 bg-black bg-opacity-70 rounded text-white select-none cursor-text
                        ${element.styles?.bold ? 'font-bold' : 'font-normal'}
                        ${element.styles?.italic ? 'italic' : ''}
                        ${element.styles?.underline ? 'underline' : ''}
                        ${element.styles?.shadow ? 'drop-shadow-lg' : ''}
                        text-${element.styles?.align || 'center'}`}
                      style={{ 
                        color: element.color || 'white',
                        fontSize: `${element.size || 16}px` 
                      }}
                    >{element.content}</div>
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