import OpenAI from 'openai';
import { VideoData } from '../../types';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Generate context summary using GPT
export const generateContextSummary = async (
  videoData: VideoData,
  keywords: { word: string; weight: number }[]
): Promise<string> => {
  try {
    // Extract relevant information from video data
    const { title, description } = videoData;
    
    // Get top keywords
    const topKeywords = keywords
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map(k => k.word)
      .join(', ');
    
    // Create the prompt for GPT
    const prompt = `
      Create a concise summary (max 50 words) capturing the essence of this YouTube video content.
      This will be used for thumbnail generation, so focus on visual elements and key concepts.
      
      Title: "${title}"
      Description: "${description?.substring(0, 500) || ''}"
      Keywords: ${topKeywords}
      
      Generate a visual-focused summary that helps create an engaging thumbnail.
    `;
    
    // Call GPT API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a content analyst specializing in extracting the visual essence of videos for thumbnail creation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });
    
    return response.choices[0]?.message?.content?.trim() || title;
  } catch (error) {
    console.error('Error generating context summary:', error);
    // Fallback to title if API call fails
    return videoData.title;
  }
};

// Create participant detection and analysis
export const detectParticipants = async (videoData: VideoData): Promise<any[]> => {
  try {
    // This would normally analyze video frames to detect participants
    // For MVP, we'll use a simpler approach based on metadata
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You detect and analyze potential video participants based on video metadata."
        },
        {
          role: "user",
          content: `
            Based on this YouTube video information, identify potential main participants/subjects that should 
            appear in the thumbnail. Format the response as a JSON array of objects with name and importance (1-10) properties.
            
            Title: "${videoData.title}"
            Description: "${videoData.description?.substring(0, 500) || ''}"
            Channel: "${videoData.channelTitle || 'Unknown'}"
          `
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });
    
    const content = response.choices[0]?.message?.content || '{"participants": []}';
    const result = JSON.parse(content);
    return result.participants || [];
  } catch (error) {
    console.error('Error detecting participants:', error);
    return [];
  }
};

// Analyze channel type
export const analyzeChannelType = async (
  videoData: VideoData,
  recentThumbnails: string[]
): Promise<string> => {
  try {
    // For MVP, use a simplified approach based on available data
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You analyze YouTube channels to determine their primary type/category."
        },
        {
          role: "user",
          content: `
            Based on this information, determine the most likely channel type from these options:
            gaming, tutorial, vlog, entertainment, education, review, business, music, news, other
            
            Channel: "${videoData.channelTitle || 'Unknown'}"
            Video Title: "${videoData.title}"
            Description Preview: "${videoData.description?.substring(0, 300) || ''}"
            Thumbnail Count: ${recentThumbnails.length}
            
            Respond with a single word representing the channel type.
          `
        }
      ],
      max_tokens: 20,
      temperature: 0.3
    });
    
    return response.choices[0]?.message?.content?.trim().toLowerCase() || 'other';
  } catch (error) {
    console.error('Error analyzing channel type:', error);
    return 'other';
  }
};

// Generate cost-optimized prompts
export const optimizePrompt = async (
  originalPrompt: string,
  costLevel: number = 5
): Promise<string> => {
  try {
    // Cost level 1-10: 1 = maximum economy, 10 = maximum quality
    if (costLevel >= 8) {
      // High quality - use original prompt
      return originalPrompt;
    }
    
    // For lower cost levels, optimize the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You optimize DALL-E prompts for cost efficiency while maintaining quality.
          Cost optimization level: ${costLevel}/10 (1=max economy, 10=max quality)`
        },
        {
          role: "user",
          content: `
            Optimize this DALL-E prompt for cost efficiency while maintaining core visual elements.
            Reduce unnecessary details and focus on the most important visual components.
            
            Original Prompt:
            ${originalPrompt}
            
            Create a more concise and focused version that will still generate an effective thumbnail.
          `
        }
      ],
      max_tokens: 200,
      temperature: 0.5
    });
    
    return response.choices[0]?.message?.content?.trim() || originalPrompt;
  } catch (error) {
    console.error('Error optimizing prompt:', error);
    return originalPrompt;
  }
}; 