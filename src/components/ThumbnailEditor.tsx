import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import ThumbnailPreview from './ThumbnailPreview';
import ThumbnailControls from './ThumbnailControls';
import ElementLibrary from './ElementLibrary';
import BatchExportPanel from './BatchExportPanel';

import { Sparkles, Download, Loader2, RefreshCw, Library, Sliders, Users, Image, Settings, Type, Blend, Youtube, Link } from 'lucide-react';
import { saveAs } from 'file-saver';
import { generateThumbnail } from '../modules/ai/dalleService';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';
import PeopleExtractor from './PeopleExtractor';
import SubtitleGenerator from './SubtitleGenerator';
import CreatorTypeSelector from './CreatorTypeSelector';
import CostOptimizationPanel from './CostOptimizationPanel';
import GenerationPanel from './GenerationPanel';
import { ThumbnailElement, ThumbnailElementType } from '../types';
import { getVideoMetadata, extractVideoId } from '../lib/youtubeApi';

interface ThumbnailVariation {
  url: string;
  label: string;
}

const ThumbnailEditor: React.FC = () => {
  const { 
    videoData, 
    setVideoData,
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
  const [activeTab, setActiveTab] = useState<string>(videoData ? 'elements' : 'video');
  const [videoUrl, setVideoUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(false);


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

  const handleVideoLoad = async () => {
    if (!videoUrl.trim()) return;

    setLoadingVideo(true);
    try {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const videoDataResult = await getVideoMetadata(videoId, apiKey);
      setVideoData(videoDataResult);
      setVideoUrl('');
      setActiveTab('elements'); // Switch to elements tab after loading
    } catch (error) {
      console.error('Error loading video:', error);
      alert('Failed to load video. Please check the URL and try again.');
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleCreateBlankTemplate = () => {
    // Create a blank template with minimal data
    const blankTemplate = {
      id: 'blank-template',
      title: 'Custom Thumbnail',
      description: 'Create your custom thumbnail from scratch',
      channelTitle: 'Custom Creator',
      publishedAt: new Date().toISOString(),
      duration: '0:00',
      viewCount: '0',
      likeCount: '0',
      commentCount: '0',
      thumbnailUrl: '',
      channelId: 'blank',
      tags: ['custom'],
      categoryId: '0',
      language: { code: 'en', name: 'English', direction: 'ltr' as const },
      isLiveContent: false,
      typography: {
        direction: 'ltr' as const,
        fontFamily: 'Arial, sans-serif'
      }
    };
    
    setVideoData(blankTemplate);
    setActiveTab('elements'); // Switch to elements tab after creating blank
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
      // Enhanced generation options with channel style integration
      const generationOptions = {
        clickbaitIntensity: generationSettings.clickbaitIntensity,
        variationCount: generationSettings.variationCount,
        language: videoData.language.code,
        selectedReferenceThumbnails,
        contextSummary,
        styleConsistency: videoData.styleConsistency || styleConsistency,
        creativeDirection: generationSettings.creativeDirection,
        costOptimization: generationSettings.costOptimization,
        creatorType,
        participants,
        // Channel-specific enhancements
        channelReference: videoData.channelReference,
        channelStyleLikeness: videoData.styleConsistency,
        useChannelBranding: !!videoData.channelReference,
        bulkMode: false // Will be enhanced for bulk creation
      };

      const results = await generateThumbnail(
        videoData,
        thumbnailElements,
        generationOptions
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
          
          {/* Channel Info Banner */}
          {videoData?.channelReference && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {videoData.channelReference.title}
                    </h3>
                    <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                      Channel Style Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    Style consistency: {Math.round((videoData.styleConsistency || 0.7) * 100)}% • 
                    Using {videoData.channelReference.thumbnails.latest.length} reference thumbnails
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {videoData.channelReference.thumbnails.latest.slice(0, 3).map((thumb, index) => (
                    <img
                      key={index}
                      src={thumb}
                      alt={`Reference ${index + 1}`}
                      className="w-8 h-6 object-cover rounded border border-gray-600"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {videoData ? (
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
          ) : (
            <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-8 text-center">
              <div className="max-w-lg mx-auto">
                <Image className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Thumbnail Studio
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Create professional thumbnails with AI-powered design. Start with a blank canvas or load a YouTube video.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button 
                    onClick={handleCreateBlankTemplate}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    <Image className="w-5 h-5 mx-auto mb-2" />
                    Start with Blank Canvas
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('video')}
                    className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all duration-300"
                  >
                    <Youtube className="w-5 h-5 mx-auto mb-2" />
                    Load YouTube Video
                  </button>
                </div>
                
                <div className="mt-8 grid grid-cols-3 gap-4 text-sm text-gray-400">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-xs">1</span>
                    </div>
                    <p>Start Creating</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-xs">2</span>
                    </div>
                    <p>Design & AI</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-xs">3</span>
                    </div>
                    <p>Export</p>
                  </div>
                </div>


              </div>
            </div>
          )}
          
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

            {/* FIXED: Blend Elements button only shows after generation AND when elements exist */}
            {thumbnailElements.length > 0 && variations.length > 0 && selectedVariation !== -1 && (
              <div className="relative group">
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
                
                {/* Enhanced Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-black bg-opacity-95 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="font-semibold mb-2 text-purple-300">🎨 Blend Elements</div>
                  <div className="text-gray-200 leading-relaxed">
                    Captures your current preview and regenerates the image with text/shapes naturally integrated into the scene - making them look like they belong in the original photo!
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            )}

            {/* Enhanced Help text for blend feature */}
            {thumbnailElements.length > 0 && variations.length > 0 && selectedVariation !== -1 && !blendRegenerating && (
              <div className="w-full mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-semibold text-purple-300 mb-2">Pro Tip: Blend Elements</div>
                    <div className="text-gray-300 leading-relaxed">
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
              {!videoData && (
                <Tab id="video">
                  <Youtube className="w-4 h-4 mr-1" />
                  <span className="text-xs">Video</span>
                </Tab>
              )}
              <Tab id="elements">
                <Library className="w-4 h-4 mr-1" />
                <span className="text-xs">Elements</span>
              </Tab>
              <Tab id="people">
                <Users className="w-4 h-4 mr-1" />
                <span className="text-xs">People</span>
              </Tab>
              <Tab id="settings">
                <Settings className="w-4 h-4 mr-1" />
                <span className="text-xs">Settings</span>
              </Tab>
              <Tab id="export">
                <Download className="w-4 h-4 mr-1" />
                <span className="text-xs">Export</span>
              </Tab>
              <Tab id="generate">
                <Sparkles className="w-4 h-4 mr-1" />
                <span className="text-xs">Generate</span>
              </Tab>
            </TabList>
            
            {!videoData && (
              <TabPanel id="video">
                <div className="p-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2 text-gray-200">Start Creating</h3>
                    <p className="text-sm text-gray-400">Choose how you want to begin your thumbnail</p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Blank Canvas Option - Primary */}
                    <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="text-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Image className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-white mb-1">Start with Blank Canvas</h4>
                        <p className="text-xs text-gray-300">Perfect for custom designs and creative freedom</p>
                      </div>
                      <button
                        onClick={handleCreateBlankTemplate}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        Create Blank Thumbnail
                      </button>
                    </div>

                    <div className="text-center text-sm text-gray-400">
                      <span>or</span>
                    </div>

                    {/* YouTube Video Option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Load from YouTube Video
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
                          disabled={loadingVideo}
                          onKeyPress={(e) => e.key === 'Enter' && handleVideoLoad()}
                        />
                        <button
                          onClick={handleVideoLoad}
                          disabled={loadingVideo || !videoUrl.trim()}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                          {loadingVideo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Load'
                          )}
                        </button>
                      </div>
                    </div>
                    

                  </div>
                </div>
              </TabPanel>
            )}
            
            <TabPanel id="elements">
              <div className="p-4">
                {videoData ? (
                  <>
                    <SubtitleGenerator />
                    <ElementLibrary onEditElement={handleEditElement} onSelectElement={(element: ThumbnailElement) => {
                      setThumbnailElements([...thumbnailElements, element]);
                    }} />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Start Creating</h3>
                    <p className="text-sm text-gray-400 mb-4">Create a blank canvas or load a video to access elements</p>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleCreateBlankTemplate}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        Start Blank Canvas
                      </button>
                      <button 
                        onClick={() => setActiveTab('video')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        Load Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>
            
            <TabPanel id="people">
              <div className="p-4">
                {videoData ? (
                  <PeopleExtractor />
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No Video Loaded</h3>
                    <p className="text-sm text-gray-400 mb-4">Load a YouTube video first to extract people</p>
                    <button 
                      onClick={() => setActiveTab('video')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Load Video
                    </button>
                  </div>
                )}
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