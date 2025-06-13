import React from 'react';
import { useVideoStore } from '../store/videoStore';
import { Library, Copy, Layers, Type, Image, Trash2, Edit3, ChevronUp, ChevronDown } from 'lucide-react';
import { nanoid } from '../utils/helpers';
import { Palette, Shapes, Users } from 'lucide-react';
import { ThumbnailElement, ThumbnailElementType } from '../types';

interface ElementLibraryProps {
  onEditElement?: (id: string) => void;
  onSelectElement?: (element: ThumbnailElement) => void;
}

const ElementLibrary: React.FC<ElementLibraryProps> = ({ onEditElement, onSelectElement }) => {
  const { videoData, setThumbnailElements, thumbnailElements } = useVideoStore();
  const [activeCategory, setActiveCategory] = React.useState('text');
  
  // Sample template elements
  const templates = [
    {
      id: 'big-title',
      name: 'Big Title',
      preview: 'TITLE',
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
      preview: '👤',
      elements: [{
        type: 'text' as ThumbnailElementType,
        content: 'Person',
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
      preview: '⭐',
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
    }
  ];

  const handleAddElement = (type: ThumbnailElementType, preset: string) => {
    const newElement: ThumbnailElement = {
      id: nanoid(),
      type,
      content: preset === 'title' ? (videoData?.title || 'Title') : preset,
      color: preset === 'accent' ? '#ffbb00' : '#ffffff',
      size: preset === 'subtitle' ? 24 : 36,
      x: 50,
      y: preset === 'subtitle' ? 65 : 50,
      styles: {
        bold: preset !== 'subtitle',
        italic: false,
        underline: false,
        align: 'center',
        shadow: true
      }
    };
    
    if (type === 'image') {
      newElement.url = `https://via.placeholder.com/300x300/333333/FFFFFF/?text=${preset}`;
    }
    
    if (onSelectElement) {
      onSelectElement(newElement);
    } else {
      setThumbnailElements([...thumbnailElements, newElement]);
      
      // Automatically select the new element for editing if callback is provided
      if (onEditElement) {
        onEditElement(newElement.id);
      }
    }
  };

  const duplicateTemplate = (templateIndex: number) => {
    const template = templates[templateIndex];
    const newElement = {
      ...template.elements[0],
      id: nanoid(),
      type: template.elements[0].type as ThumbnailElementType
    };
    
    if (onSelectElement) {
      onSelectElement(newElement as ThumbnailElement);
    } else {
      setThumbnailElements([...thumbnailElements, newElement]);
      
      if (onEditElement) {
        onEditElement(newElement.id);
      }
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
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
    setThumbnailElements(newElements);
  };
  
  const handleDragStart = (templateIndex: number, e: React.DragEvent) => {
    const template = templates[templateIndex];
    const newElement = {
      ...template.elements[0],
      id: nanoid(),
      type: template.elements[0].type
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'text',
      content: newElement.content,
      style: {
        color: newElement.color,
        size: newElement.size,
        ...newElement.styles
      }
    }));
  };

  return (
    <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-4 mb-6">
      <div className="flex items-center mb-4">
        <Library className="h-5 w-5 mr-2 text-purple-400" />
        <h3 className="text-lg font-medium">Element Library</h3>
      </div>
      
      <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <button
          className={`flex-shrink-0 flex items-center px-3 py-1 rounded-lg mr-2 text-sm font-medium transition-colors ${
            activeCategory === 'text' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => setActiveCategory('text')}
        >
          <Type className="h-4 w-4 mr-2" />
          Text
        </button>
        <button
          className={`flex-shrink-0 flex items-center px-3 py-1 rounded-lg mr-2 text-sm font-medium transition-colors ${
            activeCategory === 'shapes' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => setActiveCategory('shapes')}
        >
          <Shapes className="h-4 w-4 mr-2" />
          Shapes
        </button>
        <button
          className={`flex-shrink-0 flex items-center px-3 py-1 rounded-lg mr-2 text-sm font-medium transition-colors ${
            activeCategory === 'images' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => setActiveCategory('images')}
        >
          <Image className="h-4 w-4 mr-2" />
          Images
        </button>
        <button
          className={`flex-shrink-0 flex items-center px-3 py-1 rounded-lg mr-2 text-sm font-medium transition-colors ${
            activeCategory === 'palette' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => setActiveCategory('palette')}
        >
          <Palette className="h-4 w-4 mr-2" />
          Palette
        </button>
        <button
          className={`flex-shrink-0 flex items-center px-3 py-1 rounded-lg mr-2 text-sm font-medium transition-colors ${
            activeCategory === 'templates' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => setActiveCategory('templates')}
        >
          <Layers className="h-4 w-4 mr-2" />
          Templates
        </button>
      </div>
      
      {/* Elements in the library */}
      {activeCategory === 'text' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
            onClick={() => handleAddElement('text', 'title')}
          >
            <div className="text-lg font-bold text-white mb-1">Title</div>
            <div className="text-xs text-gray-400">Main title</div>
          </button>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
            onClick={() => handleAddElement('text', 'subtitle')}
          >
            <div className="text-base text-gray-200 mb-1">Subtitle</div>
            <div className="text-xs text-gray-400">Supporting text</div>
          </button>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
            onClick={() => handleAddElement('text', 'accent')}
          >
            <div className="text-base font-bold text-yellow-400 mb-1">Accent</div>
            <div className="text-xs text-gray-400">Highlighted text</div>
          </button>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
            onClick={() => handleAddElement('text', 'number')}
          >
            <div className="text-xl font-bold text-blue-400 mb-1">#1</div>
            <div className="text-xs text-gray-400">Number or ranking</div>
          </button>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
            onClick={() => handleAddElement('text', 'callout')}
          >
            <div className="text-base font-bold text-red-400 mb-1">NEW!</div>
            <div className="text-xs text-gray-400">Attention grabber</div>
          </button>
          <button
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-center transition-colors"
            onClick={() => handleAddElement('text', 'detail')}
          >
            <div className="text-sm text-gray-300 mb-1">Small detail</div>
            <div className="text-xs text-gray-400">Additional info</div>
          </button>
        </div>
      )}
      
      {activeCategory === 'templates' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {templates.map((template, index) => (
            <div
              key={template.id}
              className="bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => duplicateTemplate(index)}
              draggable
              onDragStart={(e) => handleDragStart(index, e)}
            >
              <div className="text-center mb-2">
                <div className={`text-lg ${
                  template.id === 'big-title' ? 'font-bold text-white' :
                  template.id === 'subtitle' ? 'text-gray-200' :
                  template.id === 'number' ? 'font-bold text-yellow-400' :
                  template.id === 'highlight' ? 'font-bold text-red-400' :
                  template.id === 'person' ? 'italic text-blue-300' :
                  'font-bold text-yellow-300'
                }`}>
                  {template.preview}
                </div>
              </div>
              <div className="text-xs text-center text-gray-300">{template.name}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Existing elements list */}
      {thumbnailElements.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Current Elements</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {thumbnailElements.map((element, index) => (
              <div 
                key={element.id} 
                className="flex items-center justify-between bg-gray-700 bg-opacity-50 p-2 rounded"
              >
                <div className="flex items-center overflow-hidden flex-1">
                  {element.type === 'text' ? (
                    <Type className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  ) : (
                    <Image className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="truncate text-sm">
                    {element.type === 'text' ? element.content : 'Image element'}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    className="text-gray-400 hover:text-white p-1"
                    onClick={() => moveElement(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button 
                    className="text-gray-400 hover:text-white p-1"
                    onClick={() => moveElement(index, 'down')}
                    disabled={index === thumbnailElements.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {onEditElement && (
                    <button 
                      className="text-gray-400 hover:text-blue-400 p-1"
                      onClick={() => onEditElement(element.id)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    className="text-gray-400 hover:text-red-400 p-1"
                    onClick={() => {
                      const newElements = thumbnailElements.filter(el => el.id !== element.id);
                      setThumbnailElements(newElements);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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