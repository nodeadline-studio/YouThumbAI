interface Typography {
  direction: 'ltr' | 'rtl';
  fontFamily: string;
}

interface Language {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}

export interface VideoData {
  id?: string;
  channelId?: string;
  channelTitle?: string;
  channelReference?: ReferenceChannel;
  title: string;
  description: string;
  thumbnailUrl: string;
  tags?: string[];
  language: Language;
  typography: Typography;
  statistics?: {
    views?: number;
    likes?: number;
    comments?: number;
  };
  channelPattern?: ChannelPattern;
  styleConsistency?: number;
}

export interface StyleProfile {
  styleId: string;
  palette: string[];
  layout: string;
  fontHint: string;
  tone: string;
}

export interface Dictionary {
  channelId: string;
  niche: string;
  keywords: { word: string; weight: number }[];
  categories: { [key: string]: number };
  lastUpdated: number;
}

export interface ReferenceChannel {
  id: string;
  title: string;
  thumbnails: {
    latest: string[];
    popular: string[];
  };
}
export type ThumbnailElementType = 'text' | 'image';

export interface ThumbnailElement {
  id: string;
  type: ThumbnailElementType;
  content: string;
  color?: string;
  size?: number;
  rotation?: number;
  opacity?: number;
  scale?: number;
  removeBg?: boolean;
  filters?: {
    brightness?: number;
    contrast?: number;
    blur?: number;
  };
  styles?: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: 'left' | 'center' | 'right';
    shadow: boolean;
  };
  url?: string;
  x: number;
  y: number;
}

export interface GenerationOptions {
  clickbaitIntensity: number;
  styleReferenceImages?: string[];
  language?: string;
  contextSummary?: string | null;
  variation: {
    style: 'Editorial' | 'Dramatic' | 'Trendy';
    emphasis: 'professional' | 'emotional' | 'contemporary';
    styleProfile?: StyleProfile;
  };
}

export interface ChannelPattern {
  id: string;
  textStyles: TextStyle[];
  colorPalettes: ColorPalette[];
  layouts: LayoutPattern[];
  seriesPatterns: SeriesPattern[];
  temporalTrends: TemporalTrend[];
  confidence: number;
}

export interface ImageControls {
  rotation: number;
  opacity: number;
  scale: number;
  removeBg: boolean;
  filters: {
    brightness: number;
    contrast: number;
    blur: number;
  };
}

export interface TextStyle {
  id: string;
  role: 'title' | 'subtitle' | 'accent' | 'episode' | 'series';
  font?: string;
  size: number;
  color: string;
  effects: TextEffect[];
  position: Position;
  frequency: number;
}

export interface TextEffect {
  type: 'shadow' | 'outline' | 'glow' | 'gradient';
  value: string;
}

export interface ColorPalette {
  id: string;
  primary: string[];
  secondary: string[];
  accent: string[];
  frequency: number;
}

export interface LayoutPattern {
  id: string;
  type: 'face-left' | 'face-right' | 'centered' | 'split' | 'overlay';
  textRegions: Region[];
  imageRegions: Region[];
  frequency: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  role: string;
}

export interface Position {
  x: number;
  y: number;
  alignment: 'left' | 'center' | 'right';
}

export interface SeriesPattern {
  id: string;
  name: string;
  pattern: RegExp;
  style: Partial<ChannelPattern>;
  frequency: number;
}

export interface TemporalTrend {
  id: string;
  startDate: string;
  endDate: string;
  changes: Partial<ChannelPattern>;
  confidence: number;
}

export type CreatorType = 
  'gaming' | 
  'tutorial' | 
  'vlog' | 
  'entertainment' | 
  'education' | 
  'review' | 
  'business' | 
  'music' | 
  'news' | 
  'other';

export interface Participant {
  id: string;
  name?: string;
  imageUrl?: string;
  position?: 'left' | 'center' | 'right';
  emphasis?: 'primary' | 'secondary' | 'background';
}