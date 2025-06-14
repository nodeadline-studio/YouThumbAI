import { VideoData, ThumbnailElement, CreatorType, Participant } from '../../types';
import { buildStyleProfile } from './styleProfiler';
import { generateThumbnailWithFaceSwap, detectFacesInImage, isReplicateConfigured } from './replicateService';
import OpenAI from 'openai';

interface ThumbnailVariation {
  url: string;
  label: string;
  prompt: string;
}

export interface GenerationOptions {
  clickbaitIntensity: number;
  variationCount?: number;
  selectedReferenceThumbnails?: string[];
  styleConsistency?: number;
  language?: string;
  contextSummary?: string | null;
  creativeDirection?: 'original' | 'dynamic' | 'artistic' | 'gaming' | 'tutorial' | 'vlog' | 'business' | 'entertainment';
  costOptimization?: 'standard' | 'economy' | 'premium';
  creatorType?: CreatorType | null;
  participants?: Participant[];
  enableFaceSwap?: boolean;
  previewImage?: string;
  blendMode?: boolean;
  // Channel-specific options
  channelReference?: any;
  channelStyleLikeness?: number;
  useChannelBranding?: boolean;
  bulkMode?: boolean;
}

const STYLE_VARIATIONS = [
  { 
    label: 'Original Style',
    emphasis: 'authenticity',
    style: 'Create a photorealistic scene that matches the channel\'s established visual identity.'
  },
  { 
    label: 'Dynamic',
    emphasis: 'energy',
    style: 'Design a high-energy, action-focused composition with dramatic lighting and perspective.'
  },
  { 
    label: 'Artistic',
    emphasis: 'creativity',
    style: 'Develop a unique artistic interpretation with bold creative choices and visual metaphors.'
  },
  {
    label: 'Gaming',
    emphasis: 'intensity',
    style: 'Create a high-energy gaming scene with neon lighting, dramatic angles, and vibrant game-inspired elements.'
  },
  {
    label: 'Tutorial',
    emphasis: 'clarity',
    style: 'Design a clean, professional layout with clear focus on educational content and trustworthy presentation.'
  },
  {
    label: 'Vlog',
    emphasis: 'personal',
    style: 'Capture a warm, personal atmosphere with authentic lighting and lifestyle-focused composition.'
  },
  {
    label: 'Business',
    emphasis: 'authority',
    style: 'Create a sophisticated, modern design with professional color schemes and authoritative styling.'
  },
  {
    label: 'Entertainment',
    emphasis: 'impact',
    style: 'Design for maximum visual impact with bold colors, dramatic contrasts, and attention-grabbing elements.'
  }
];

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateThumbnail = async (
  videoData: VideoData, 
  elements: ThumbnailElement[],
  options: GenerationOptions
): Promise<ThumbnailVariation[]> => {
  try {
    // Choose appropriate styles based on user's creative direction
    let selectedStyles = STYLE_VARIATIONS;
    if (options.creativeDirection) {
      switch(options.creativeDirection) {
        case 'original':
          selectedStyles = [STYLE_VARIATIONS[0]];
          break;
        case 'dynamic':
          selectedStyles = [STYLE_VARIATIONS[1]];
          break;
        case 'artistic':
          selectedStyles = [STYLE_VARIATIONS[2]];
          break;
        case 'gaming':
          selectedStyles = [STYLE_VARIATIONS[3]];
          break;
        case 'tutorial':
          selectedStyles = [STYLE_VARIATIONS[4]];
          break;
        case 'vlog':
          selectedStyles = [STYLE_VARIATIONS[5]];
          break;
        case 'business':
          selectedStyles = [STYLE_VARIATIONS[6]];
          break;
        case 'entertainment':
          selectedStyles = [STYLE_VARIATIONS[7]];
          break;
        default:
          selectedStyles = STYLE_VARIATIONS.slice(0, options.variationCount || 1);
      }
    } else {
      selectedStyles = STYLE_VARIATIONS.slice(0, options.variationCount || 1);
    }
    
    const thumbnailPromises = selectedStyles.map(async (styleVariation) => {
      // Build cultural context for international content
      const culturalAdaptation = getCulturalContext(videoData.language.code);
      
      // Apply user's style consistency preferences
      const styleIntensity = (options.styleConsistency || 100) / 100;
      
      // Incorporate reference thumbnails if provided
      let channelStyleProfile = options.selectedReferenceThumbnails?.length
        ? await buildStyleProfile(options.selectedReferenceThumbnails)
        : null;
      
      // Use channel reference thumbnails if available and no specific references provided
      if (!channelStyleProfile && options.channelReference?.thumbnails?.latest?.length) {
        channelStyleProfile = await buildStyleProfile(options.channelReference.thumbnails.latest);
      }

      const visualPrompt = await buildPrompt(
        videoData,
        options.contextSummary || '',
        styleVariation,
        channelStyleProfile,
        options.clickbaitIntensity,
        styleIntensity,
        culturalAdaptation,
        options.creatorType || null,
        options.participants || [],
        { 
          blendMode: options.blendMode, 
          elements: elements.length > 0 ? elements : undefined,
          channelReference: options.channelReference,
          useChannelBranding: options.useChannelBranding
        }
      );

      // Select image quality based on budget preferences
      const imageQuality = getQualityByCostSetting(options.costOptimization || 'standard');

      const dalleResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: visualPrompt,
        n: 1,
        size: "1792x1024",
        quality: imageQuality,
        style: "vivid"
      });

      // Ensure we got a valid response
      if (!dalleResponse.data?.[0]?.url) {
        throw new Error(`Failed to generate ${styleVariation.label} variation`);
      }

      let finalThumbnailUrl = dalleResponse.data[0].url;

      // Apply face swap enhancement if available and requested
      if (options.enableFaceSwap && isReplicateConfigured() && videoData.thumbnailUrl) {
        try {
          finalThumbnailUrl = await generateThumbnailWithFaceSwap(
            videoData,
            dalleResponse.data[0].url,
            true
          );
        } catch (faceSwapError) {
          // Gracefully fall back to original generated image
          // Face swap is an enhancement, not a requirement
        }
      }

      return {
        url: finalThumbnailUrl,
        label: styleVariation.label + (options.enableFaceSwap && isReplicateConfigured() ? ' (with face swap)' : ''),
        prompt: visualPrompt
      };
    });
    
    const generatedThumbnails = await Promise.all(thumbnailPromises);
    return generatedThumbnails;

  } catch (error) {
    throw new Error('Failed to generate thumbnail. Please try again.');
  }
};

