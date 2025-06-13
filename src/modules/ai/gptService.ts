import OpenAI from 'openai';
import { VideoData, Dictionary } from '../../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateContextSummary = async (
  videoData: VideoData,
  dictionary?: Dictionary
): Promise<string> => {
  try {
    const keywordContext = dictionary?.keywords
      ? `\nTop keywords: ${dictionary.keywords
          .slice(0, 5)
          .map(k => k.word)
          .join(', ')}
Channel niche: ${dictionary.niche}
Content categories: ${Object.entries(dictionary.categories)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([cat]) => cat)
  .join(', ')}`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a visual content expert specializing in YouTube thumbnails.
Create compelling, specific scene descriptions that will guide thumbnail generation.
Focus on visual elements, mood, and composition that would make an engaging thumbnail.`
        },
        {
          role: "user",
          content: `Create a specific, visual scene description for a YouTube thumbnail (max 50 words).

Video Title: ${videoData.title}
Description: ${videoData.description}${keywordContext}

Requirements:
- Focus on concrete visual elements
- Include mood and atmosphere
- Specify composition elements
- NO generic descriptions
- NO text or UI suggestions`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || "A compelling visual scene";
  } catch (error) {
    // Fallback to video description if API fails
    return videoData.description.slice(0, 100);
  }
};