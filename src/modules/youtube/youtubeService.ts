import { VideoData } from '../../types';
import { getVideoMetadata as fetchVideoMetadata, extractVideoId } from '../../lib/youtubeApi';
import { generateDictionary, getDictionary, updateDictionary } from '../../utils/dictionary';
import { generateContextSummary } from '../ai/gptService';
import { useVideoStore } from '../../store/videoStore';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export const fetchVideoData = async (url: string): Promise<VideoData> => {
  const videoId = extractVideoId(url);
  const { setContextSummary, setDictionary } = useVideoStore.getState();
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  try {
    const videoData = await fetchVideoMetadata(videoId, API_KEY);
    
    // Get or generate dictionary for this channel
    let dictionary = getDictionary(videoData.channelId!);
    if (!dictionary) {
      dictionary = generateDictionary([videoData]);
      if (videoData.channelId) {
        updateDictionary(videoData.channelId, dictionary);
      }
    }
    
    // Generate enhanced context summary
    const contextSummary = await generateContextSummary(videoData, dictionary);
    
    setContextSummary(contextSummary);
    setDictionary(dictionary.keywords);
    
    return videoData;
  } catch (error) {
    throw new Error('Failed to fetch video data. Please check the URL and try again.');
  }
};