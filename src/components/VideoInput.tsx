import React, { useState } from 'react';
import { Search, AlertCircle, Loader2, Youtube, Link, Palette, Sparkles } from 'lucide-react';
import { useVideoStore } from '../store/videoStore';
import { getVideoMetadata } from '../lib/youtubeApi';

interface VideoInputProps {
  onClose?: () => void;
}

const VideoInput: React.FC<VideoInputProps> = ({ onClose }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [channelAnalysis, setChannelAnalysis] = useState<{
    channelName?: string;
    thumbnailStyles?: string[];
    colorPalette?: string[];
    styleConsistency?: number;
  } | null>(null);
  
  const setVideoData = useVideoStore(state => state.setVideoData);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isChannelUrl = (url: string): boolean => {
    return /youtube\.com\/(channel\/|c\/|user\/|@)/.test(url) || 
           /youtube\.com\/[^\/]+$/.test(url);
  };

  const analyzeChannelStyle = async (channelId: string, channelName: string) => {
    setAnalyzing(true);
    try {
      // This would call your backend to analyze channel thumbnails
      // For now, simulate the analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setChannelAnalysis({
        channelName,
        thumbnailStyles: ['Bold Text Overlays', 'High Contrast', 'Face-Focused'],
        colorPalette: ['#FF4444', '#FFD700', '#FFFFFF', '#000000'],
        styleConsistency: 85
      });
    } catch (error) {
      console.error('Failed to analyze channel style:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setChannelAnalysis(null);

    try {
      // Check if it's a channel URL first
      if (isChannelUrl(url)) {
        // Extract channel info and analyze style
        const channelName = url.split('/').pop() || 'Unknown Channel';
        await analyzeChannelStyle('dummy-id', channelName);
        setLoading(false);
        return;
      }

      // Otherwise proceed with video analysis
      const videoId = extractVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL. Please check the URL and try again.');
      }

      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured. Please add VITE_YOUTUBE_API_KEY to your environment variables.');
      }

      const videoData = await getVideoMetadata(videoId, apiKey);
      setVideoData(videoData);
      
      // Auto-analyze channel style when video is loaded
      if (videoData.channelId) {
        analyzeChannelStyle(videoData.channelId, videoData.channelTitle || 'Unknown Channel');
      }
      
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700">
      <div className="text-center mb-6">
        <Youtube className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Analyze YouTube Content
        </h2>
        <p className="text-gray-300">
          Enter a video URL or channel name to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Link className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube video URL, channel URL, or @username"
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
            disabled={loading || analyzing}
          />
        </div>

        {error && (
          <div className="flex items-center p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || analyzing || !url.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading Video...
            </>
          ) : analyzing ? (
            <>
              <Palette className="w-5 h-5 mr-2" />
              Analyzing Channel Style...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Analyze Content
            </>
          )}
        </button>
      </form>

      {/* Channel Analysis Results */}
      {channelAnalysis && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-medium text-purple-300">Channel Style Analysis</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-400">Channel:</span>
              <span className="ml-2 text-white font-medium">{channelAnalysis.channelName}</span>
            </div>
            
            <div>
              <span className="text-sm text-gray-400">Style Consistency:</span>
              <span className="ml-2 text-green-400 font-medium">{channelAnalysis.styleConsistency}%</span>
            </div>
            
            {channelAnalysis.thumbnailStyles && (
              <div>
                <span className="text-sm text-gray-400 block mb-1">Detected Styles:</span>
                <div className="flex flex-wrap gap-2">
                  {channelAnalysis.thumbnailStyles.map((style, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-900/40 border border-blue-700/30 rounded text-xs text-blue-300"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {channelAnalysis.colorPalette && (
              <div>
                <span className="text-sm text-gray-400 block mb-1">Color Palette:</span>
                <div className="flex space-x-2">
                  {channelAnalysis.colorPalette.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                🎨 This style analysis will be automatically applied to your thumbnail generation 
                to maintain channel consistency.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400">
          Supports video URLs, channel URLs, and @usernames
        </p>
      </div>
    </div>
  );
};

export default VideoInput;