function getQualityByCostSetting(costSetting: string): "standard" | "hd" {
  switch (costSetting) {
    case 'economy':
      return "standard";
    case 'premium':
    case 'standard':
    default:
      return "hd";
  }
}

function getCulturalContext(languageCode: string): string {
  const culturalStyles = {
    ru: 'Incorporate Slavic visual elements and aesthetics. Use rich, deep colors and traditional Russian artistic motifs where appropriate.',
    ja: 'Include Japanese design principles: minimalism, asymmetry, and natural elements. Consider manga/anime influence if relevant.',
    ko: 'Reflect Korean aesthetic sensibilities: modern minimalism with traditional elements. Consider K-pop/K-drama visual style if relevant.',
    ar: 'Incorporate Arabic calligraphic influences and geometric patterns. Use traditional Middle Eastern color palettes.',
    zh: 'Include Chinese artistic elements: balance of space, traditional motifs, and cultural symbols where appropriate.',
    hi: 'Use vibrant Indian color palettes and cultural motifs. Incorporate Bollywood visual style if relevant.',
    // Add more language-specific cultural styles as needed
  };

  return culturalStyles[languageCode as keyof typeof culturalStyles] || '';
}

function getCreatorTypeGuidelines(creatorType: CreatorType | null): string {
  if (!creatorType) return '';
  
  const guidelines: Record<CreatorType, string> = {
    gaming: 'Focus on high-energy, dynamic gaming scenes. Consider showing gameplay moments, reactions, or equipment. Use bold colors and strong contrast typical in gaming content.',
    tutorial: 'Emphasize clarity and information hierarchy. Show tools, processes, or before/after states. Create a professional, instructional visual that clearly communicates expertise.',
    vlog: 'Capture authentic, personal moments with emotional connection. Focus on the creator\'s personality and lifestyle. Create an inviting, relatable scene.',
    entertainment: 'Design for maximum visual impact and emotional engagement. Use dramatic lighting, expressive poses, and bold composition to create intrigue.',
    education: 'Balance professionalism with accessibility. Use clean, organized visual presentation with clear subject focus. Incorporate educational motifs subtly.',
    review: 'Show the product/subject in a detailed, well-lit presentation. Consider comparison elements or rating indicators. Create a trustworthy, analytical scene.',
    business: 'Project professionalism and authority. Use refined color palettes, balanced composition, and appropriate business setting or symbols.',
    music: 'Capture the energy and emotion of musical performance. Use dynamic lighting, movement, and visual rhythm. Match the artist\'s genre aesthetic.',
    news: 'Create a timely, journalistic aesthetic. Use documentary-style photography cues with clear subject focus. Maintain credibility in visual presentation.',
    other: 'Balance visual impact with content relevance. Create a scene that effectively represents the specific topic while maintaining viewer engagement.'
  };
  
  return guidelines[creatorType] || '';
}

