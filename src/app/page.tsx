'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Filter, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PodcastEntry, SearchFilters } from '@/types';
import { getPodcastEntries, getAllSpeakers, getAllTags, searchPodcastEntries } from '@/lib/firestore';
import { searchInEntry, debounce, formatDate, getEntryPreview, getRandomHook } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function HomePage() {
  const [entries, setEntries] = useState<PodcastEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<PodcastEntry[]>([]);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    tagMatches: PodcastEntry[];
    titleMatches: PodcastEntry[];
    contentMatches: PodcastEntry[];
  } | null>(null);

  // Load entries, speakers, and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [entriesResult, speakersResult, tagsResult] = await Promise.all([
          getPodcastEntries(),
          getAllSpeakers(),
          getAllTags()
        ]);
        
        setEntries(entriesResult.entries);
        setFilteredEntries(entriesResult.entries);
        setSpeakers(speakersResult);
        setAllTags(tagsResult);
      } catch (err) {
        setError('Failed to load podcast entries');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Semantic search and filter entries
  const performSearch = debounce(async (query: string, speaker: string, tags: string[]) => {
    try {
      if (query.trim()) {
        // Use semantic search when there's a query
        const { entries: searchResults, searchResults: searchBreakdown } = await searchPodcastEntries(
          query,
          { speaker },
          50
        );
        
        // Filter by selected tags
        let filtered = searchResults;
        if (tags.length > 0) {
          filtered = searchResults.filter(entry => 
            entry.tags?.some(tag => tags.includes(tag))
          );
        }
        
        setFilteredEntries(filtered);
        setSearchResults(searchBreakdown);
      } else {
        // No search query - just filter by speaker and tags
        let filtered = entries;
        
        if (speaker) {
          filtered = filtered.filter(entry => entry.speaker === speaker);
        }
        
        if (tags.length > 0) {
          filtered = filtered.filter(entry => 
            entry.tags?.some(tag => tags.includes(tag))
          );
        }
        
        setFilteredEntries(filtered);
        setSearchResults(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to simple filtering
      let filtered = entries;
      if (speaker) {
        filtered = filtered.filter(entry => entry.speaker === speaker);
      }
      setFilteredEntries(filtered);
    }
  }, 300);

  useEffect(() => {
    performSearch(searchQuery, selectedSpeaker, selectedTags);
  }, [searchQuery, selectedSpeaker, selectedTags, entries, performSearch]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSpeakerFilter = (speaker: string) => {
    setSelectedSpeaker(speaker);
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSpeaker('');
    setSelectedTags([]);
    setShowFilters(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Podcast Refinery</h1>
            </div>
            
            <Link href="/new">
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Entry</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search podcasts, speakers, topics..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-pill pl-12 w-full"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center space-x-2 ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="card p-6 animate-slide-up">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speaker
                    </label>
                    <select
                      value={selectedSpeaker}
                      onChange={(e) => handleSpeakerFilter(e.target.value)}
                      className="input-field"
                    >
                      <option value="">All speakers</option>
                      {speakers.map(speaker => (
                        <option key={speaker} value={speaker}>
                          {speaker}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="btn-ghost"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Topic Tags */}
                {allTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Topic Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagFilter(tag)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            selectedTags.includes(tag)
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    {selectedTags.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Results Breakdown */}
        {searchResults && searchQuery && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Search Results Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                <span className="text-blue-800">
                  <strong>{searchResults.tagMatches.length}</strong> topic matches
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                <span className="text-blue-800">
                  <strong>{searchResults.titleMatches.length}</strong> title/speaker matches
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                <span className="text-blue-800">
                  <strong>{searchResults.contentMatches.length}</strong> content matches
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            {entries.length === 0 ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No podcast entries yet</h3>
                <p className="text-gray-500">Get started by creating your first podcast entry.</p>
                <Link href="/new">
                  <button className="btn-primary mt-4">
                    Create First Entry
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                <p className="text-gray-500">Try adjusting your search or filters.</p>
                <button onClick={clearFilters} className="btn-secondary">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Stats */}
        {entries.length > 0 && (
          <div className="mt-12 text-center text-sm text-gray-500">
            Showing {filteredEntries.length} of {entries.length} entries
            {speakers.length > 0 && (
              <span> • {speakers.length} speakers</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: PodcastEntry }) {
  const randomHook = getRandomHook(entry.socialMediaHooks);
  
  return (
    <Link href={`/entry/${entry.id}`}>
      <div className="card card-hover p-6 h-full animate-fade-in">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                {entry.title}
              </h3>
              <p className="text-sm text-gray-500">
                {entry.speaker} • {formatDate(entry.date)}
              </p>
            </div>
            {entry.socialMediaHooks.length > 0 && (
              <div className="ml-3 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-accent-500" />
              </div>
            )}
          </div>

          {/* Content Preview */}
          <div className="flex-1 space-y-3">
            <p className="text-gray-600 text-sm line-clamp-3">
              {getEntryPreview(entry)}
            </p>
            
            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                    +{entry.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {randomHook && (
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-3">
                <p className="text-accent-800 text-sm font-medium">
                  💡 &ldquo;{randomHook}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                {entry.keyTakeaways.length > 0 && (
                  <span>{entry.keyTakeaways.length} takeaways</span>
                )}
                {entry.actionChecklist.length > 0 && (
                  <span>{entry.actionChecklist.length} actions</span>
                )}
              </div>
              <span>View Details →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
