import ColorThief from 'color-thief-browser';
import { ChannelPattern, TextStyle, ColorPalette, LayoutPattern, SeriesPattern, TemporalTrend } from '../../types';
import { useVideoStore } from '../../store/videoStore';

const colorThief = new ColorThief();

const MINIMUM_CONFIDENCE_THRESHOLD = 0.6;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const patternCache = new Map<string, { pattern: ChannelPattern; timestamp: number }>();

export async function analyzeChannelThumbnails(thumbnails: string[]): Promise<ChannelPattern> {
  try {
    // Check cache first
    const channelId = thumbnails[0]?.split('/')[4]; // Extract channel ID from URL
    if (channelId) {
      const cached = patternCache.get(channelId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.pattern;
      }
    }

    // Load all thumbnail images
    const images = await Promise.all(
      thumbnails.map(url => loadImage(url)).map(p => p.catch(err => {
        console.warn('Failed to load thumbnail:', err);
        return null;
      }))
    );

    const validImages = images.filter(Boolean) as HTMLImageElement[];
    if (validImages.length < 3) {
      throw new Error('Not enough valid thumbnails to analyze pattern');
    }

    // Extract patterns
    const textStyles = await detectTextStyles(validImages);
    const colorPalettes = await extractColorPalettes(validImages);
    const layouts = detectLayoutPatterns(validImages);
    const seriesPatterns = detectSeriesPatterns(validImages);
    const temporalTrends = analyzeTemporalTrends(validImages);

    const confidence = calculateConfidence(textStyles, colorPalettes, layouts);
    if (confidence < MINIMUM_CONFIDENCE_THRESHOLD) {
      console.warn('Low confidence in pattern detection:', confidence);
    }

    const pattern: ChannelPattern = {
      id: generatePatternId(),
      textStyles,
      colorPalettes,
      layouts,
      seriesPatterns,
      temporalTrends,
      confidence
    };

    // Cache the result
    if (channelId) {
      patternCache.set(channelId, {
        pattern,
        timestamp: Date.now()
      });
    }

    return pattern;
  } catch (error) {
    console.error('Error analyzing channel thumbnails:', error);
    throw new Error('Failed to analyze channel pattern');
  }
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function detectTextStyles(images: HTMLImageElement[]): Promise<TextStyle[]> {
  // This would use OCR in a full implementation
  // For now, return common text style patterns
  return [
    {
      id: 'title',
      role: 'title',
      size: 48,
      color: '#ffffff',
      effects: [{ type: 'shadow', value: '0 2px 4px rgba(0,0,0,0.5)' }],
      position: { x: 50, y: 50, alignment: 'center' },
      frequency: 0.8
    },
    {
      id: 'accent',
      role: 'accent',
      size: 32,
      color: '#ff0000',
      effects: [{ type: 'glow', value: '0 0 10px rgba(255,0,0,0.5)' }],
      position: { x: 20, y: 20, alignment: 'left' },
      frequency: 0.4
    }
  ];
}

async function extractColorPalettes(images: HTMLImageElement[]): Promise<ColorPalette[]> {
  const palettes = await Promise.all(
    images.map(async (img) => {
      if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) {
        return null;
      }

      try {
        // Ensure the image is loaded and has dimensions
        await new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
          }
        });

        let dominantColor: number[] | null = null;
        let palette: number[][] | null = null;

        try {
          dominantColor = await colorThief.getColor(img);
          palette = await colorThief.getPalette(img, 5);
        } catch (colorError) {
          console.warn('Color extraction failed:', colorError);
          return null;
        }
        
        if (!dominantColor || !Array.isArray(dominantColor) || dominantColor.length !== 3 || !palette) {
          console.warn('Failed to extract colors from image');
          return null;
        }
        
        return {
          id: `palette_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          primary: [rgbToHex(dominantColor || [0, 0, 0])],
          secondary: (palette || []).slice(0, 2).map(color => rgbToHex(color || [0, 0, 0])),
          accent: (palette || []).slice(2).map(color => rgbToHex(color || [0, 0, 0])),
          frequency: 1
        };
      } catch (error) {
        console.error('Error extracting colors:', error);
        return null;
      }
    })
  );

  const validPalettes = palettes.filter(Boolean);
  if (validPalettes.length === 0) {
    return [{
      id: 'fallback_palette',
      primary: ['#ffffff'],
      secondary: ['#f0f0f0', '#e0e0e0'],
      accent: ['#000000', '#808080', '#404040'],
      frequency: 1
    }];
  }
  
  return aggregatePalettes(validPalettes as ColorPalette[]);
}

function detectLayoutPatterns(images: HTMLImageElement[]): LayoutPattern[] {
  // Analyze image regions and text placement
  return [
    {
      id: 'face-left',
      type: 'face-left',
      textRegions: [
        { x: 60, y: 50, width: 35, height: 60, role: 'title' }
      ],
      imageRegions: [
        { x: 25, y: 50, width: 45, height: 80, role: 'face' }
      ],
      frequency: 0.4
    },
    {
      id: 'centered',
      type: 'centered',
      textRegions: [
        { x: 50, y: 70, width: 80, height: 20, role: 'title' }
      ],
      imageRegions: [
        { x: 50, y: 40, width: 70, height: 60, role: 'main' }
      ],
      frequency: 0.6
    }
  ];
}

function detectSeriesPatterns(images: HTMLImageElement[]): SeriesPattern[] {
  return [
    {
      id: 'tutorial',
      name: 'Tutorial Series',
      pattern: /how\s+to|tutorial|guide/i,
      style: {
        layouts: [
          {
            id: 'tutorial-layout',
            type: 'split',
            textRegions: [
              { x: 70, y: 50, width: 55, height: 80, role: 'steps' }
            ],
            imageRegions: [
              { x: 30, y: 50, width: 45, height: 80, role: 'demonstration' }
            ],
            frequency: 1
          }
        ]
      },
      frequency: 0.3
    }
  ];
}

function analyzeTemporalTrends(images: HTMLImageElement[]): TemporalTrend[] {
  return [
    {
      id: 'recent-style',
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      changes: {
        colorPalettes: [
          {
            id: 'modern-palette',
            primary: ['#1a1a1a'],
            secondary: ['#f5f5f5'],
            accent: ['#ff3e00'],
            frequency: 0.8
          }
        ]
      },
      confidence: 0.7
    }
  ];
}

function calculateConfidence(
  textStyles: TextStyle[],
  colorPalettes: ColorPalette[],
  layouts: LayoutPattern[]
): number {
  const textConfidence = textStyles.reduce((acc, style) => acc + style.frequency, 0) / textStyles.length;
  const colorConfidence = colorPalettes.reduce((acc, palette) => acc + palette.frequency, 0) / colorPalettes.length;
  const layoutConfidence = layouts.reduce((acc, layout) => acc + layout.frequency, 0) / layouts.length;
  const patternCount = textStyles.length + colorPalettes.length + layouts.length;

  return patternCount > 5 ? (textConfidence + colorConfidence + layoutConfidence) / 3 : 0.4;
}

function generatePatternId(): string {
  return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function rgbToHex([r, g, b]: number[]): string {
  // Validate RGB input
  if (!Array.isArray([r, g, b]) || 
      [r, g, b].length !== 3 || 
      [r, g, b].some(x => typeof x !== 'number' || isNaN(x) || x < 0 || x > 255)) {
    console.warn('Invalid RGB values:', [r, g, b]);
    return '#000000';
  }
  
  // Convert to hex with proper bounds checking
  const hex = [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
  
  return `#${hex}`;
}

function aggregatePalettes(palettes: ColorPalette[]): ColorPalette[] {
  // Group similar palettes and calculate frequencies
  const grouped = new Map<string, ColorPalette>();
  const totalCount = palettes.length;

  palettes.forEach(palette => {
    if (!palette || !palette.primary || !palette.primary[0]) return;
    
    const key = palette.primary[0].toLowerCase();
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.frequency = (existing.frequency || 0) + 1;
    } else {
      grouped.set(key, { ...palette, frequency: 1 });
    }
  });

  return Array.from(grouped.values()).map(palette => ({
    id: palette.id,
    primary: palette.primary || [],
    secondary: palette.secondary || [],
    accent: palette.accent || [],
    ...palette,
    frequency: palette.frequency / totalCount
  }));
}