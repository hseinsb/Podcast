import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { PodcastEntry, SearchFilters } from '@/types';

const COLLECTION_NAME = 'podcast-entries';

// Helper function to convert Firestore data to PodcastEntry
export const convertFirestoreData = (doc: QueryDocumentSnapshot<DocumentData>): PodcastEntry => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: data.date?.toDate ? data.date.toDate() : data.date,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
  } as PodcastEntry;
};

// Helper function to prepare data for Firestore
export const prepareForFirestore = (entry: Partial<PodcastEntry>) => {
  const now = Timestamp.now();
  return {
    ...entry,
    date: entry.date instanceof Date ? Timestamp.fromDate(entry.date) : entry.date,
    updatedAt: now,
    createdAt: entry.createdAt || now,
  };
};

// Create a new podcast entry
export const createPodcastEntry = async (entry: Omit<PodcastEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), prepareForFirestore(entry));
    return docRef.id;
  } catch (error) {
    console.error('Error creating podcast entry:', error);
    throw new Error('Failed to create podcast entry');
  }
};

// Get a single podcast entry by ID
export const getPodcastEntry = async (id: string): Promise<PodcastEntry | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return convertFirestoreData(docSnap as QueryDocumentSnapshot<DocumentData>);
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting podcast entry:', error);
    throw new Error('Failed to get podcast entry');
  }
};

// Update a podcast entry
export const updatePodcastEntry = async (id: string, updates: Partial<PodcastEntry>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, prepareForFirestore(updates));
  } catch (error) {
    console.error('Error updating podcast entry:', error);
    throw new Error('Failed to update podcast entry');
  }
};

// Delete a podcast entry
export const deletePodcastEntry = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting podcast entry:', error);
    throw new Error('Failed to delete podcast entry');
  }
};

