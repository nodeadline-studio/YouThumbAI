import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { Library, Copy, Layers, Type, Image, Trash2, Edit3, ChevronUp, ChevronDown, Search, Filter, ChevronLeft, ChevronRight, Upload, Star, Heart, Square, Circle, Triangle, Zap } from 'lucide-react';
import { nanoid } from '../utils/helpers';
import { ThumbnailElement, ThumbnailElementType } from '../types';

interface ElementLibraryProps {
  onEditElement?: (id: string) => void;
  onSelectElement?: (element: ThumbnailElement) => void;
}

const ElementLibrary: React.FC<ElementLibraryProps> = ({ onEditElement, onSelectElement }) => {
  const { videoData, setThumbnailElements, thumbnailElements } = useVideoStore();
  const [activeCategory, setActiveCategory] = useState('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Enhanced template elements with more variety
  const templates = {
    text: [
    {
      id: 'big-title',
      name: 'Big Title',
      preview: 'TITLE',
        description: 'Large main title text',
      elements: [{
        type: 'text' as ThumbnailElementType,
        content: 'Main Title',
        color: '#ffffff',
        size: 48,
        x: 50,
        y: 50,
        styles: {
          bold: true,
          italic: false,
          underline: false,
          align: 'center' as 'left' | 'center' | 'right',
          shadow: true
        }
      }]
    },
    {
      id: 'subtitle',
      name: 'Subtitle',
      preview: 'Subtitle',
        description: 'Supporting text below main title',
      elements: [{
        type: 'text' as ThumbnailElementType,
        content: 'Subtitle Text',
        color: '#e2e8f0',
        size: 32,
        x: 50,
        y: 70,
        styles: {
          bold: false,
          italic: false,
          underline: false,
          align: 'center' as 'left' | 'center' | 'right',
          shadow: true
        }
      }]
    },
    {
      id: 'number',
      name: 'Number',
      preview: '#1',
        description: 'Ranking or count display',
      elements: [{
        type: 'text' as ThumbnailElementType,
        content: '#1',
        color: '#fbbf24',
        size: 64,
        x: 20,
        y: 30,
        styles: {
          bold: true,
          italic: false,
          underline: false,
          align: 'left' as 'left' | 'center' | 'right',
          shadow: true
        }
      }]
    },
    {
      id: 'highlight',
      name: 'Highlight',
      preview: 'NEW!',
        description: 'Attention-grabbing accent text',
      elements: [{
        type: 'text' as ThumbnailElementType,
        content: 'NEW!',
        color: '#f87171',
        size: 36,
        x: 80,
        y: 20,
        styles: {
          bold: true,
          italic: false,
          underline: false,
          align: 'right' as 'left' | 'center' | 'right',
          shadow: true
        }
      }]
    },
    {
      id: 'person',
      name: 'Person',
        preview: 'Person',
        description: 'Person or character name',
      elements: [{
        type: 'text' as ThumbnailElementType,
          content: 'Person Name',
        color: '#93c5fd',
        size: 28,
        x: 20,
        y: 80,
        styles: {
          bold: false,
          italic: true,
          underline: false,
          align: 'left' as 'left' | 'center' | 'right',
          shadow: true
        }
      }]
    },
    {
      id: 'logo',
      name: 'Logo',
        preview: 'LOGO',
        description: 'Brand or channel logo text',
      elements: [{
        type: 'text' as ThumbnailElementType,
        content: 'LOGO',
        color: '#fde047',
        size: 24,
        x: 85,
        y: 85,
        styles: {
          bold: true,
          italic: false,
          underline: false,
          align: 'right' as 'left' | 'center' | 'right',
          shadow: true
        }
      }]
      },
      {
        id: 'question',
        name: 'Question',
        preview: 'WHY?',
        description: 'Question or curiosity text',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: 'WHY?',
          color: '#a78bfa',
          size: 40,
      x: 50,
          y: 30,
      styles: {
            bold: true,
        italic: false,
        underline: false,
            align: 'center' as 'left' | 'center' | 'right',
            shadow: true
          }
        }]
      },
      {
        id: 'call-to-action',
        name: 'Call to Action',
        preview: 'WATCH NOW',
        description: 'Action-oriented text',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: 'WATCH NOW',
          color: '#10b981',
          size: 32,
          x: 50,
          y: 85,
          styles: {
            bold: true,
            italic: false,
            underline: true,
            align: 'center' as 'left' | 'center' | 'right',
        shadow: true
      }
        }]
      }
    ],
    shapes: [
      {
        id: 'rectangle',
        name: 'Rectangle',
        preview: '▭',
        description: 'Basic rectangle shape',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: '▭',
          color: '#3b82f6',
          size: 48,
          x: 50,
          y: 50,
          styles: { bold: false, italic: false, underline: false, align: 'center' as const, shadow: false }
        }]
      },
      {
        id: 'circle',
        name: 'Circle',
        preview: '●',
        description: 'Perfect circle shape',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: '●',
          color: '#ef4444',
          size: 48,
          x: 50,
          y: 50,
          styles: { bold: false, italic: false, underline: false, align: 'center' as const, shadow: false }
        }]
      },
      {
        id: 'triangle',
        name: 'Triangle',
        preview: '▲',
        description: 'Triangle pointer shape',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: '▲',
          color: '#f59e0b',
          size: 48,
          x: 50,
          y: 50,
          styles: { bold: false, italic: false, underline: false, align: 'center' as const, shadow: false }
        }]
      },
      {
        id: 'arrow',
        name: 'Arrow',
        preview: '→',
        description: 'Directional arrow',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: '→',
          color: '#8b5cf6',
          size: 48,
          x: 50,
          y: 50,
          styles: { bold: false, italic: false, underline: false, align: 'center' as const, shadow: false }
        }]
      },
      {
        id: 'star',
        name: 'Star',
        preview: '★',
        description: 'Star rating or highlight',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: '★',
          color: '#fbbf24',
          size: 48,
          x: 50,
          y: 50,
          styles: { bold: false, italic: false, underline: false, align: 'center' as const, shadow: false }
        }]
      },
      {
        id: 'heart',
        name: 'Heart',
        preview: '♥',
        description: 'Heart for likes or love',
        elements: [{
          type: 'text' as ThumbnailElementType,
          content: '♥',
          color: '#f87171',
          size: 48,
          x: 50,
          y: 50,
          styles: { bold: false, italic: false, underline: false, align: 'center' as const, shadow: false }
        }]
      }
    ],
    images: [
      {
        id: 'person-placeholder',
        name: 'Person Placeholder',
        preview: '👤',
        description: 'Placeholder for person image',
        elements: [{
          type: 'image' as ThumbnailElementType,
          content: 'Person',
          url: 'https://via.placeholder.com/300x300/4f46e5/ffffff?text=👤',
          x: 25,
          y: 50,
          size: 200
        }]
      },
      {
        id: 'logo-placeholder',
        name: 'Logo Placeholder',
        preview: '🏢',
        description: 'Placeholder for brand logo',
        elements: [{
          type: 'image' as ThumbnailElementType,
          content: 'Logo',
          url: 'https://via.placeholder.com/200x100/1f2937/ffffff?text=LOGO',
          x: 75,
          y: 15,
          size: 100
        }]
      },
      {
        id: 'background',
        name: 'Background',
        preview: '🖼️',
        description: 'Background image overlay',
        elements: [{
          type: 'image' as ThumbnailElementType,
          content: 'Background',
          url: 'https://via.placeholder.com/1280x720/6366f1/ffffff?text=Background',
          x: 50,
          y: 50,
          size: 400
        }]
      },
      {
        id: 'icon',
        name: 'Icon',
        preview: '⚡',
        description: 'Small decorative icon',
        elements: [{
          type: 'image' as ThumbnailElementType,
          content: 'Icon',
          url: 'https://via.placeholder.com/100x100/f59e0b/ffffff?text=⚡',
          x: 85,
          y: 25,
          size: 50
        }]
      }
    ]
  };
      
  // Filter templates based on search and category
  const filteredTemplates = React.useMemo(() => {
    const categoryTemplates = templates[activeCategory as keyof typeof templates] || [];
    
    if (!searchQuery && filterType === 'all') {
      return categoryTemplates;
    }
    
    return categoryTemplates.filter(template => {
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
        (filterType === 'popular' && ['big-title', 'number', 'highlight'].includes(template.id)) ||
        (filterType === 'recent' && ['question', 'call-to-action'].includes(template.id));
      
      return matchesSearch && matchesFilter;
    });
  }, [activeCategory, searchQuery, filterType]);

  // Handle scroll functionality
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [filteredTemplates]);

  const handleAddElement = (template: any) => {
    const newElement: ThumbnailElement = {
      ...template.elements[0],
      id: nanoid()
    };
    
    if (onSelectElement) {
      onSelectElement(newElement);
    } else {
      setThumbnailElements([...thumbnailElements, newElement]);
      
      if (onEditElement) {
        onEditElement(newElement.id);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const newElement: ThumbnailElement = {
          id: nanoid(),
          type: 'image',
          content: file.name,
          url: imageUrl,
          x: 50,
          y: 50,
          size: 200
        };
        
        if (onSelectElement) {
          onSelectElement(newElement);
        } else {
          setThumbnailElements([...thumbnailElements, newElement]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const moveElement = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === thumbnailElements.length - 1)
    ) {
      return;
    }

    const newElements = [...thumbnailElements];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newElements[index], newElements[targetIndex]] = [newElements[targetIndex], newElements[index]];
    setThumbnailElements(newElements);
  };
  
  const duplicateElement = (index: number) => {
    const element = thumbnailElements[index];
    const newElement = {
      ...element,
      id: nanoid(),
      x: element.x + 5,
      y: element.y + 5
    };
    setThumbnailElements([...thumbnailElements, newElement]);
  };

  const deleteElement = (index: number) => {
    const newElements = thumbnailElements.filter((_, i) => i !== index);
    setThumbnailElements(newElements);
  };

  const handleDragStart = (template: any, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: template.elements[0].type,
      content: template.elements[0].content,
      ...template.elements[0]
    }));
  };

  return (
    <div data-testid="element-library" className="bg-gray-800 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
        <Library className="h-5 w-5 mr-2 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Element Library</h3>
        </div>
        <div className="text-xs text-gray-400">
          {filteredTemplates.length} items
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            data-testid="element-search"
            type="text"
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">All</option>
            <option value="popular">Popular</option>
            <option value="recent">Recent</option>
          </select>
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="flex mb-4 bg-gray-700 rounded-lg p-1">
        <button
          data-testid="text-tab"
          onClick={() => setActiveCategory('text')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeCategory === 'text'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          <Type className="h-4 w-4 mr-1" />
          Text
        </button>
        <button
          data-testid="shapes-tab"
          onClick={() => setActiveCategory('shapes')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeCategory === 'shapes'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          <Square className="h-4 w-4 mr-1" />
          Shapes
        </button>
        <button
          data-testid="images-tab"
          onClick={() => setActiveCategory('images')}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeCategory === 'images'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          <Image className="h-4 w-4 mr-1" />
          Images
        </button>
      </div>
      
      {/* Templates with Horizontal Scroll */}
      <div className="flex-1 relative">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            data-testid="scroll-left"
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-900 rounded-full p-2 text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        
        {canScrollRight && (
          <button
            data-testid="scroll-right"
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-900/80 hover:bg-gray-900 rounded-full p-2 text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
      )}
      
        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          data-testid="element-library-scroll"
          className="flex space-x-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          {filteredTemplates.map((template, index) => (
            <div
              key={template.id}
              data-testid={`template-${template.id}`}
              className="flex-shrink-0 w-24 bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors group"
              onClick={() => handleAddElement(template)}
              draggable
              onDragStart={(e) => handleDragStart(template, e)}
            >
              <div className="text-center">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {template.preview}
                </div>
                <div className="text-xs text-gray-300 font-medium mb-1">
                  {template.name}
                </div>
                <div className="text-xs text-gray-400 leading-tight">
                  {template.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Image Upload for Images Tab */}
        {activeCategory === 'images' && (
          <div className="mt-4 p-4 border-2 border-dashed border-gray-600 rounded-lg">
            <div data-testid="image-drop-zone" className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-400 mb-2">Upload your own image</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm cursor-pointer transition-colors"
              >
                Choose File
              </label>
            </div>
        </div>
      )}
      </div>
      
      {/* Current Elements List */}
      {thumbnailElements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <Layers className="h-4 w-4 mr-1" />
            Canvas Elements ({thumbnailElements.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {thumbnailElements.map((element, index) => (
              <div 
                key={element.id} 
                className="flex items-center justify-between bg-gray-700 rounded p-2 text-sm"
              >
                <div className="flex items-center flex-1 min-w-0">
                  {element.type === 'text' ? (
                    <Type className="h-3 w-3 mr-2 text-blue-400 flex-shrink-0" />
                  ) : (
                    <Image className="h-3 w-3 mr-2 text-green-400 flex-shrink-0" />
                  )}
                  <span className="text-gray-300 truncate">
                    {element.content}
                  </span>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button 
                    onClick={() => moveElement(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => moveElement(index, 'down')}
                    disabled={index === thumbnailElements.length - 1}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => duplicateElement(index)}
                    className="p-1 text-gray-400 hover:text-blue-400"
                    title="Duplicate"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                    <button 
                    onClick={() => onEditElement?.(element.id)}
                    className="p-1 text-gray-400 hover:text-purple-400"
                    title="Edit"
                    >
                    <Edit3 className="h-3 w-3" />
                    </button>
                  <button 
                    onClick={() => deleteElement(index)}
                    className="p-1 text-gray-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementLibrary;