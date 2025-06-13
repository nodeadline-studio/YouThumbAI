import { StyleProfile, VideoData } from '../types';
import { getStyleDescription } from '../services/styleProfiler';

export function makeThumbPrompt(
  style: StyleProfile,
  title: string,
  clickbait: number,
  videoData: VideoData
): string {
  const styleDesc = getStyleDescription(style);
  const intensity = getIntensityLevel(clickbait);
  const composition = getCompositionGuide(style.layout);
  const colorGuide = getColorGuide(style.palette);
  const typography = getTypographyGuide(style.fontHint, videoData.language.direction);

  return `
Create a professional YouTube thumbnail:

Title: "${title}"
Style Profile:
${styleDesc}

Composition:
${composition}

Color Treatment:
${colorGuide}

Typography Considerations:
${typography}

Impact Level (${clickbait}/10):
${intensity}

Technical Requirements:
- Maintain 16:9 aspect ratio
- Ensure readability at thumbnail size
- No text or UI elements in the image
- Professional production quality
`.trim();
}

function getIntensityLevel(clickbait: number): string {
  if (clickbait <= 3) {
    return `
- Subtle and professional approach
- Focus on quality and authenticity
- Refined visual hierarchy
- Elegant color treatment
- Thoughtful negative space`;
  }
  
  if (clickbait <= 7) {
    return `
- Bold but balanced approach
- Strong visual impact while maintaining professionalism
- Dynamic composition with clear focus
- Vibrant but controlled color palette
- Strategic use of contrast`;
  }
  
  return `
- Maximum visual impact
- Attention-commanding presence
- Dramatic lighting and contrast
- Bold color relationships
- Powerful compositional hierarchy`;
}

function getCompositionGuide(layout: string): string {
  const guides = {
    subject_left_text_right: 'Position main subject on left third, leave clean space on right for text overlay',
    subject_right_text_left: 'Position main subject on right third, leave clean space on left for text overlay',
    subject_center: 'Center the main subject with balanced negative space for text above/below',
    split_vertical: 'Create a clear vertical division with contrasting elements on each side',
    full_bleed: 'Use a full-frame subject with strategic areas of low detail for text',
  };
  
  return guides[layout as keyof typeof guides] || guides.subject_center;
}

function getColorGuide(palette: string[]): string {
  return `
- Primary: ${palette[0]} for main elements
- Secondary: ${palette[1]} for supporting elements
- Accent: ${palette[2]} for highlights and emphasis
- Ensure strong contrast for visual hierarchy
- Maintain color harmony throughout`;
}

function getTypographyGuide(fontHint: string, direction: 'ltr' | 'rtl'): string {
  const baseGuide = `
- Clear hierarchy for different text elements
- Maintain legibility at thumbnail size
- Use contrast for text visibility
- ${direction === 'rtl' ? 'Support right-to-left text layout' : 'Standard left-to-right text layout'}`;
  
  const fontGuides = {
    bold_sans: '- Strong, impactful sans-serif styling',
    condensed_sans: '- Space-efficient condensed typography',
    clean_modern: '- Contemporary, minimalist type treatment',
    decorative: '- Stylized, attention-grabbing fonts',
    elegant_serif: '- Sophisticated serif typography',
  };
  
  return `${baseGuide}\n${fontGuides[fontHint as keyof typeof fontGuides]}`;
}