function getParticipantPlacement(participants: Participant[]): string {
  if (!participants || participants.length === 0) return '';
  
  let placementGuide = 'Include the following people in the thumbnail:\n';
  
  participants.forEach(participant => {
    let position = '';
    let emphasis = '';
    
    switch (participant.position) {
      case 'left':
        position = 'on the left side of the frame';
        break;
      case 'right':
        position = 'on the right side of the frame';
        break;
      case 'center':
        position = 'in the center of the frame';
        break;
      default:
        position = 'in an appropriate position';
    }
    
    switch (participant.emphasis) {
      case 'primary':
        emphasis = 'as the main subject';
        break;
      case 'secondary':
        emphasis = 'as a supporting element';
        break;
      case 'background':
        emphasis = 'in the background';
        break;
      default:
        emphasis = 'with appropriate emphasis';
    }
    
    placementGuide += `- ${participant.name || 'Person'}: ${position}, ${emphasis}\n`;
  });
  
  return placementGuide;
}

async function buildPrompt(
  videoData: VideoData,
  contextSummary: string,
  variation: typeof STYLE_VARIATIONS[0],
  styleProfile: any,
  clickbaitIntensity: number,
  styleWeight: number,
  culturalContext: string,
  creatorType: CreatorType | null,
  participants: Participant[],
  options?: { 
    blendMode?: boolean; 
    elements?: ThumbnailElement[];
    channelReference?: any;
    useChannelBranding?: boolean;
  }
): Promise<string> {
  // Generate focused creative direction
  const creativePrompt = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional thumbnail designer. Create specific, visual scene descriptions that will result in compelling YouTube thumbnails.

Focus on concrete visual elements and avoid generic descriptions. Consider:
- Main subject/action
- Composition and framing
- Lighting and atmosphere
- Color relationships
- Visual hierarchy

${options?.blendMode ? `
ELEMENT INTEGRATION MODE: You must naturally integrate existing overlay elements into the scene design. These elements should appear as if they were originally part of the photograph/artwork, not added as overlays. Make text look like it's painted, carved, or burned into surfaces. Make graphic elements feel native to the environment.
` : ''}

Maintain a balance between accuracy and creativity based on the style weight: ${styleWeight * 100}%
- 100%: Exact match to reference
- 75%: Keep core elements with creative variation
- 50%: Use style as inspiration
- 25%: Minimal reference
- 0%: Fresh design

${creatorType ? `This is for a ${creatorType} channel. ${getCreatorTypeGuidelines(creatorType)}` : ''}`
      },
      {
        role: "user",
        content: `Create a detailed scene description for a YouTube thumbnail.

Context: "${contextSummary}"
Style: ${variation.style} (${styleWeight * 100}% consistency with channel style)
Emphasis: ${variation.emphasis}

Cultural Context: ${culturalContext}

${options?.channelReference && options?.useChannelBranding ? `
Channel Branding Context: This is for "${options.channelReference.title}" channel. 
Maintain visual consistency with their established style while creating fresh content.
Reference thumbnails show their typical approach to composition, color, and mood.
` : ''}

${participants.length > 0 ? getParticipantPlacement(participants) : ''}

${options?.blendMode && options?.elements ? `
INTEGRATE THESE ELEMENTS NATURALLY:
${options.elements.map(el => {
  if (el.type === 'text') {
    return `- Text "${el.content}" positioned at ${el.x}%, ${el.y}% (${el.size}px, ${el.color}) - integrate this text as if it's part of the scene (painted on surface, carved in material, etc.)`;
  } else if (el.type === 'image') {
    return `- Visual element at ${el.x}%, ${el.y}% (${el.size}px) - blend this naturally into the environment`;
  }
  return '';
}).filter(Boolean).join('\n')}
` : ''}

Requirements:
- Focus on the main subject/action
- Include specific visual details
- Describe composition and lighting
- Keep it concise (${options?.blendMode ? '75' : '50'} words max)
- NO text or UI elements ${options?.blendMode ? '(except the integrated elements above)' : ''}
- NO generic stock photo looks
${options?.blendMode ? '- Make integrated elements feel like original parts of the scene' : ''}`
      }
    ],
    max_tokens: options?.blendMode ? 150 : 100,
    temperature: 0.7
  });

  const scene = creativePrompt.choices[0]?.message?.content || contextSummary;

  // Build the final DALL-E prompt
  const prompt = `Create a professional YouTube thumbnail:

Scene: ${scene}

Style Requirements:
${getStyleRequirements(variation.style, clickbaitIntensity)}

${creatorType ? `Creator Type: ${creatorType}\n${getCreatorTypeGuidelines(creatorType)}\n` : ''}

${participants.length > 0 ? getParticipantPlacement(participants) : ''}

Technical Specifications:
- Maintain 16:9 aspect ratio
- Professional production quality
- Cinematic lighting and composition
- Sharp focus on main subject
- High detail and clarity
${styleProfile ? `- Match channel style: ${styleProfile.tone}` : ''}

Critical Constraints:
- NO text overlays or typography ${options?.blendMode ? '(except naturally integrated elements)' : ''}
- NO user interface elements
- NO watermarks or logos
- NO stock photo aesthetics
- NO AI-generated artifacts
- NO generic or cliché compositions
${options?.blendMode ? '- Make all elements appear naturally part of the original scene' : ''}

Composition Guidelines:
${getCompositionGuidelines(clickbaitIntensity)}

Lighting and Color:
${getLightingGuidelines(clickbaitIntensity)}`;

  return prompt;
}

