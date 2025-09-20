import { ParsedNotebookLMData, GeneratedContent } from '@/types';

// Parse NotebookLM text using API route
export const parseNotebookLMText = async (rawText: string): Promise<ParsedNotebookLMData> => {
  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse text');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error parsing NotebookLM text:', error);
    throw new Error('Failed to parse NotebookLM text');
  }
};

// Generate content ideas using API route
export const generateContentIdeas = async (
  mainIdea: string,
  keyTakeaways: string[],
  centralProblem: string
): Promise<GeneratedContent> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mainIdea,
        keyTakeaways,
        centralProblem,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate content');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error generating content ideas:', error);
    throw new Error('Failed to generate content ideas');
  }
};

// Generate semantic topic tags for the podcast
export const generateTopicTags = async (
  title: string,
  mainIdea: string,
  keyTakeaways: string[],
  centralProblem: string,
  speaker?: string
): Promise<string[]> => {
  try {
    const response = await fetch('/api/generate-tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        mainIdea,
        keyTakeaways,
        centralProblem,
        speaker,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate tags');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error generating topic tags:', error);
    // Return fallback tags based on content
    return generateFallbackTags(mainIdea, keyTakeaways);
  }
};

// Fallback tag generation if AI fails
const generateFallbackTags = (mainIdea: string, keyTakeaways: string[]): string[] => {
  const fallbackTags: string[] = [];
  const content = `${mainIdea} ${keyTakeaways.join(' ')}`.toLowerCase();
  
  // Simple keyword-based fallback tags
  const tagMap = {
    'business': 'Business',
    'marketing': 'Marketing',
    'entrepreneur': 'Entrepreneurship',
    'finance': 'Finance',
    'investment': 'Investment',
    'technology': 'Technology',
    'ai': 'AI & Technology',
    'health': 'Health & Wellness',
    'productivity': 'Productivity',
    'leadership': 'Leadership',
    'personal': 'Personal Development',
    'money': 'Personal Finance',
  };
  
  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (content.includes(keyword) && !fallbackTags.includes(tag)) {
      fallbackTags.push(tag);
    }
  }
  
  return fallbackTags.length > 0 ? fallbackTags : ['General'];
};

// Generate a better title if the parsed title is missing or generic
export const generateTitle = async (mainIdea: string, speaker?: string): Promise<string> => {
  try {
    // For now, we'll generate a simple title client-side
    // You could create another API route for this if needed
    if (!mainIdea) return 'Untitled Podcast Entry';
    
    const words = mainIdea.split(' ').slice(0, 8).join(' ');
    return speaker ? `${speaker}: ${words}` : words;
  } catch (error) {
    console.error('Error generating title:', error);
    return 'Untitled Podcast Entry';
  }
};
