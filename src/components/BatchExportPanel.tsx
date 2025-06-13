import React, { useState } from 'react';
import { Loader2, Link, Download, ChevronUp, ChevronDown, X, HardDrive } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useVideoStore } from '../store/videoStore';
import { generateThumbnail } from '../modules/ai/dalleService';

interface BatchVideoItem {
  id: string;
  title: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnailUrl?: string;
  error?: string;
}

const BatchExportPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [batchVideos, setBatchVideos] = useState<BatchVideoItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { generationSettings, creatorType, participants } = useVideoStore();

  const addVideoToBatch = () => {
    if (!newVideoUrl.trim()) return;
    
    // Extract video ID (simple extraction, could be improved)
    const match = newVideoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    if (!match) {
      alert('Invalid YouTube URL');
      return;
    }
    
    const videoId = match[1];
    
    // Add to batch
    setBatchVideos([
      ...batchVideos,
      {
        id: videoId,
        title: `Video ${batchVideos.length + 1}`,
        url: newVideoUrl,
        status: 'pending'
      }
    ]);
    
    setNewVideoUrl('');
  };

  const removeVideoFromBatch = (id: string) => {
    setBatchVideos(batchVideos.filter(video => video.id !== id));
  };

  const processVideoBatch = async () => {
    if (batchVideos.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    
    // Process each video sequentially to avoid rate limits
    for (let i = 0; i < batchVideos.length; i++) {
      const video = batchVideos[i];
      
      if (video.status === 'completed') continue;
      
      // Update status to processing
      setBatchVideos(prev => 
        prev.map(v => v.id === video.id ? { ...v, status: 'processing' } : v)
      );
      
      try {
        // Simplified for demo - would need to fetch actual video data from API
        const mockVideoData = {
          title: video.title,
          description: "Auto-generated thumbnail for this video",
          thumbnailUrl: "",
          language: { code: 'en', name: 'English', direction: 'ltr' as const },
          typography: { direction: 'ltr' as const, fontFamily: 'system-ui, sans-serif' }
        };
        
        // Generate thumbnail
        const results = await generateThumbnail(
          mockVideoData,
          [], // No manual elements in batch mode
          {
            clickbaitIntensity: generationSettings.clickbaitIntensity,
            variationCount: 1,
            creativeDirection: generationSettings.creativeDirection,
            costOptimization: generationSettings.costOptimization,
            creatorType,
            participants
          }
        );
        
        // Update with result
        setBatchVideos(prev => 
          prev.map(v => v.id === video.id ? { 
            ...v, 
            status: 'completed',
            thumbnailUrl: results[0].url
          } : v)
        );
        
      } catch (error) {
        // Handle error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setBatchVideos(prev => 
          prev.map(v => v.id === video.id ? { 
            ...v, 
            status: 'failed',
            error: errorMessage
          } : v)
        );
      }
      
      // Small delay between processing to avoid rate limits
      if (i < batchVideos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsProcessing(false);
  };

  const downloadThumbnail = async (videoItem: BatchVideoItem) => {
    if (!videoItem.thumbnailUrl) return;
    
    try {
      const response = await fetch(videoItem.thumbnailUrl);
      const blob = await response.blob();
      const filename = `thumbnail-${videoItem.id}.png`;
      saveAs(blob, filename);
    } catch (error) {
      alert('Failed to download thumbnail');
      console.error(error);
    }
  };

  const downloadAllThumbnails = async () => {
    const completedVideos = batchVideos.filter(v => v.status === 'completed' && v.thumbnailUrl);
    
    for (const video of completedVideos) {
      await downloadThumbnail(video);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  return (
    <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg rounded-xl border border-gray-700 p-4 mt-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <HardDrive className="h-5 w-5 mr-2 text-blue-400" />
          <h3 className="text-lg font-medium">Batch Thumbnail Processing</h3>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>
      
      {isOpen && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-4">
            Process multiple videos at once with the same style settings
          </p>
          
          {/* Add video form */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter YouTube URL"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
            <button
              onClick={addVideoToBatch}
              disabled={!newVideoUrl.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          
          {/* Video list */}
          {batchVideos.length > 0 ? (
            <div className="mb-4 space-y-2 max-h-60 overflow-y-auto pr-2">
              {batchVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="flex items-center justify-between p-2 bg-gray-700 bg-opacity-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Link className="h-4 w-4 mr-2 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium truncate max-w-xs">{video.title}</div>
                      <div className="text-xs text-gray-400">{video.id}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {video.status === 'pending' && (
                      <span className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded">Pending</span>
                    )}
                    {video.status === 'processing' && (
                      <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing
                      </span>
                    )}
                    {video.status === 'completed' && (
                      <>
                        <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded">Completed</span>
                        <button
                          onClick={() => downloadThumbnail(video)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                          title="Download thumbnail"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {video.status === 'failed' && (
                      <span className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded" title={video.error}>
                        Failed
                      </span>
                    )}
                    
                    <button
                      onClick={() => removeVideoFromBatch(video.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                      title="Remove from batch"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-gray-700 bg-opacity-30 rounded-lg mb-4">
              <p className="text-gray-400 text-sm">No videos in the batch yet</p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            {batchVideos.some(v => v.status === 'completed') && (
              <button
                onClick={downloadAllThumbnails}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium"
              >
                Download All
              </button>
            )}
            
            <button
              onClick={processVideoBatch}
              disabled={isProcessing || batchVideos.length === 0 || batchVideos.every(v => v.status === 'completed')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Batch'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchExportPanel; 