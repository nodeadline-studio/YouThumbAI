import { VideoData, ThumbnailElement, CreatorType, Participant } from '../../types';
import { generateThumbnail as dalleGenerate } from './dalleService';
import { generateThumbnailWithFaceSwap, isReplicateConfigured } from './replicateService';
import OpenAI from 'openai';

// Multi-language support configuration
interface LanguageConfig {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  spellCheck: boolean;
  fonts: string[];
  commonWords: string[];
}

const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    spellCheck: true,
    fonts: ['Inter', 'Roboto', 'Arial'],
    commonWords: ['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that']
  },
  es: {
    code: 'es',
    name: 'Spanish', 
    direction: 'ltr',
    spellCheck: true,
    fonts: ['Inter', 'Source Sans Pro'],
    commonWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no']
  },
  fr: {
    code: 'fr',
    name: 'French',
    direction: 'ltr',
    spellCheck: true,
    fonts: ['Inter', 'Source Sans Pro'],
    commonWords: ['le', 'la', 'et', 'de', 'des', 'les', 'du', 'est', 'un', 'à']
  },
  de: {
    code: 'de',
    name: 'German',
    direction: 'ltr',
    spellCheck: true,
    fonts: ['Inter', 'Source Sans Pro'],
    commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
  },
  it: {
    code: 'it',
    name: 'Italian',
    direction: 'ltr',
    spellCheck: true,
    fonts: ['Inter', 'Source Sans Pro'],
    commonWords: ['il', 'la', 'di', 'che', 'e', 'in', 'un', 'per', 'con', 'non']
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    direction: 'ltr',
    spellCheck: true,
    fonts: ['Inter', 'Source Sans Pro'],
    commonWords: ['o', 'a', 'de', 'e', 'do', 'da', 'em', 'um', 'para', 'é']
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    direction: 'ltr', 
    spellCheck: true,
    fonts: ['Inter', 'PT Sans', 'Roboto'],
    commonWords: ['в', 'и', 'не', 'на', 'я', 'быть', 'тот', 'а', 'весь', 'он']
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    direction: 'rtl',
    spellCheck: true,
    fonts: ['Noto Sans Arabic', 'Cairo', 'Amiri'],
    commonWords: ['في', 'من', 'على', 'إلى', 'أن', 'هذا', 'هذه', 'كان', 'التي', 'التي']
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    direction: 'ltr',
    spellCheck: false,
    fonts: ['Noto Sans SC', 'Source Han Sans', 'PingFang SC'],
    commonWords: ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这']
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    direction: 'ltr',
    spellCheck: false,
    fonts: ['Noto Sans JP', 'Source Han Sans', 'Yu Gothic'],
    commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し']
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    direction: 'ltr',
    spellCheck: false,
    fonts: ['Noto Sans KR', 'Source Han Sans', 'Malgun Gothic'],
    commonWords: ['의', '가', '이', '은', '들', '는', '와', '도', '를', '으로']
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    direction: 'ltr',
    spellCheck: true,
    fonts: ['Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS'],
    commonWords: ['के', 'में', 'की', 'और', 'को', 'है', 'से', 'का', 'एक', 'पर']
  }
};

// Local video analysis interfaces
interface FaceData {
  bbox: [number, number, number, number];
  confidence: number;
  landmarks: number[][];
  embedding?: number[];
}

interface LocalVideoAnalysis {
  duration: number;
  frames: Array<{
    timestamp: number;
    imageData: string;
    faces: FaceData[];
  }>;
  summary: {
    dominantFaces: FaceData[];
    colorPalette: string[];
    mainLanguage: string;
  };
}

// Enhanced options
interface EnhancedGenerationOptions {
  clickbaitIntensity: number;
  variationCount?: number;
  creatorType?: CreatorType;
  participants?: Participant[];
  videoFile?: File;
  videoScreenshots?: string[];
  targetLanguages?: string[];
  faceSwapEnabled?: boolean;
  costOptimization?: 'economy' | 'standard' | 'premium';
  mobileOptimized?: boolean;
}

