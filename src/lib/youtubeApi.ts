import { VideoData } from '../types';

interface LanguageDetectionResult {
  code: string;
  confidence: number;
}

function detectTextLanguage(text: string): LanguageDetectionResult {
  // Simple language detection based on character sets
  const scripts = {
    ar: { name: 'Arabic', regex: /[\u0600-\u06FF]/, threshold: 0.2 },
    zh: { name: 'Chinese', regex: /[\u4E00-\u9FFF]/, threshold: 0.2 },
    ja: { name: 'Japanese', regex: /[\u3040-\u30FF\u4E00-\u9FFF]/, threshold: 0.2 },
    ko: { name: 'Korean', regex: /[\uAC00-\uD7AF]/, threshold: 0.2 },
    ru: { name: 'Russian', regex: /[\u0400-\u04FF]/, threshold: 0.2 },
    he: { name: 'Hebrew', regex: /[\u0590-\u05FF]/, threshold: 0.2 },
    hi: { name: 'Hindi', regex: /[\u0900-\u097F]/, threshold: 0.2 },
    th: { name: 'Thai', regex: /[\u0E00-\u0E7F]/, threshold: 0.2 }
  };

  let totalChars = text.length;
  let scriptCounts: Record<string, number> = {};

  for (let char of text) {
    for (let [script, { regex }] of Object.entries(scripts)) {
      if (regex.test(char)) { 
        scriptCounts[script] = (scriptCounts[script] || 0) + 1;
      }
    }
  }

  let detectedLang = 'en';
  let maxCount = 0;
  let confidence = 0;

  for (const [lang, { threshold }] of Object.entries(scripts)) {
    const count = scriptCounts[lang] || 0;
    const ratio = count / totalChars;
    
    if (ratio > threshold && count > maxCount) {
      maxCount = count;
      detectedLang = lang;
      confidence = ratio;
    }
  }

  return {
    code: detectedLang,
    confidence: confidence
  };
}

export function extractChannelId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([^/?&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([^/?&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([^/?&]+)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export async function getChannelThumbnails(channelId: string, apiKey: string) {
  try {
    // Get channel details first
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${apiKey}&part=snippet,statistics`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!channelResponse.ok) {
      throw new Error('Failed to fetch channel data');
    }

    const channelData = await channelResponse.json();
    if (!channelData.items?.length) {
      throw new Error('Channel not found');
    }
    
    const channel = channelData.items[0];

    // Get latest videos
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&key=${apiKey}&part=snippet&order=date&type=video&maxResults=5`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!videosResponse.ok) {
      throw new Error('Failed to fetch channel videos');
    }

    const videosData = await videosResponse.json();
    const thumbnailUrls = videosData.items?.map((item: any) => 
      item.snippet.thumbnails.high?.url || 
      item.snippet.thumbnails.default?.url
    ).filter(Boolean) || [];
    
    return {
      id: channel.id,
      title: channel.snippet.title,
      thumbnails: {
        latest: thumbnailUrls,
        popular: [] // Could be populated with most viewed videos
      }
    };
  } catch (error) {
    throw error;
  }
}

interface LanguageInfo {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}

const languageMap: Record<string, LanguageInfo> = {
  en: { code: 'en', name: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Spanish', direction: 'ltr' },
  fr: { code: 'fr', name: 'French', direction: 'ltr' },
  de: { code: 'de', name: 'German', direction: 'ltr' },
  it: { code: 'it', name: 'Italian', direction: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', direction: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', direction: 'rtl' },
  zh: { code: 'zh', name: 'Chinese', direction: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', direction: 'ltr' },
  ko: { code: 'ko', name: 'Korean', direction: 'ltr' },
  ru: { code: 'ru', name: 'Russian', direction: 'ltr' },
  he: { code: 'he', name: 'Hebrew', direction: 'rtl' },
  hi: { code: 'hi', name: 'Hindi', direction: 'ltr' },
  th: { code: 'th', name: 'Thai', direction: 'ltr' }
};

export async function getVideoMetadata(videoId: string, apiKey: string): Promise<VideoData> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics,localizations,status`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    
    // Get channel details for default language
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?id=${video.snippet.channelId}&key=${apiKey}&part=snippet`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!channelResponse.ok) {
      throw new Error('Failed to fetch channel data');
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];

    // Determine language priority:
    // 1. Channel default language
    // 2. Video language
    // 3. Detected from title
    // 4. Detected from description
    // 5. Fallback to English
    let languageCode = 'en';
    let confidence = 0;

    // Try channel default language
    if (channel?.snippet?.defaultLanguage) {
      languageCode = channel.snippet.defaultLanguage.split('-')[0];
      confidence = 0.9;
    }

    // Check video language if different from channel
    if (video.snippet.defaultLanguage || video.snippet.defaultAudioLanguage) {
      const videoLang = (video.snippet.defaultLanguage || video.snippet.defaultAudioLanguage).split('-')[0];
      if (videoLang !== languageCode) {
        languageCode = videoLang;
        confidence = 0.95;
      }
    }

    // Detect language from title if confidence is low
    if (confidence < 0.9) {
      const titleLanguage = detectTextLanguage(video.snippet.title);
      if (titleLanguage.confidence > 0.3) {
        languageCode = titleLanguage.code;
        confidence = titleLanguage.confidence;
      }
    }

    // Try description if still uncertain
    if (confidence < 0.3) {
      const descLanguage = detectTextLanguage(video.snippet.description);
      if (descLanguage.confidence > confidence) {
        languageCode = descLanguage.code;
        confidence = descLanguage.confidence;
      }
    }

    const languageInfo = languageMap[languageCode] || languageMap.en;
    
    // Fetch channel data
    const channelReference = await getChannelThumbnails(video.snippet.channelId, apiKey);

    return {
      id: video.id,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      channelReference,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails?.maxres?.url || 
                   video.snippet.thumbnails?.high?.url || '',
      tags: video.snippet.tags || [],
      language: languageInfo,
      statistics: {
        views: Number(video.statistics?.viewCount) || 0,
        likes: Number(video.statistics?.likeCount) || 0,
        comments: Number(video.statistics?.commentCount) || 0
      },
      typography: {
        direction: languageInfo.direction,
        fontFamily: languageInfo.direction === 'rtl' ? 
          'var(--font-arabic), system-ui, sans-serif' : 
          'var(--font-primary), system-ui, sans-serif'
      }
    };
  } catch (error) {
    throw error;
  }
}

export function extractVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/i,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}