// Semantic search function that prioritizes tags and main content
export const searchPodcastEntries = async (
  searchQuery: string,
  filters?: Omit<SearchFilters, 'query'>,
  pageSize: number = 20
): Promise<{ entries: PodcastEntry[]; searchResults: { tagMatches: PodcastEntry[]; titleMatches: PodcastEntry[]; contentMatches: PodcastEntry[] } }> => {
  try {
    // Get all entries (we'll do client-side filtering for semantic search)
    let q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    // Add structured filters
    if (filters?.speaker) {
      q = query(q, where('speaker', '==', filters.speaker));
    }

    if (filters?.dateRange) {
      q = query(
        q,
        where('date', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('date', '<=', Timestamp.fromDate(filters.dateRange.end))
      );
    }

    const querySnapshot = await getDocs(q);
    let entries = querySnapshot.docs.map(convertFirestoreData);

    if (!searchQuery) {
      return {
        entries: entries.slice(0, pageSize),
        searchResults: { tagMatches: [], titleMatches: [], contentMatches: [] }
      };
    }

    const searchTerm = searchQuery.toLowerCase();
    
    // Semantic search with priority scoring
    const tagMatches: PodcastEntry[] = [];
    const titleMatches: PodcastEntry[] = [];
    const mainIdeaMatches: PodcastEntry[] = [];
    const contentMatches: PodcastEntry[] = [];
    
    entries.forEach(entry => {
      const hasTagMatch = entry.tags?.some(tag => 
        tag.toLowerCase().includes(searchTerm) || 
        searchTerm.includes(tag.toLowerCase())
      );
      
      const hasTitleMatch = entry.title.toLowerCase().includes(searchTerm);
      const hasSpeakerMatch = entry.speaker.toLowerCase().includes(searchTerm);
      const hasMainIdeaMatch = entry.mainIdea.toLowerCase().includes(searchTerm);
      const hasCentralProblemMatch = entry.centralProblem.toLowerCase().includes(searchTerm);
      
      const hasContentMatch = 
        entry.keyTakeaways.some(takeaway => takeaway.toLowerCase().includes(searchTerm)) ||
        entry.strengths.some(strength => strength.toLowerCase().includes(searchTerm)) ||
        entry.weaknesses.some(weakness => weakness.toLowerCase().includes(searchTerm)) ||
        entry.practicalLessons.some(lesson => lesson.toLowerCase().includes(searchTerm));
      
      // STRICT SEARCH: Only show tag matches and title/speaker matches
      // Priority 1: Tag matches (most relevant - podcasts actually about the topic)
      if (hasTagMatch) {
        tagMatches.push(entry);
      }
      // Priority 2: Title and speaker matches (directly relevant)
      else if (hasTitleMatch || hasSpeakerMatch) {
        titleMatches.push(entry);
      }
      // Priority 3: Main idea matches (core content relevance)
      else if (hasMainIdeaMatch || hasCentralProblemMatch) {
        mainIdeaMatches.push(entry);
      }
      // REMOVED: Content matches - no more random keyword mentions!
      // This prevents podcasts that just mention "marketing" in passing from appearing
    });

    // Combine results by priority (no more content matches)
    const prioritizedResults = [
      ...tagMatches,
      ...titleMatches,
      ...mainIdeaMatches
    ];

    return {
      entries: prioritizedResults.slice(0, pageSize),
      searchResults: {
        tagMatches,
        titleMatches: [...titleMatches, ...mainIdeaMatches],
        contentMatches: [] // Always empty now - no random keyword mentions
      }
    };
  } catch (error) {
    console.error('Error searching podcast entries:', error);
    throw new Error('Failed to search podcast entries');
  }
};

// Get all podcast entries with optional filters and pagination (legacy function)
export const getPodcastEntries = async (
  filters?: SearchFilters,
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ entries: PodcastEntry[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> => {
  try {
    // Use new search function if there's a query
    if (filters?.query) {
      const { entries } = await searchPodcastEntries(filters.query, filters, pageSize);
      return { entries, lastDoc: undefined };
    }

    let q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // Add search filters
    if (filters?.speaker) {
      q = query(q, where('speaker', '==', filters.speaker));
    }

    if (filters?.dateRange) {
      q = query(
        q,
        where('date', '>=', Timestamp.fromDate(filters.dateRange.start)),
        where('date', '<=', Timestamp.fromDate(filters.dateRange.end))
      );
    }

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const entries = querySnapshot.docs.map(convertFirestoreData);

    return {
      entries,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error('Error getting podcast entries:', error);
    throw new Error('Failed to get podcast entries');
  }
};

// Get entries by speaker
export const getEntriesBySpeaker = async (speaker: string): Promise<PodcastEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('speaker', '==', speaker),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertFirestoreData);
  } catch (error) {
    console.error('Error getting entries by speaker:', error);
    throw new Error('Failed to get entries by speaker');
  }
};

// Get all unique speakers
export const getAllSpeakers = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const speakers = new Set<string>();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.speaker) {
        speakers.add(data.speaker);
      }
    });
    
    return Array.from(speakers).sort();
  } catch (error) {
    console.error('Error getting speakers:', error);
    
    // Check if it's a permission error
    if (error instanceof Error && error.message.includes('permission')) {
      console.warn('Firestore permission denied. Please check your security rules.');
      return []; // Return empty array instead of throwing
    }
    
    // For other errors, still return empty array but log the issue
    console.warn('Firestore access failed, returning empty speakers list');
    return [];
  }
};

// Get all unique tags for filtering
export const getAllTags = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const tags = new Set<string>();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          if (tag && tag.trim()) {
            tags.add(tag.trim());
          }
        });
      }
    });
    
    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error getting tags:', error);
    
    // Check if it's a permission error
    if (error instanceof Error && error.message.includes('permission')) {
      console.warn('Firestore permission denied. Please check your security rules.');
      return []; // Return empty array instead of throwing
    }
    
    // For other errors, still return empty array but log the issue
    console.warn('Firestore access failed, returning empty tags list');
    return [];
  }
};

// Batch update multiple entries
export const batchUpdateEntries = async (updates: { id: string; data: Partial<PodcastEntry> }[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, data }) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.update(docRef, prepareForFirestore(data));
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error batch updating entries:', error);
    throw new Error('Failed to batch update entries');
  }
};

