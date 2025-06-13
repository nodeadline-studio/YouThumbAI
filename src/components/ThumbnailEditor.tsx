import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import ThumbnailPreview from './ThumbnailPreview';
import ThumbnailControls from './ThumbnailControls';
import ElementLibrary from './ElementLibrary';
import BatchExportPanel from './BatchExportPanel';
import { Sparkles, Download, Loader2, RefreshCw, Library, Sliders, Users, Image, Settings, Type, Blend } from 'lucide-react';
import { saveAs } from 'file-saver';
import { generateThumbnail } from '../modules/ai/dalleService';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';
import PeopleExtractor from './PeopleExtractor';
import SubtitleGenerator from './SubtitleGenerator';
import CreatorTypeSelector from './CreatorTypeSelector';
import CostOptimizationPanel from './CostOptimizationPanel';
import GenerationPanel from './GenerationPanel';
import { ThumbnailElement, ThumbnailElementType } from '../types';

interface ThumbnailVariation {
  url: string;
  label: string;
}

const ThumbnailEditor: React.FC = () => {
  const { 
    videoData, 
    thumbnailElements, 
    setThumbnailElements, 
    contextSummary, 
    selectedReferenceThumbnails,
    participants,
    creatorType,
    generationSettings,
    updateGenerationSettings,
    styleConsistency,
    addParticipant,
    updateParticipant
  } = useVideoStore();
  
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<ThumbnailVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number>(-1);
  const [exporting, setExporting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [blendRegenerating, setBlendRegenerating] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showElementControls, setShowElementControls] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('elements');

  const handleEditElement = (id: string) => {
    setSelectedElementId(id);
    setShowElementControls(true);
    setActiveTab('controls');
  };

  if (!videoData) {
    return null;
  }

  const handleCloseElementControls = () => {
    setSelectedElementId(null);
    setShowElementControls(false);
  };

  const handleRegenerate = async () => {
    if (selectedVariation === -1) return;
    
    setRegenerating(true);
    try {
      const result = await generateThumbnail(
        videoData,
        thumbnailElements,
        {
          clickbaitIntensity: generationSettings.clickbaitIntensity,
          variationCount: 1,
          language: videoData.language.code,
          selectedReferenceThumbnails,
          contextSummary,
          styleConsistency,
          creativeDirection: generationSettings.creativeDirection,
          costOptimization: generationSettings.costOptimization,
          creatorType,
          participants
        }
      );
      
      // Replace the selected variation with the new one
      const newVariations = [...variations];
      newVariations[selectedVariation] = result[0];
      setVariations(newVariations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate thumbnail';
      alert(errorMessage);
    } finally {
      setRegenerating(false);
    }
  };

  const capturePreviewWithElements = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const previewElement = document.querySelector('[data-thumbnail-preview]') as HTMLElement;
      if (!previewElement) {
        reject(new Error('Preview element not found'));
        return;
      }

                    // Use html2canvas for high-quality capture
       import('html2canvas').then(html2canvas => {
         html2canvas.default(previewElement, {
           useCORS: true,
           allowTaint: true
         }).then(canvas => {
           const dataURL = canvas.toDataURL('image/png', 1.0);
           resolve(dataURL);
         }).catch(reject);
       }).catch(reject);
    });
  };

  const handleRegenerateWithElements = async () => {
    if (selectedVariation === -1 || thumbnailElements.length === 0) {
      alert('Please select a variation and add some elements first');
      return;
    }
    
    setBlendRegenerating(true);
    try {
      // Capture current preview with elements
      const previewImage = await capturePreviewWithElements();
      
      // Create enhanced prompt that includes the elements
      const elementDescriptions = thumbnailElements.map(el => {
        if (el.type === 'text') {
          return `Text element "${el.content}" at ${el.x}%, ${el.y}% with ${el.size}px font size in ${el.color} color`;
        } else if (el.type === 'image') {
          return `Image element at ${el.x}%, ${el.y}% with ${el.size}px size`;
        }
        return '';
      }).filter(Boolean).join(', ');

      const result = await generateThumbnail(
        videoData,
        thumbnailElements,
        {
          clickbaitIntensity: generationSettings.clickbaitIntensity,
          variationCount: 1,
          language: videoData.language.code,
          selectedReferenceThumbnails,
          contextSummary: `${contextSummary}\n\nBLEND ELEMENTS: Naturally integrate these overlay elements into the scene: ${elementDescriptions}. Make text look like it's painted or burned into the scene, make images look like they belong in the environment. The goal is to make everything look cohesive and professionally composed, not overlaid.`,
          styleConsistency,
          creativeDirection: generationSettings.creativeDirection,
          costOptimization: generationSettings.costOptimization,
          creatorType,
          participants,
          previewImage, // Pass the captured preview
          blendMode: true // Special flag for element blending
        }
      );
      
      // Replace the selected variation with the new one
      const newVariations = [...variations];
      newVariations[selectedVariation] = result[0];
      setVariations(newVariations);
      
      // Clear elements since they're now part of the image
      setThumbnailElements([]);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate with elements';
      alert(errorMessage);
    } finally {
      setBlendRegenerating(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const results = await generateThumbnail(
        videoData,
        thumbnailElements,
        {
          clickbaitIntensity: generationSettings.clickbaitIntensity,
          variationCount: generationSettings.variationCount,
          language: videoData.language.code,
          selectedReferenceThumbnails,
          contextSummary,
          styleConsistency,
          creativeDirection: generationSettings.creativeDirection,
          costOptimization: generationSettings.costOptimization,
          creatorType,
          participants
        }
      );
      setVariations(results);
      setSelectedVariation(-1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate thumbnail';
      alert(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (selectedVariation === -1 || !variations[selectedVariation]) {
      alert('Please select a variation to export');
      return;
    }
    
    setExporting(true);
    try {
      const response = await fetch(variations[selectedVariation].url, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        }
      });

      if (!response.ok) throw new Error('Failed to download image');
      if (!response.headers.get('content-type')?.includes('image/')) {
        throw new Error('Invalid image response');
      }
      
      const blob = await response.blob();
      const filename = `thumbnail-${Date.now()}.png`;
      saveAs(blob, filename);
    } catch (error) {
      console.error('Error exporting thumbnail:', error);
      const message = error instanceof Error ? error.message : 'Failed to export thumbnail';
      alert(`Export failed: ${message}\nPlease try again or generate a new variation.`);
    } finally {
      setExporting(false);
    }
  };

  // Handle canvas drop events for text and people elements
  const handleCanvasDrop = (dataTransfer: DataTransfer, x: number, y: number) => {
    try {
      const data = JSON.parse(dataTransfer.getData('text/plain'));
      
      if (data.type === 'text') {
        // Add text element
        const newElement: ThumbnailElement = {
          id: `text-${Date.now()}`,
          type: 'text' as ThumbnailElementType,
          content: data.content,
          x,
          y,
          size: data.style === 'title' ? 32 : 24,
          color: '#ffffff',
          styles: {
            bold: data.style === 'highlight' || data.style === 'number',
            italic: data.style === 'question',
            underline: false,
            align: 'center',
            shadow: true
          }
        };
        
        setThumbnailElements([...thumbnailElements, newElement]);
      } 
      else if (data.type === 'person') {
        // Check if we already have this person in participants
        const existingPersonIndex = participants.findIndex(p => p.id === data.id);
        
        // Calculate position based on drop coordinates
        const position = calculatePositionFromX(x);
        
        if (existingPersonIndex >= 0) {
          // Update existing person's position
          updateParticipant(existingPersonIndex, { position });
        } else {
          // Add as new participant
          addParticipant({
            id: data.id,
            name: data.name || 'Unnamed Person',
            imageUrl: data.imageUrl,
            position,
            emphasis: 'primary'
          });
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  // Helper to calculate position string from x coordinate
  const calculatePositionFromX = (x: number): 'left' | 'center' | 'right' => {
    // This assumes the canvas width is 1280px (16:9 ratio for 720p height)
    // Adjust these values based on your actual canvas size
    const canvasWidth = 1280;
    const third = canvasWidth / 3;
    
    if (x < third) return 'left';
    if (x < third * 2) return 'center';
    return 'right';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-12rem)]">
      <div className="lg:col-span-3 order-2 lg:order-1">
        <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-4">
          {variations.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedVariation === index ? 'ring-4 ring-purple-500 scale-[1.02]' : 'hover:ring-2 hover:ring-purple-400'
                  }`}
                  onClick={() => setSelectedVariation(index)}
                >
                  <img
                    src={variation.url}
                    alt={variation.label}
                    className="w-full h-auto"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                    {variation.label}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <ThumbnailPreview 
            videoTitle={thumbnailElements.length > 0 ? '' : videoData.title}
            videoTypography={videoData.typography}
            elements={thumbnailElements} 
            onElementsChange={setThumbnailElements}
            generatedImage={selectedVariation !== -1 ? variations[selectedVariation].url : null}
            isGenerating={generating}
            onDrop={handleCanvasDrop}
            data-thumbnail-preview
          />
          
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2 mr-4">
              <label className="text-sm text-gray-300">Variations:</label>
              <select
                value={generationSettings.variationCount}
                onChange={(e) => updateGenerationSettings({ variationCount: Number(e.target.value) as 1 | 2 | 3 })}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
            
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center transition-colors duration-300"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
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
            
            {variations.length > 0 && selectedVariation !== -1 && (
              <>
                                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center transition-colors duration-300"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Regenerate
                      </>
                    )}
                  </button>
                
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center transition-colors duration-300"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Export
                    </>
                  )}
                </button>
              </>
            )}

            {/* NEW BUTTON: Regenerate WITH Elements */}
            {thumbnailElements.length > 0 && (
              <div className="relative">
                <button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center transition-all duration-300 transform hover:scale-105"
                  onClick={handleRegenerateWithElements}
                  disabled={blendRegenerating}
                  title="Blend elements naturally into the image"
                >
                  {blendRegenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Blending Elements...
                    </>
                  ) : (
                    <>
                      <Blend className="w-5 h-5 mr-2" />
                      Blend Elements
                    </>
                  )}
                </button>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black bg-opacity-90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="font-semibold mb-1">🎨 Blend Elements</div>
                  <div>Captures your current preview and regenerates the image with text/shapes naturally integrated into the scene - making them look like they belong in the original photo!</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            )}

            {/* Help text for blend feature */}
            {thumbnailElements.length > 0 && !blendRegenerating && (
              <div className="w-full mt-4 p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-purple-300 mb-1">Pro Tip: Blend Elements</div>
                    <div className="text-gray-300">
                      Use "Blend Elements" to make your text and graphics look naturally integrated into the scene - 
                      as if they were painted, carved, or originally part of the image. Perfect for professional-looking thumbnails!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="col-span-1 order-1 lg:order-2">
        <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 overflow-hidden">
          <Tabs defaultTab={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab id="elements">
                <Library className="w-5 h-5 mr-1" />
                Elements
              </Tab>
              <Tab id="people">
                <Users className="w-5 h-5 mr-1" />
                People
              </Tab>
              <Tab id="settings">
                <Settings className="w-5 h-5 mr-1" />
                Settings
              </Tab>
              <Tab id="export">
                <Download className="w-5 h-5 mr-1" />
                Export
              </Tab>
              <Tab id="generate">
                <Sparkles className="w-5 h-5 mr-1" />
                Generate
              </Tab>
            </TabList>
            
            <TabPanel id="elements">
              <div className="p-4">
                <SubtitleGenerator />
                <ElementLibrary onEditElement={handleEditElement} onSelectElement={(element: ThumbnailElement) => {
                  setThumbnailElements([...thumbnailElements, element]);
                }} />
              </div>
            </TabPanel>
            
            <TabPanel id="people">
              <div className="p-4">
                <PeopleExtractor />
              </div>
            </TabPanel>
            
            <TabPanel id="controls">
              <div className="p-4">
                {selectedElementId && (
                  <ThumbnailControls
                    selectedElementId={selectedElementId}
                    showElementControls={showElementControls}
                    onClose={handleCloseElementControls}
                  />
                )}
              </div>
            </TabPanel>
            
            <TabPanel id="settings">
              <div className="p-4 space-y-4">
                <CreatorTypeSelector />
                <CostOptimizationPanel />
              </div>
            </TabPanel>
            
            <TabPanel id="export">
              <div className="p-4">
                <BatchExportPanel />
              </div>
            </TabPanel>
            
            <TabPanel id="generate">
              <div className="p-4">
                <GenerationPanel onGenerate={handleGenerate} />
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailEditor;