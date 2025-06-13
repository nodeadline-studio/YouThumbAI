import { VideoData } from '../types';

interface Dictionary {
  channelId: string;
  niche: string;
  keywords: { word: string; weight: number }[];
  categories: { [key: string]: number };
  lastUpdated: number;
}

const dictionaries = new Map<string, Dictionary>();

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with'
]);

const tokenize = (text: string): string[] => {
  return text.toLowerCase()
    .replace(/[^\w\s#]/g, '')
    .split(/\s+/)
    .filter(word => (word.length > 2 || word.startsWith('#')) && !stopWords.has(word));
};

const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[\w-]+/g;
  return (text.match(hashtagRegex) || []).map(tag => tag.toLowerCase());
};

const extractPhrases = (text: string): string[] => {
  const phraseRegex = /"([^"]+)"|'([^']+)'|\b(\w+\s+\w+\s+\w+)\b/g;
  const matches = Array.from(text.matchAll(phraseRegex));
  return matches.map(match => match[1] || match[2] || match[3]).filter(Boolean);
};

const calculateTfIdf = (term: string, doc: string, docs: string[]): number => {
  // Term frequency in current document
  const tf = tokenize(doc).filter(word => word === term).length;
  
  // Document frequency (number of docs containing the term)
  const df = docs.filter(doc => tokenize(doc).includes(term)).length;
  
  // Inverse document frequency
  const idf = Math.log(docs.length / (df + 1));
  
  return tf * idf;
};

export const generateDictionary = (videos: VideoData[]): Dictionary => {
  const docs = videos.map(video => `${video.title} ${video.description}`);
  const allTerms = new Set(docs.flatMap(tokenize));
  const allHashtags = new Set(docs.flatMap(extractHashtags));
  const allPhrases = new Set(docs.flatMap(extractPhrases));
  const keywords = new Map<string, number>();
  const categories = new Map<string, number>();
  
  // Process single words
  allTerms.forEach(term => {
    const totalWeight = docs.reduce((sum, doc, index) => {
      return sum + calculateTfIdf(term, doc, docs);
    }, 0);
    keywords.set(term, totalWeight);
  });
  
  // Process hashtags with higher weight
  allHashtags.forEach(tag => {
    const weight = docs.filter(doc => doc.includes(tag)).length * 2;
    keywords.set(tag, (keywords.get(tag) || 0) + weight);
  });
  
  // Process phrases with higher weight
  allPhrases.forEach(phrase => {
    const weight = docs.filter(doc => doc.includes(phrase)).length * 1.5;
    keywords.set(phrase, (keywords.get(phrase) || 0) + weight);
  });
  
  // Categorize content
  const contentCategories = detectCategories(Array.from(keywords.entries()));
  
  // Sort keywords by weight
  const sortedKeywords = Array.from(keywords.entries())
    .map(([word, weight]) => ({ word, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 100); // Keep top 100 keywords
  
  const channelId = videos[0]?.channelId || 'unknown';
  
  return {
    channelId,
    niche: detectNiche(sortedKeywords),
    keywords: sortedKeywords,
    categories: contentCategories,
    lastUpdated: Date.now()
  };
};

const detectCategories = (keywords: [string, number][]): { [key: string]: number } => {
  const categories = {
    tutorial: ['how to', 'tutorial', 'guide', 'learn', 'step by step'],
    entertainment: ['funny', 'amazing', 'best', 'incredible', 'awesome'],
    review: ['review', 'comparison', 'vs', 'versus', 'unboxing'],
    news: ['breaking', 'news', 'update', 'latest', 'announcement'],
    gaming: ['gameplay', 'playthrough', 'gaming', 'stream', 'live'],
    tech: ['technology', 'software', 'hardware', 'programming', 'code'],
    lifestyle: ['vlog', 'daily', 'routine', 'life', 'experience'],
    educational: ['education', 'course', 'lesson', 'training', 'workshop']
  };

  const scores: { [key: string]: number } = {};

  for (const [category, terms] of Object.entries(categories)) {
    scores[category] = keywords.reduce((score, [word, weight]) => {
      return score + (terms.some(term => word.includes(term)) ? weight : 0);
    }, 0);
  }

  return scores;
};

export const detectNiche = (keywords: { word: string; weight: number }[]): string => {
  const niches = {
    gaming: ['game', 'gaming', 'playthrough', 'minecraft', 'fortnite'],
    tech: ['technology', 'programming', 'coding', 'software', 'hardware'],
    education: ['learn', 'tutorial', 'guide', 'howto', 'education'],
    entertainment: ['vlog', 'reaction', 'comedy', 'funny', 'entertainment'],
    business: ['business', 'marketing', 'entrepreneur', 'startup', 'finance'],
    lifestyle: ['lifestyle', 'vlog', 'daily', 'routine', 'personal'],
    news: ['news', 'update', 'latest', 'breaking', 'report'],
    review: ['review', 'unboxing', 'comparison', 'testing', 'hands-on']
  };
  
  let maxScore = 0;
  let detectedNiche = 'general';
  
  for (const [niche, nicheKeywords] of Object.entries(niches)) {
    const score = nicheKeywords.reduce((acc, keyword) => {
      const found = keywords.find(k => k.word.toLowerCase().includes(keyword));
      return acc + (found ? found.weight : 0);
    }, 0);
    
    if (score > maxScore) {
      maxScore = score;
      detectedNiche = niche;
    }
  }
  
  return detectedNiche;
};

export const getDictionary = (channelId: string): Dictionary | undefined => {
  const dictionary = dictionaries.get(channelId);
  
  if (!dictionary || Date.now() - dictionary.lastUpdated > 24 * 60 * 60 * 1000) {
    return undefined;
  }
  
  return dictionary;
};

export const updateDictionary = (channelId: string, dictionary: Dictionary): void => {
  dictionaries.set(channelId, dictionary);
};