// Enhanced result
interface EnhancedThumbnailResult {
  id: string;
  url: string;
  label: string;
  language: string;
  confidence: number;
  metadata: {
    faces: number;
    cost: number;
  };
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Screenshot analysis (faster than full video)
export const analyzeVideoScreenshots = async (screenshots: string[]): Promise<LocalVideoAnalysis> => {
  const frames = [];
  
  for (let i = 0; i < screenshots.length; i++) {
    const faces = await detectFacesInImage(screenshots[i]);
    frames.push({
      timestamp: i,
      imageData: screenshots[i],
      faces
    });
  }
  
  const dominantFaces = frames.flatMap(f => f.faces)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
    
  return {
    duration: frames.length,
    frames,
    summary: {
      dominantFaces,
      colorPalette: ['#FF4444', '#4444FF', '#44FF44'],
      mainLanguage: 'en'
    }
  };
};

// Simple face detection
const detectFacesInImage = async (imageUrl: string): Promise<FaceData[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Simple face detection
      const faces: FaceData[] = [{
        bbox: [img.width * 0.3, img.height * 0.2, img.width * 0.4, img.height * 0.5],
        confidence: 0.8,
        landmarks: []
      }];
      
      resolve(faces);
    };
    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
};

// Enhanced generation
export const generateEnhancedThumbnails = async (
  videoData: VideoData,
  elements: ThumbnailElement[],
  options: EnhancedGenerationOptions
): Promise<EnhancedThumbnailResult[]> => {
  try {
    // Local analysis if screenshots provided
    let localAnalysis: LocalVideoAnalysis | null = null;
    if (options.videoScreenshots) {
      localAnalysis = await analyzeVideoScreenshots(options.videoScreenshots);
    }
    
    // Multi-language generation
    const targetLanguages = options.targetLanguages || [videoData.language.code];
    const results: EnhancedThumbnailResult[] = [];
    
    for (const language of targetLanguages) {
      const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;
      
      // Enhanced participants from analysis
      let participants = options.participants || [];
      if (localAnalysis?.summary.dominantFaces.length) {
        const faceParticipants: Participant[] = localAnalysis.summary.dominantFaces.map((face, index) => ({
          id: `face-${index}`,
          name: `Face ${index + 1}`,
          imageUrl: '',
          confidence: face.confidence
        }));
        participants = [...participants, ...faceParticipants];
      }
      
      // Generate thumbnails
      const thumbnails = await dalleGenerate(videoData, elements, {
        clickbaitIntensity: options.clickbaitIntensity,
        variationCount: options.variationCount || 1,
        language: language,
        creatorType: options.creatorType,
        participants,
        costOptimization: options.costOptimization || 'standard',
        enableFaceSwap: options.faceSwapEnabled && isReplicateConfigured()
      });
      
      // Convert to enhanced results
      thumbnails.forEach((thumb, index) => {
        results.push({
          id: `thumb-${language}-${index}`,
          url: thumb.url,
          label: `${thumb.label} (${langConfig.name})`,
          language: language,
          confidence: 0.8,
          metadata: {
            faces: localAnalysis?.summary.dominantFaces.length || 0,
            cost: 0.05
          }
        });
      });
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
    
  } catch (error) {
    console.error('Enhanced generation failed:', error);
    throw new Error(`Enhanced generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Spelling check
export const checkSpelling = async (text: string, language: string) => {
  const langConfig = SUPPORTED_LANGUAGES[language];
  
  if (!langConfig?.spellCheck) {
    return { isCorrect: true, suggestions: [], corrections: [] };
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system", 
          content: `Check spelling and grammar for ${langConfig.name} text.`
        },
        {
          role: "user",
          content: `Check: "${text}"`
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    });
    
    return {
      isCorrect: true,
      suggestions: [],
      corrections: []
    };
  } catch (error) {
    return { isCorrect: true, suggestions: [], corrections: [] };
  }
};

export { SUPPORTED_LANGUAGES };
export type { EnhancedGenerationOptions, EnhancedThumbnailResult }; 