import React from 'react';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import ThumbnailEditor from './components/ThumbnailEditor';
import Footer from './components/Footer';
import DemoEnhancer from './components/DemoEnhancer';
import { Plus, Search, Settings, ChevronUp, Sparkles, Users, Image, Download, Video, X, Youtube, Palette, Sliders, Play, Camera, Zap, TrendingUp } from 'lucide-react';
import { useVideoStore } from './store/videoStore';
import { getVideoMetadata, extractVideoId, extractChannelId, getChannelThumbnails } from './lib/youtubeApi';
import { VideoData, ReferenceChannel } from './types';
import './styles/App.css';

function App() {
  const [activeWorkflow, setActiveWorkflow] = useState<'landing' | 'editor'>('landing');
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [landingUrl, setLandingUrl] = useState('');
  const [loadingLandingUrl, setLoadingLandingUrl] = useState(false);
  
  // Channel handling state
  const [detectedChannel, setDetectedChannel] = useState<ReferenceChannel | null>(null);
  const [showChannelOptions, setShowChannelOptions] = useState(false);
  const [channelStyleSettings, setChannelStyleSettings] = useState({
    likeness: 7, // 1-10 scale for style consistency
    clickbaitLevel: 5, // 1-10 scale for clickbait intensity
    creativeFreedom: 5, // 1-10 scale for creative freedom vs consistency
    bulkMode: false
  });
  
  const videoData = useVideoStore(state => state.videoData);
  const setVideoData = useVideoStore(state => state.setVideoData);

  // Check for demo mode
  useEffect(() => {
    const demoMode = localStorage.getItem('demo-mode') === 'true';
    setIsDemoMode(demoMode);
  }, []);

  // Auto-switch to editor when video data is loaded
  useEffect(() => {
    if (videoData) {
      setActiveWorkflow('editor');
    } else {
      setActiveWorkflow('landing');
    }
  }, [videoData]);

  const toggleRecordingControls = () => {
    setShowRecordingControls(!showRecordingControls);
  };

  const detectUrlType = (url: string): 'video' | 'channel' | 'invalid' => {
    if (!url.trim()) return 'invalid';
    
    const videoId = extractVideoId(url);
    const channelId = extractChannelId(url);
    
    if (videoId) return 'video';
    if (channelId) return 'channel';
    return 'invalid';
  };

  const handleChannelDetection = async (url: string) => {
    const channelId = extractChannelId(url);
    if (!channelId) return null;

    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const channelData = await getChannelThumbnails(channelId, apiKey);
      setDetectedChannel(channelData);
      return channelData;
    } catch (error) {
      console.error('Error fetching channel data:', error);
      return null;
    }
  };

  const createBlankCanvasWithChannelStyle = async () => {
    if (!detectedChannel) return;

    // Create a blank canvas with channel-informed settings
    const blankVideoData: VideoData = {
      id: 'blank-canvas-channel',
      channelId: detectedChannel.id,
      channelTitle: detectedChannel.title,
      channelReference: detectedChannel,
      title: 'Blank Canvas Project',
      description: `New thumbnail project based on ${detectedChannel.title} channel style`,
      thumbnailUrl: '',
      tags: [],
      language: { code: 'en', name: 'English', direction: 'ltr' },
      typography: {
        direction: 'ltr',
        fontFamily: 'var(--font-primary), system-ui, sans-serif'
      },
      statistics: { views: 0, likes: 0, comments: 0 },
      styleConsistency: channelStyleSettings.likeness / 10
    };

    setVideoData(blankVideoData);
    setShowChannelOptions(false);
    setDetectedChannel(null);
    setLandingUrl('');
  };

  const handleStartBlankCanvas = () => {
    const blankVideoData: VideoData = {
      id: 'blank-canvas',
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
      language: { code: 'en', name: 'English', direction: 'ltr' },
      isLiveContent: false,
      typography: {
        direction: 'ltr',
        fontFamily: 'Arial, sans-serif'
      }
    };
    
    setVideoData(blankVideoData);
  };

  const handleLandingUrlSubmit = async () => {
    if (!landingUrl.trim()) {
      console.warn('Empty URL provided');
      return;
    }

    setLoadingLandingUrl(true);
    
    try {
      const urlType = detectUrlType(landingUrl);
      
      if (urlType === 'channel') {
        // Handle channel URL
        const channelData = await handleChannelDetection(landingUrl);
        if (channelData) {
          setShowChannelOptions(true);
        } else {
          throw new Error('Could not fetch channel data');
        }
        setLoadingLandingUrl(false);
        return;
      }
      
      if (urlType === 'video') {
        // Handle video URL (existing logic)
        const videoId = extractVideoId(landingUrl);
        if (!videoId) {
          console.warn('Invalid YouTube video URL:', landingUrl);
          setLandingUrl(''); // Clear the invalid input
        setLoadingLandingUrl(false);
        return;
      }

      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const videoDataResult = await getVideoMetadata(videoId, apiKey);
      setVideoData(videoDataResult);
        setLandingUrl('');
      } else {
        // Invalid URL - just clear and log
        console.warn('Invalid URL provided:', landingUrl);
        setLandingUrl('');
      }
    } catch (error) {
      console.error('Error processing URL:', error);
      setLandingUrl(''); // Clear on error
    } finally {
      setLoadingLandingUrl(false);
    }
  };

  const handleLandingKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLandingUrlSubmit();
    }
  };

  // YouTube content type use cases based on research
  const popularUseCases = [
    { icon: Play, title: 'Gaming Content', description: 'Epic moments, reactions, tutorials', color: 'bg-red-600' },
    { icon: Camera, title: 'Vlogs & Lifestyle', description: 'Daily life, travel, personal stories', color: 'bg-purple-600' },
    { icon: TrendingUp, title: 'News & Commentary', description: 'Breaking news, opinions, analysis', color: 'bg-blue-600' },
    { icon: Zap, title: 'Live Streams', description: 'Real-time interaction, events', color: 'bg-green-600' },
    { icon: Users, title: 'Educational', description: 'Tutorials, how-tos, courses', color: 'bg-yellow-600' },
    { icon: Sparkles, title: 'Entertainment', description: 'Comedy, music, performances', color: 'bg-pink-600' }
  ];

  const renderLanding = () => (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Main Landing Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Amazing Video Preview Studio
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
            Create scroll-stopping YouTube thumbnails with AI. Mobile-first design for creators on the go.
          </p>
        </div>

        {/* Quick Start Options */}
        <div className="w-full max-w-2xl space-y-6">
          {/* URL Input */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Youtube className="w-5 h-5 mr-2 text-red-500" />
              Load Existing Video or Channel
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                onKeyPress={handleLandingKeyPress}
                placeholder="Paste YouTube URL here..."
                className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                disabled={loadingLandingUrl}
              />
              <button
                onClick={handleLandingUrlSubmit}
                disabled={loadingLandingUrl}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center min-w-[120px]"
              >
                {loadingLandingUrl ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
          </div>

          {/* OR Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-4 text-gray-400 text-sm font-medium">OR</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          {/* Blank Canvas */}
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-green-500" />
              Start from Scratch
            </h3>
            <button
              onClick={handleStartBlankCanvas}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Blank Canvas
            </button>
          </div>
        </div>

        {/* Popular Use Cases */}
        <div className="mt-16 w-full max-w-6xl">
          <h3 className="text-2xl font-bold text-center mb-8">Built for Every Creator</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularUseCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-gray-700/50 transition-colors cursor-pointer group"
              >
                <div className={`w-12 h-12 ${useCase.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <useCase.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-sm font-semibold mb-1">{useCase.title}</h4>
                <p className="text-xs text-gray-400">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Options Modal */}
      {showChannelOptions && detectedChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Channel Detected</h3>
            <p className="text-gray-300 mb-6">
              Found channel: <strong>{detectedChannel.title}</strong>
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Style Likeness (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={channelStyleSettings.likeness}
                  onChange={(e) => setChannelStyleSettings(prev => ({ ...prev, likeness: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-400">{channelStyleSettings.likeness}/10</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Clickbait Level (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={channelStyleSettings.clickbaitLevel}
                  onChange={(e) => setChannelStyleSettings(prev => ({ ...prev, clickbaitLevel: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-400">{channelStyleSettings.clickbaitLevel}/10</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={createBlankCanvasWithChannelStyle}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Use Channel Style
              </button>
              <button
                onClick={() => {
                  setShowChannelOptions(false);
                  setDetectedChannel(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );

  const renderEditor = () => (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <ThumbnailEditor />
      </div>
    </div>
  );

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        {/* Floating Recording Control Button */}
        <button
          onClick={toggleRecordingControls}
          className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
            showRecordingControls 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
          title={showRecordingControls ? 'Hide Recording Controls' : 'Show Recording Controls'}
        >
          {showRecordingControls ? (
            <X className="w-5 h-5" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </button>

        {/* Recording Controls Panel */}
        {showRecordingControls && (
          <div className="fixed top-16 right-4 z-40 w-80 bg-black bg-opacity-90 backdrop-blur-lg rounded-xl border border-gray-700 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Recording Controls</h3>
              </div>
              <button
                onClick={toggleRecordingControls}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Demo Mode</span>
                <button
                  onClick={() => {
                    const newMode = !isDemoMode;
                    setIsDemoMode(newMode);
                    localStorage.setItem('demo-mode', newMode.toString());
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                  isDemoMode ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      isDemoMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Enhancer */}
        {isDemoMode && <DemoEnhancer />}

        {/* Main Content */}
        {activeWorkflow === 'landing' ? renderLanding() : renderEditor()}
      </div>
    </ThemeProvider>
  );
}

export default App;