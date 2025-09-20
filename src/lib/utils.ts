import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PodcastEntry } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export const formatDate = (date: Date | string | any): string => {
  if (!date) return '';
  
  // Handle Firestore Timestamp objects
  if (date && typeof date === 'object' && 'toDate' in date) {
    const dateObj = date.toDate();
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

// Format date for form inputs
export const formatDateForInput = (date: Date | string | any): string => {
  if (!date) return '';
  
  // Handle Firestore Timestamp objects
  if (date && typeof date === 'object' && 'toDate' in date) {
    const dateObj = date.toDate();
    return dateObj.toISOString().split('T')[0];
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toISOString().split('T')[0];
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Extract YouTube video ID from URL
export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return match && match[2].length === 11 ? match[2] : null;
};

// Generate YouTube thumbnail URL
export const getYouTubeThumbnail = (url: string): string | null => {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Validate YouTube URL
export const isValidYouTubeUrl = (url: string): boolean => {
  if (!url) return true; // Empty URL is valid (optional field)
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(&[\w=]*)?$/;
  return youtubeRegex.test(url);
};

// Convert array of strings to formatted text
export const arrayToText = (arr: string[]): string => {
  if (!arr || arr.length === 0) return '';
  return arr.map(item => `• ${item}`).join('\n');
};

// Convert formatted text back to array
export const textToArray = (text: string): string[] => {
  if (!text) return [];
  
  return text
    .split('\n')
    .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(line => line.length > 0);
};

// Search within podcast entry
export const searchInEntry = (entry: PodcastEntry, query: string): boolean => {
  if (!query) return true;
  
  const searchTerm = query.toLowerCase();
  const searchableFields = [
    entry.title,
    entry.speaker,
    entry.mainIdea,
    entry.centralProblem,
    entry.notes,
    ...entry.keyTakeaways,
    ...entry.strengths,
    ...entry.weaknesses,
    ...entry.counterarguments,
    ...entry.practicalLessons,
    ...entry.twoMinuteVersion,
    ...entry.actionChecklist,
    ...entry.socialMediaHooks,
    ...entry.contentTopics,
    ...entry.monetizationIdeas,
  ];
  
  return searchableFields.some(field => 
    field && field.toLowerCase().includes(searchTerm)
  );
};

// Get entry preview text
export const getEntryPreview = (entry: PodcastEntry): string => {
  if (entry.mainIdea) {
    return truncateText(entry.mainIdea, 120);
  }
  
  if (entry.keyTakeaways.length > 0) {
    return truncateText(entry.keyTakeaways[0], 120);
  }
  
  return 'No preview available';
};

// Get a random hook for preview
export const getRandomHook = (hooks: string[]): string => {
  if (!hooks || hooks.length === 0) return '';
  return hooks[Math.floor(Math.random() * hooks.length)];
};

// Debounce function for search
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Local storage helpers
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle quota exceeded or other errors silently
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle errors silently
    }
  }
};

