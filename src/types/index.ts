import { Timestamp } from 'firebase/firestore';

export interface PodcastEntry {
  id?: string;
  title: string;
  youtubeLink: string;
  date: Timestamp | Date;
  speaker: string;
  mainIdea: string;
  keyTakeaways: string[];
  centralProblem: string;
  strengths: string[];
  weaknesses: string[];
  counterarguments: string[];
  practicalLessons: string[];
  twoMinuteVersion: string[];
  actionChecklist: string[];
  socialMediaHooks: string[];
  contentTopics: string[];
  monetizationIdeas: string[];
  tags: string[]; // AI-generated topic tags
  notes: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface PodcastEntryForm {
  title: string;
  youtubeLink: string;
  date: string;
  speaker: string;
  mainIdea: string;
  keyTakeaways: string[];
  centralProblem: string;
  strengths: string[];
  weaknesses: string[];
  counterarguments: string[];
  practicalLessons: string[];
  twoMinuteVersion: string[];
  actionChecklist: string[];
  socialMediaHooks: string[];
  contentTopics: string[];
  monetizationIdeas: string[];
  tags: string[];
  notes: string;
}

export interface ParsedNotebookLMData {
  title?: string;
  speaker?: string;
  mainIdea?: string;
  keyTakeaways?: string[];
  centralProblem?: string;
  strengths?: string[];
  weaknesses?: string[];
  counterarguments?: string[];
  practicalLessons?: string[];
  twoMinuteVersion?: string[];
  actionChecklist?: string[];
}

export interface GeneratedContent {
  socialMediaHooks: string[];
  contentTopics: string[];
  monetizationIdeas: string[];
}

export interface SearchFilters {
  query: string;
  speaker?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export interface ExportOptions {
  format: 'pdf' | 'markdown';
  sections?: (keyof PodcastEntry)[];
  includeMetadata?: boolean;
}

