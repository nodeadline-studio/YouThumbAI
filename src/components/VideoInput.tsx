import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { fetchVideoData } from '../services/youtubeService';
import { useVideoStore } from '../store/videoStore';
import { extractVideoId } from '../lib/youtubeApi';

interface VideoInputProps {
  onClose: () => void;
}

const VideoInput: React.FC<VideoInputProps> = ({ onClose }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setVideoData } = useVideoStore();
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);

  const validateYouTubeUrl = (input: string) => {
    const videoId = extractVideoId(input);
    setIsValidUrl(!!videoId);
    return !!videoId;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    if (input.trim()) {
      validateYouTubeUrl(input);
    } else {
      setIsValidUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || !validateYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // In a real implementation, this would make an actual API call
      const data = await fetchVideoData(url);
      setVideoData(data);
      onClose();
    } catch (err) {
      setError('Failed to fetch video data. Please check the URL and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="p-6 bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Generate YouTube Thumbnail</h2>
        <p className="text-gray-400 text-center mb-6">
          Enter a YouTube URL to extract video data
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Paste YouTube URL here..."
              value={url}
              onChange={handleUrlChange}
              className={`w-full px-4 py-3 pl-10 bg-gray-900 border ${
                isValidUrl === false ? 'border-red-500' : 'border-gray-700'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500`}
            />
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            {isValidUrl === false && (
              <p className="absolute -bottom-8 left-0 text-xs text-red-400">
                Please enter a valid YouTube URL
              </p>
            )}
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Extract Video Data</span>
            )}
          </button>
          
          <div className="flex justify-between mt-4">
            <button 
              type="button"
              className="text-gray-400 hover:text-gray-300 text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button" 
              className="text-purple-400 hover:text-purple-300 text-sm" 
              onClick={() => {
                setVideoData({
                  title: 'My Awesome Video',
                  description: 'This is a placeholder description for your video',
                  thumbnailUrl: '',
                  tags: ['example', 'video', 'youtube'],
                  language: { code: 'en', name: 'English', direction: 'ltr' },
                  typography: { direction: 'ltr', fontFamily: 'system-ui, sans-serif' }
                });
                onClose();
              }}
            >
              Start Blank Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoInput;