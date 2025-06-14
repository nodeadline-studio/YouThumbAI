import React from 'react';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';

import ThumbnailEditor from './components/ThumbnailEditor';
import Footer from './components/Footer';
import DemoEnhancer from './components/DemoEnhancer';
import { Plus, Search, Settings, ChevronUp, Sparkles, Users, Image, Download, Video, X, Youtube, Palette, Sliders } from 'lucide-react';
import { useVideoStore } from './store/videoStore';
import { getVideoMetadata, extractVideoId, extractChannelId, getChannelThumbnails } from './lib/youtubeApi';
import { VideoData, ReferenceChannel } from './types';
import './styles/App.css';

function App() {

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

  const handleLandingUrlSubmit = async () => {
    if (!landingUrl.trim()) {
      alert('Please enter a YouTube URL');
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
          alert('Invalid YouTube video URL');
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
        // Invalid URL
        alert('Please enter a valid YouTube URL');
      }
    } catch (error) {
      console.error('Error processing URL:', error);
      alert('Error processing URL. Please try again.');
    } finally {
      setLoadingLandingUrl(false);
    }
  };

  const handleLandingKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLandingUrlSubmit();
    }
  };

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
                <div className={`w-10 h-6 rounded-full relative transition-colors ${
                  isDemoMode ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    isDemoMode ? 'translate-x-4' : 'translate-x-1'
                  }`} />
                </div>
              </div>
              
              <button className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors">
                Start Recording
              </button>
              
              <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors">
                Screenshot Mode
              </button>
              
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Recording Settings</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Quality:</span>
                    <span className="text-white">1080p @ 30fps</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Format:</span>
                    <span className="text-white">MP4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Channel Options Modal */}
        {showChannelOptions && detectedChannel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Youtube className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-white">Channel Detected</h2>
                </div>
                <button
                  onClick={() => {
                    setShowChannelOptions(false);
                    setDetectedChannel(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{detectedChannel.title}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Create thumbnails that match this channel's style and branding
                </p>
                
                {/* Channel Thumbnails Preview */}
                {detectedChannel.thumbnails.latest.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Thumbnails</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {detectedChannel.thumbnails.latest.slice(0, 6).map((thumb, index) => (
                        <img
                          key={index}
                          src={thumb}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-16 object-cover rounded-lg border border-gray-600"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Style Settings */}
              <div className="space-y-6 mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <label className="text-sm font-medium text-gray-300">Style Likeness</label>
                    <span className="text-xs text-gray-400">({channelStyleSettings.likeness}/10)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={channelStyleSettings.likeness}
                    onChange={(e) => setChannelStyleSettings(prev => ({ ...prev, likeness: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Creative Freedom</span>
                    <span>Exact Match</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <label className="text-sm font-medium text-gray-300">Clickbait Level</label>
                    <span className="text-xs text-gray-400">({channelStyleSettings.clickbaitLevel}/10)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={channelStyleSettings.clickbaitLevel}
                    onChange={(e) => setChannelStyleSettings(prev => ({ ...prev, clickbaitLevel: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Subtle</span>
                    <span>High Impact</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <label className="text-sm font-medium text-gray-300">Creative Freedom</label>
                    <span className="text-xs text-gray-400">({channelStyleSettings.creativeFreedom}/10)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={channelStyleSettings.creativeFreedom}
                    onChange={(e) => setChannelStyleSettings(prev => ({ ...prev, creativeFreedom: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Consistent</span>
                    <span>Experimental</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="bulkMode"
                    checked={channelStyleSettings.bulkMode}
                    onChange={(e) => setChannelStyleSettings(prev => ({ ...prev, bulkMode: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="bulkMode" className="text-sm font-medium text-gray-300">
                    Enable Bulk Creation Mode
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={createBlankCanvasWithChannelStyle}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Start with Channel Style
                </button>
                
                <button
                  onClick={() => {
                    setShowChannelOptions(false);
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
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Start Blank Canvas
                </button>
              </div>
            </div>
          </div>
        )}

        <Header />
        <main className="container mx-auto px-4 py-8">
          {!videoData ? (
            <div className="max-w-6xl mx-auto">
              {/* Hero Section */}
              <div className="text-center py-16">
                <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Professional YouTube Thumbnails
                  <span className="block text-3xl mt-2 text-gray-300">in 60 seconds</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
                  Transform any YouTube URL into professional thumbnails using AI-powered design and intelligent automation.
                  Perfect for creators, agencies, and marketing teams.
                </p>
                
                {/* Demo Preview */}
                <div className="mb-8 p-6 bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">Paste YouTube URL</h3>
                      <p className="text-sm text-gray-400">Video or Channel - instant analysis & style extraction</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">AI Generation</h3>
                      <p className="text-sm text-gray-400">DALL-E 3 creates stunning backgrounds with channel consistency</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Download className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">Professional Export</h3>
                      <p className="text-sm text-gray-400">HD download ready for upload with bulk processing</p>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gray-800 bg-opacity-30 rounded-xl p-8 border border-gray-700">
                  <h2 className="text-2xl font-bold mb-4 text-gray-200">Ready to create your first thumbnail?</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                    <input 
                      type="text" 
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      placeholder="Paste YouTube video or channel URL..."
                      className="w-full sm:w-96 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      onKeyPress={handleLandingKeyPress}
                      disabled={loadingLandingUrl}
                    />
                    <button
                      onClick={handleLandingUrlSubmit}
                      disabled={loadingLandingUrl}
                      className="flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                    >
                      {loadingLandingUrl ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Create Thumbnail
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Advanced Options */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
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
                      }}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Start with blank canvas/template →
                    </button>
                  </div>
                  
                  {/* Feature Highlights */}
                  <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      AI-powered generation
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Professional editing
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Instant export
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Batch processing
                    </div>
                  </div>
                </div>
                
                {/* Value Proposition */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                  <div className="p-6 bg-gray-800 bg-opacity-30 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">10x Faster</h3>
                    <p className="text-gray-400">Generate professional thumbnails in seconds, not hours. Perfect for creators with tight schedules.</p>
                  </div>
                  <div className="p-6 bg-gray-800 bg-opacity-30 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-3 text-purple-400">100x Cheaper</h3>
                    <p className="text-gray-400">No expensive designers needed. Create unlimited thumbnails for the cost of a single design session.</p>
                  </div>
                  <div className="p-6 bg-gray-800 bg-opacity-30 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-3 text-green-400">Instantly Scalable</h3>
                    <p className="text-gray-400">Process hundreds of videos at once. Perfect for agencies and high-volume creators.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {videoData && (
                <>
                  <ThumbnailEditor />
                  
                  {/* Quick Settings Panel */}
                  <div className={`quick-settings ${quickSettingsOpen ? '' : 'collapsed'}`}>
                    <div className="quick-settings-header">
                      <h3 className="text-sm font-medium">Quick Settings</h3>
                      <button 
                        className="quick-settings-toggle"
                        onClick={() => setQuickSettingsOpen(!quickSettingsOpen)}
                      >
                        <ChevronUp className={`h-5 w-5 transform ${quickSettingsOpen ? '' : 'rotate-180'}`} />
                      </button>
                    </div>
                    {quickSettingsOpen && (
                      <div className="quick-settings-content">
                        <div className="settings-search">
                          <Search className="settings-search-icon h-4 w-4" />
                          <input 
                            type="text" 
                            placeholder="Search settings..." 
                            className="text-sm"
                          />
                        </div>
                        
                        <div className="mode-toggle">
                          <button className="active">Basic</button>
                          <button>Advanced</button>
                        </div>
                        
                        <div className="quick-setting-item">
                          <label className="text-xs text-gray-400">Creative Direction</label>
                          <select className="w-full bg-gray-800 text-sm p-1 rounded border border-gray-700">
                            <option>Original Style</option>
                            <option>Dynamic</option>
                            <option>Artistic</option>
                          </select>
                        </div>
                        
                        <div className="quick-setting-item">
                          <label className="text-xs text-gray-400">Clickbait Intensity</label>
                          <input type="range" className="w-full" min="1" max="10" defaultValue="5" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Floating Action Button */}
                  <div className="fab" onClick={() => setFabMenuOpen(!fabMenuOpen)}>
                    <Plus className="h-6 w-6" />
                    
                    <div className={`fab-menu ${fabMenuOpen ? 'open' : ''}`}>
                      <div className="fab-item" title="Generate">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="fab-item" title="Add Element">
                        <Image className="h-4 w-4" />
                      </div>
                      <div className="fab-item" title="Add Participant">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="fab-item" title="Export">
                        <Download className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
        <Footer />
        {/* Demo enhancer (only visible when recording controls are hidden) */}
        {isDemoMode && !showRecordingControls && <DemoEnhancer enabled={process.env.NODE_ENV === 'development'} />}
      </div>
    </ThemeProvider>
  );
}

export default App;