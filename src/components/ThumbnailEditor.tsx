import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import ThumbnailPreview from './ThumbnailPreview';
import ThumbnailControls from './ThumbnailControls';
import ElementLibrary from './ElementLibrary';
import BatchExportPanel from './BatchExportPanel';
import ExportMenu from './ExportMenu';
import LoadingState from './LoadingState';

import { 
  Sparkles, Download, Loader2, RefreshCw, Library, Sliders, Users, Image, Settings, 
  Type, Blend, Youtube, Link, Home, Maximize2, Minimize2, RotateCcw, Share2,
  Play, Camera, Zap, TrendingUp, Eye, Heart, MessageCircle, ArrowLeft,
  PanelLeftOpen, PanelLeftClose, Monitor, Tablet, Smartphone
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { generateThumbnail } from '../modules/ai/dalleService';
import { generateEnhancedThumbnails, analyzeVideoScreenshots, checkSpelling, SUPPORTED_LANGUAGES } from '../modules/ai/enhancedGenerationService';
import { extractFacesFromImage, generateWithLora } from '../modules/ai/replicateService';
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

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type PanelMode = 'collapsed' | 'overlay' | 'side';

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
  
  // Core state
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<ThumbnailVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number>(-1);
  
  // Enhanced generation states
  const [enhancedMode, setEnhancedMode] = useState(false);
  const [videoScreenshots, setVideoScreenshots] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [extractedFaces, setExtractedFaces] = useState<any[]>([]);
  const [selectedLora, setSelectedLora] = useState<string>('');
  const [spellCheckResults, setSpellCheckResults] = useState<Record<string, any>>({});
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // UI state for mobile-first design
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [panelMode, setPanelMode] = useState<PanelMode>('side');
  const [activePanel, setActivePanel] = useState<'generate' | 'elements' | 'people' | 'export'>('generate');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  
  // Active element editing
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showElementControls, setShowElementControls] = useState(false);
  
  // Quick actions state
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Responsive layout detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewMode('mobile');
        setPanelMode('overlay');
      } else if (width < 1024) {
        setViewMode('tablet');
        setPanelMode('overlay');
      } else {
        setViewMode('desktop');
        setPanelMode('side');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEditElement = (id: string) => {
    setSelectedElementId(id);
    setShowElementControls(true);
    setActivePanel('elements');
  };

  const handleBackToHome = () => {
    setVideoData(null);
  };

  if (!videoData) {
    return null;
  }

  const handleCloseElementControls = () => {
    setSelectedElementId(null);
    setShowElementControls(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let result;
      
      if (enhancedMode) {
        // Use enhanced generation with local analysis and multi-language support
        const enhancedResult = await generateEnhancedThumbnails(
        videoData,
        thumbnailElements,
        {
          clickbaitIntensity: generationSettings.clickbaitIntensity,
            variationCount: generationSettings.variationCount,
            creatorType: creatorType || undefined,
            participants,
            videoFile: localVideoFile || undefined,
            videoScreenshots: videoScreenshots.length > 0 ? videoScreenshots : undefined,
            targetLanguages: selectedLanguages,
            faceSwapEnabled: generationSettings.enableFaceSwap,
          costOptimization: generationSettings.costOptimization,
            mobileOptimized: viewMode === 'mobile'
          }
        );
        
        // Convert enhanced results to standard format
        result = enhancedResult.map(item => ({
          url: item.url,
          label: item.label,
          prompt: `Enhanced: ${item.language} (Confidence: ${(item.confidence * 100).toFixed(0)}%)`
        }));
      } else {
        // Standard generation
        result = await generateThumbnail(
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
            participants,
            enableFaceSwap: generationSettings.enableFaceSwap
          }
        );
      }
      
      setVariations(result);
      if (result.length > 0) {
        setSelectedVariation(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate thumbnail';
      console.error('Generation error:', err);
      alert(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    setShowExportMenu(true);
  };

  const togglePreviewFullscreen = () => {
    setIsPreviewFullscreen(!isPreviewFullscreen);
  };

  const togglePanel = () => {
    if (panelMode === 'collapsed') {
      setPanelMode(viewMode === 'desktop' ? 'side' : 'overlay');
    } else {
      setPanelMode('collapsed');
    }
  };

  // Enhanced functionality handlers
  const handleVideoFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setLocalVideoFile(file);
      // Auto-enable enhanced mode when video is uploaded
      setEnhancedMode(true);
    }
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setVideoScreenshots(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFaceExtraction = async () => {
    if (!videoData?.thumbnailUrl) return;
    
    try {
      const faces = await extractFacesFromImage(videoData.thumbnailUrl);
      setExtractedFaces(faces);
    } catch (error) {
      console.error('Face extraction failed:', error);
    }
  };

  const handleSpellCheck = async (text: string, language: string) => {
    try {
      const result = await checkSpelling(text, language);
      setSpellCheckResults(prev => ({
        ...prev,
        [text]: result
      }));
    } catch (error) {
      console.error('Spell check failed:', error);
    }
  };

  const handleLanguageToggle = (langCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langCode) 
        ? prev.filter(l => l !== langCode)
        : [...prev, langCode]
    );
  };

  // Quick action buttons for mobile
  const quickActions = [
    { icon: Sparkles, label: 'Generate', action: handleGenerate, color: 'bg-purple-600', loading: generating },
    { icon: Download, label: 'Export', action: handleExport, color: 'bg-green-600' },
    { icon: RefreshCw, label: 'Reset', action: () => setThumbnailElements([]), color: 'bg-red-600' },
    { icon: Eye, label: 'Preview', action: togglePreviewFullscreen, color: 'bg-blue-600' }
  ];

  // Panel content based on active panel
  const renderPanelContent = () => {
    switch (activePanel) {
      case 'generate':
  return (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                Generate Thumbnails
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <GenerationPanel />
                  </div>
                </div>
        );
      
      case 'elements':
        return (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold flex items-center">
                <Library className="w-5 h-5 mr-2 text-blue-400" />
                Element Library
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ElementLibrary />
              {showElementControls && selectedElementId && (
                <div className="border-t border-gray-700 mt-4">
                                     <ThumbnailControls
                     selectedElementId={selectedElementId}
                     showElementControls={showElementControls}
                     onClose={handleCloseElementControls}
                   />
                </div>
              )}
                    </div>
                  </div>
        );
      
      case 'people':
        return (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-orange-400" />
                People & Characters
              </h3>
                    </div>
            <div className="flex-1 overflow-y-auto">
              <PeopleExtractor />
              <div className="mt-4">
                <CreatorTypeSelector />
                    </div>
                  </div>
                </div>
        );
      
      case 'export':
        return (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold flex items-center">
                <Download className="w-5 h-5 mr-2 text-green-400" />
                Export & Share
              </h3>
                </div>
            <div className="flex-1 overflow-y-auto">
              <BatchExportPanel />
              <div className="mt-4">
                <CostOptimizationPanel />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Panel navigation tabs
  const panelTabs = [
    { id: 'generate', icon: Sparkles, label: 'Generate', color: 'text-purple-400' },
    { id: 'elements', icon: Library, label: 'Elements', color: 'text-blue-400' },
    { id: 'people', icon: Users, label: 'People', color: 'text-orange-400' },
    { id: 'export', icon: Download, label: 'Export', color: 'text-green-400' }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Mobile/Tablet Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 lg:hidden">
            <button
          onClick={handleBackToHome}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
            </button>
            
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {videoData.title.length > 30 ? videoData.title.substring(0, 30) + '...' : videoData.title}
          </span>
        </div>

        <div className="flex items-center space-x-2">
                                  <button
            onClick={togglePanel}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            {panelMode === 'collapsed' ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                  </button>
                
                <button
            onClick={togglePreviewFullscreen}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            {isPreviewFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Panel */}
        {(panelMode === 'side' && viewMode === 'desktop') && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* Panel Navigation */}
            <div className="flex border-b border-gray-700">
              {panelTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 p-3 text-sm font-medium transition-colors border-b-2 ${
                    activePanel === tab.id
                      ? `${tab.color} border-current`
                      : 'text-gray-400 hover:text-gray-300 border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mx-auto mb-1" />
                  <div className="hidden lg:block">{tab.label}</div>
                </button>
              ))}
            </div>
            
            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {renderPanelContent()}
                </div>
              </div>
            )}

        {/* Preview Area */}
        <div className={`flex-1 flex flex-col ${isPreviewFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Home
              </button>
              
              <div className="text-sm text-gray-400">
                {videoData.channelTitle} • {videoData.title}
        </div>
      </div>
      
            <div className="flex items-center space-x-2">
              {/* View mode selector */}
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 rounded transition-colors ${viewMode === 'desktop' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('tablet')}
                  className={`p-2 rounded transition-colors ${viewMode === 'tablet' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                      <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 rounded transition-colors ${viewMode === 'mobile' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}
                      >
                  <Smartphone className="w-4 h-4" />
                      </button>
                    </div>

                        <button
                onClick={togglePreviewFullscreen}
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                {isPreviewFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
          {/* Thumbnail Variations */}
          {variations.length > 0 && (
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <div className="flex space-x-2 overflow-x-auto">
                {variations.map((variation, index) => (
                        <button 
                    key={index}
                    onClick={() => setSelectedVariation(index)}
                    className={`flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedVariation === index
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={variation.url}
                      alt={`Variation ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                        </button>
                ))}
                      </div>
                    </div>
          )}

          {/* Main Preview */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            {generating ? (
              <LoadingState 
                stage="generating"
                message="Creating amazing thumbnails..."
                progress={75}
              />
            ) : (
              <div className={`relative ${
                viewMode === 'mobile' ? 'w-64' : 
                viewMode === 'tablet' ? 'w-96' : 
                'w-full max-w-2xl'
              }`}>
                                 <ThumbnailPreview
                   videoTitle={videoData.title}
                   videoTypography={videoData.typography}
                   elements={thumbnailElements}
                   onElementsChange={setThumbnailElements}
                   generatedImage={selectedVariation >= 0 ? variations[selectedVariation]?.url : null}
                   isGenerating={generating}
                 />
                </div>
            )}
          </div>

          {/* Mobile Quick Actions */}
          {viewMode === 'mobile' && !isPreviewFullscreen && (
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex justify-center space-x-4">
                {quickActions.map((action, index) => (
                      <button 
                    key={index}
                    onClick={action.action}
                    disabled={action.loading}
                    className={`${action.color} hover:opacity-90 text-white p-3 rounded-full shadow-lg transition-all disabled:opacity-50`}
                  >
                    {action.loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <action.icon className="w-5 h-5" />
                    )}
                      </button>
                ))}
                    </div>
                  </div>
                )}
              </div>

        {/* Overlay Panel for Mobile/Tablet */}
        {panelMode === 'overlay' && (
          <div className="fixed inset-y-0 right-0 w-80 bg-gray-800 border-l border-gray-700 shadow-xl z-40 flex flex-col">
            {/* Panel Navigation */}
            <div className="flex border-b border-gray-700">
              {panelTabs.map((tab) => (
                    <button 
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 p-3 text-sm font-medium transition-colors border-b-2 ${
                    activePanel === tab.id
                      ? `${tab.color} border-current`
                      : 'text-gray-400 hover:text-gray-300 border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs">{tab.label}</div>
                    </button>
              ))}
              </div>
            
            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {renderPanelContent()}
            </div>
          </div>
        )}

        {/* Overlay backdrop */}
        {panelMode === 'overlay' && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setPanelMode('collapsed')}
                  />
                )}
              </div>

      {/* Export Menu */}
      {showExportMenu && (
                 <ExportMenu
           isOpen={showExportMenu}
           onClose={() => setShowExportMenu(false)}
           thumbnailUrl={selectedVariation >= 0 ? variations[selectedVariation]?.url : undefined}
           variations={variations}
           videoTitle={videoData?.title}
         />
      )}
    </div>
  );
};

export default ThumbnailEditor;