function getStyleRequirements(style: string, intensity: number): string {
  const base = style.split('.')[0];
  
  if (intensity <= 3) {
    return `${base} with:
- Subtle and professional approach
- Natural lighting and composition
- Authentic emotional expression
- Clean, uncluttered scene
- Refined color palette`;
  }
  
  if (intensity <= 7) {
    return `${base} with:
- Bold but balanced approach
- Dynamic lighting contrasts
- Engaging emotional impact
- Strategic visual hierarchy
- Vibrant color relationships`;
  }
  
  return `${base} with:
- Maximum visual impact
- Dramatic lighting effects
- Intense emotional energy
- Powerful focal points
- High-contrast color scheme`;
}

function getCompositionGuidelines(intensity: number): string {
  if (intensity <= 3) {
    return `
- Balanced, professional composition
- Clear subject placement
- Thoughtful negative space
- Subtle depth layers
- Natural perspective`;
  }
  
  if (intensity <= 7) {
    return `
- Dynamic asymmetric balance
- Strong focal hierarchy
- Strategic depth staging
- Engaging perspective
- Purposeful motion hints`;
  }
  
  return `
- Dramatic composition with maximum impact
- Extreme foreground emphasis
- Bold perspective angles
- Minimal negative space
- Exaggerated depth cues`;
}

function getLightingGuidelines(intensity: number): string {
  if (intensity <= 3) {
    return `
- Professional, controlled lighting
- Natural color temperature
- Subtle highlights and shadows
- Balanced exposure
- Complementary color harmony`;
  }
  
  if (intensity <= 7) {
    return `
- Dynamic lighting contrasts
- Strategic highlights on key elements
- Atmospheric light effects
- Rich color relationships
- Mood-enhancing shadows`;
  }
  
  return `
- Extreme contrast lighting
- Dramatic color intensity
- Bold light direction
- Eye-catching glow effects
- High-impact color combinations`;
}