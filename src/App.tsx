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
            <div className="flex flex-col items-center justify-center py-16">
              <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Create Amazing YouTube Thumbnails
              </h1>
              <button
                onClick={() => setShowInput(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-lg text-white font-medium transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start New Thumbnail
              </button>
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