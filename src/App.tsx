import React from 'react';
import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import VideoInput from './components/VideoInput';
import ThumbnailEditor from './components/ThumbnailEditor';
import Footer from './components/Footer';
import { Plus, Search, Settings, ChevronUp, Sparkles, Users, Image, Download } from 'lucide-react';
import { useVideoStore } from './store/videoStore';
import './styles/App.css';


function App() {
  const [showInput, setShowInput] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const videoData = useVideoStore(state => state.videoData);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {!videoData && !showInput ? (
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
                      <p className="text-sm text-gray-400">Instant video analysis & metadata extraction</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">AI Generation</h3>
                      <p className="text-sm text-gray-400">DALL-E 3 creates stunning backgrounds</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Download className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold mb-1">Professional Export</h3>
                      <p className="text-sm text-gray-400">HD download ready for upload</p>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gray-800 bg-opacity-30 rounded-xl p-8 border border-gray-700">
                  <h2 className="text-2xl font-bold mb-4 text-gray-200">Ready to create your first thumbnail?</h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                    <input 
                      type="text" 
                      placeholder="Paste any YouTube URL to start..."
                      className="w-full sm:w-96 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          setShowInput(true);
                        }
                      }}
                    />
                    <button
                      onClick={() => setShowInput(true)}
                      className="flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Create Thumbnail
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
              {showInput && <VideoInput onClose={() => setShowInput(false)} />}
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
      </div>
    </ThemeProvider>
  );
}

export default App;