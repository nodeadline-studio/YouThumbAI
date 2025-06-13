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
    // Determine which style variations to use based on the creative direction
    let stylesToUse = STYLE_VARIATIONS;
    if (options.creativeDirection) {
      switch(options.creativeDirection) {
        case 'original':
          stylesToUse = [STYLE_VARIATIONS[0]];
          break;
        case 'dynamic':
          stylesToUse = [STYLE_VARIATIONS[1]];
          break;
        case 'artistic':
          stylesToUse = [STYLE_VARIATIONS[2]];
          break;
        case 'gaming':
          stylesToUse = [STYLE_VARIATIONS[3]];
          break;
        case 'tutorial':
          stylesToUse = [STYLE_VARIATIONS[4]];
          break;
        case 'vlog':
          stylesToUse = [STYLE_VARIATIONS[5]];
          break;
        case 'business':
          stylesToUse = [STYLE_VARIATIONS[6]];
          break;
        case 'entertainment':
          stylesToUse = [STYLE_VARIATIONS[7]];
          break;
        default:
          stylesToUse = STYLE_VARIATIONS.slice(0, options.variationCount || 1);
      }
    } else {
      stylesToUse = STYLE_VARIATIONS.slice(0, options.variationCount || 1);
    }
    
    const results = await Promise.all(
      stylesToUse.map(async (variation) => {
        // Adjust style based on language and cultural context
        const culturalContext = getCulturalContext(videoData.language.code);
        
        // Adjust style based on consistency setting
        const styleWeight = (options.styleConsistency || 100) / 100;
        
        const styleProfile = options.selectedReferenceThumbnails?.length
          ? await buildStyleProfile(options.selectedReferenceThumbnails)
          : null;

        const prompt = await buildPrompt(
          videoData,
          options.contextSummary || '',
          variation,
          styleProfile,
          options.clickbaitIntensity,
          styleWeight,
          culturalContext,
          options.creatorType || null,
          options.participants || []
        );

        // Adjust quality based on cost optimization setting
        const quality = getQualityByCostSetting(options.costOptimization || 'standard');

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: "1792x1024",
          quality,
          style: "vivid"
        });

        // Handle possible undefined response data
        if (!response.data?.[0]?.url) {
          throw new Error(`Failed to generate ${variation.label} variation`);
        }

        let finalImageUrl = response.data[0].url;

        // Apply face swap if enabled and Replicate is configured
        if (options.enableFaceSwap && isReplicateConfigured() && videoData.thumbnailUrl) {
          try {
            console.log(`Applying face swap for ${variation.label} variation`);
            finalImageUrl = await generateThumbnailWithFaceSwap(
              videoData,
              response.data[0].url,
              true
            );
            console.log(`Face swap completed for ${variation.label}`);
          } catch (faceSwapError) {
            console.warn(`Face swap failed for ${variation.label}, using original:`, faceSwapError);
            // Keep the original DALL-E generated image if face swap fails
          }
        }

        return {
          url: finalImageUrl,
          label: variation.label + (options.enableFaceSwap && isReplicateConfigured() ? ' (with face swap)' : ''),
          prompt: prompt
        };
      })
    );
    return results;

  } catch (error) {
    console.error('DALL-E API Error:', error);
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
  participants: Participant[]
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

${participants.length > 0 ? getParticipantPlacement(participants) : ''}

Requirements:
- Focus on the main subject/action
- Include specific visual details
- Describe composition and lighting
- Keep it concise (50 words max)
- NO text or UI elements
- NO generic stock photo looks`
      }
    ],
    max_tokens: 100,
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
- NO text overlays or typography
- NO user interface elements
- NO watermarks or logos
- NO stock photo aesthetics
- NO AI-generated artifacts
- NO generic or cliché compositions

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