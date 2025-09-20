'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Copy,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Calendar,
  User,
  Sparkles,
  Target,
  TrendingUp,
  CheckSquare,
  MessageSquare,
  BookOpen,
  DollarSign,
  StickyNote,
  FileText,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { PodcastEntry } from '@/types';
import { getPodcastEntry, updatePodcastEntry, deletePodcastEntry } from '@/lib/firestore';
import { 
  formatDate, 
  formatDateForInput, 
  copyToClipboard, 
  arrayToText, 
  textToArray,
  getYouTubeThumbnail,
  isValidYouTubeUrl 
} from '@/lib/utils';
import { exportToPDF, downloadMarkdown, copySection, generateSummary } from '@/lib/export';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  count?: number;
}

function CollapsibleSection({ title, icon, children, defaultExpanded = false, count }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="section-collapsible">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="section-header w-full"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <span className="font-medium text-gray-900">{title}</span>
          {count !== undefined && (
            <span className="badge">{count}</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<PodcastEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedEntry, setEditedEntry] = useState<PodcastEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load entry
  useEffect(() => {
    const loadEntry = async () => {
      try {
        setIsLoading(true);
        const entryData = await getPodcastEntry(entryId);
        
        if (!entryData) {
          setError('Entry not found');
          return;
        }
        
        setEntry(entryData);
        setEditedEntry(entryData);
      } catch (err) {
        setError('Failed to load entry');
        console.error('Error loading entry:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (entryId) {
      loadEntry();
    }
  }, [entryId]);

  const handleSave = async () => {
    if (!editedEntry || !entry) return;

    try {
      setIsSaving(true);
      setError(null);

      // Validate YouTube URL if provided
      if (editedEntry.youtubeLink && !isValidYouTubeUrl(editedEntry.youtubeLink)) {
        setError('Please enter a valid YouTube URL');
        return;
      }

      await updatePodcastEntry(entry.id!, editedEntry);
      setEntry(editedEntry);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error saving entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedEntry(entry);
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!entry?.id) return;

    try {
      await deletePodcastEntry(entry.id);
      router.push('/');
    } catch (err) {
      setError('Failed to delete entry');
      console.error('Error deleting entry:', err);
    }
  };

  const handleCopySection = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      // You could show a toast notification here
      console.log('Copied to clipboard');
    }
  };

  const handleCopySectionFormatted = async (title: string, content: string | string[]) => {
    const success = await copySection(title, content);
    if (success) {
      console.log('Section copied to clipboard');
    }
  };

  const handleExportPDF = async () => {
    if (!entry) return;
    
    try {
      setIsExporting(true);
      await exportToPDF(entry);
      setShowExportMenu(false);
    } catch (err) {
      setError('Failed to export PDF');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!entry) return;
    
    try {
      setIsExporting(true);
      downloadMarkdown(entry);
      setShowExportMenu(false);
    } catch (err) {
      setError('Failed to export Markdown');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareSummary = async () => {
    if (!entry) return;
    
    const summary = generateSummary(entry);
    const success = await copyToClipboard(summary);
    if (success) {
      console.log('Summary copied for sharing');
    }
  };

  const updateEditedField = (field: keyof PodcastEntry, value: any) => {
    if (!editedEntry) return;
    
    setEditedEntry({
      ...editedEntry,
      [field]: value,
    });
  };

  const updateArrayField = (field: keyof PodcastEntry, text: string) => {
    const array = textToArray(text);
    updateEditedField(field, array);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !entry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message="Entry not found" />
      </div>
    );
  }

  const displayEntry = editedEntry || entry;
  const thumbnail = getYouTubeThumbnail(displayEntry.youtubeLink);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <button className="btn-ghost p-2">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Podcast Entry</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="btn-secondary flex items-center space-x-2"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Export</span>
                    </button>
                    
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <button
                          onClick={handleExportPDF}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Export as PDF</span>
                        </button>
                        <button
                          onClick={handleExportMarkdown}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Export as Markdown</span>
                        </button>
                        <button
                          onClick={handleShareSummary}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Copy Summary</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-ghost text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="btn-ghost"
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={() => setError(null)} />
          </div>
        )}

        <div className="space-y-6">
          {/* Title and Meta */}
          <div className="card p-6">
            <div className="space-y-4">
              {isEditing ? (
                <input
                  type="text"
                  value={displayEntry.title}
                  onChange={(e) => updateEditedField('title', e.target.value)}
                  className="input-field text-2xl font-bold"
                  placeholder="Entry title"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{displayEntry.title}</h1>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Speaker
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayEntry.speaker}
                      onChange={(e) => updateEditedField('speaker', e.target.value)}
                      className="input-field"
                      placeholder="Speaker name"
                    />
                  ) : (
                    <p className="text-gray-900">{displayEntry.speaker || 'Unknown speaker'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formatDateForInput(displayEntry.date)}
                      onChange={(e) => updateEditedField('date', new Date(e.target.value))}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{formatDate(displayEntry.date)}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ExternalLink className="w-4 h-4 inline mr-1" />
                  YouTube Link
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={displayEntry.youtubeLink}
                    onChange={(e) => updateEditedField('youtubeLink', e.target.value)}
                    className="input-field"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                ) : displayEntry.youtubeLink ? (
                  <div className="flex items-center space-x-3">
                    <a
                      href={displayEntry.youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt="YouTube thumbnail"
                        className="w-16 h-9 object-cover rounded"
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No YouTube link provided</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="card-premium">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏷️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Topic Tags</h3>
              </div>
              {isEditing && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-icon text-gray-500 hover:text-gray-700"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={editedEntry.tags?.join(', ') || ''}
                  onChange={(e) => setEditedEntry({
                    ...editedEntry,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  placeholder="Enter tags separated by commas (e.g., Marketing, Entrepreneurship, AI)"
                  className="textarea-field"
                  rows={2}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Tags
                  </button>
                  <button
                    onClick={() => setEditedEntry(entry)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {entry.tags && entry.tags.length > 0 ? (
                  entry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-full text-sm shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No tags assigned</p>
                )}
              </div>
            )}
          </div>

          {/* Main Content Sections */}
          <div className="space-y-4">
            {/* Main Idea */}
            <CollapsibleSection
              title="Main Idea"
              icon={<Target className="w-5 h-5 text-blue-500" />}
              defaultExpanded={true}
            >
              {isEditing ? (
                <textarea
                  value={displayEntry.mainIdea}
                  onChange={(e) => updateEditedField('mainIdea', e.target.value)}
                  className="textarea-field h-24"
                  placeholder="What is the core concept or main idea?"
                />
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-gray-900 flex-1">{displayEntry.mainIdea || 'No main idea provided'}</p>
                  <button
                    onClick={() => handleCopySection(displayEntry.mainIdea)}
                    className="btn-ghost p-2 ml-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* Key Takeaways */}
            <CollapsibleSection
              title="Key Takeaways"
              icon={<BookOpen className="w-5 h-5 text-green-500" />}
              count={displayEntry.keyTakeaways.length}
              defaultExpanded={true}
            >
              {isEditing ? (
                <textarea
                  value={arrayToText(displayEntry.keyTakeaways)}
                  onChange={(e) => updateArrayField('keyTakeaways', e.target.value)}
                  className="textarea-field h-32"
                  placeholder="• First takeaway&#10;• Second takeaway&#10;• Third takeaway"
                />
              ) : (
                <div className="space-y-2">
                  {displayEntry.keyTakeaways.length > 0 ? (
                    displayEntry.keyTakeaways.map((takeaway, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-900 flex-1">{takeaway}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No key takeaways provided</p>
                  )}
                  <button
                    onClick={() => handleCopySection(arrayToText(displayEntry.keyTakeaways))}
                    className="btn-ghost flex items-center space-x-2 mt-3"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy All</span>
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* Central Problem */}
            <CollapsibleSection
              title="Central Problem"
              icon={<Target className="w-5 h-5 text-red-500" />}
            >
              {isEditing ? (
                <textarea
                  value={displayEntry.centralProblem}
                  onChange={(e) => updateEditedField('centralProblem', e.target.value)}
                  className="textarea-field h-24"
                  placeholder="What is the main problem being discussed?"
                />
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-gray-900 flex-1">{displayEntry.centralProblem || 'No central problem provided'}</p>
                  <button
                    onClick={() => handleCopySection(displayEntry.centralProblem)}
                    className="btn-ghost p-2 ml-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* Generated Content Sections */}
            <CollapsibleSection
              title="Social Media Hooks"
              icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
              count={displayEntry.socialMediaHooks.length}
            >
              {isEditing ? (
                <textarea
                  value={arrayToText(displayEntry.socialMediaHooks)}
                  onChange={(e) => updateArrayField('socialMediaHooks', e.target.value)}
                  className="textarea-field h-32"
                  placeholder="• Hook 1&#10;• Hook 2&#10;• Hook 3"
                />
              ) : (
                <div className="space-y-3">
                  {displayEntry.socialMediaHooks.length > 0 ? (
                    displayEntry.socialMediaHooks.map((hook, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 font-medium">&ldquo;{hook}&rdquo;</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No social media hooks generated</p>
                  )}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Content Topics"
              icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
              count={displayEntry.contentTopics.length}
            >
              {isEditing ? (
                <textarea
                  value={arrayToText(displayEntry.contentTopics)}
                  onChange={(e) => updateArrayField('contentTopics', e.target.value)}
                  className="textarea-field h-24"
                  placeholder="• Topic 1&#10;• Topic 2"
                />
              ) : (
                <div className="space-y-2">
                  {displayEntry.contentTopics.length > 0 ? (
                    displayEntry.contentTopics.map((topic, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-purple-500 mt-1">•</span>
                        <span className="text-gray-900 flex-1">{topic}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No content topics generated</p>
                  )}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Monetization Ideas"
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
              count={displayEntry.monetizationIdeas.length}
            >
              {isEditing ? (
                <textarea
                  value={arrayToText(displayEntry.monetizationIdeas)}
                  onChange={(e) => updateArrayField('monetizationIdeas', e.target.value)}
                  className="textarea-field h-24"
                  placeholder="• Idea 1&#10;• Idea 2"
                />
              ) : (
                <div className="space-y-2">
                  {displayEntry.monetizationIdeas.length > 0 ? (
                    displayEntry.monetizationIdeas.map((idea, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span className="text-gray-900 flex-1">{idea}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No monetization ideas generated</p>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* Personal Notes */}
            <CollapsibleSection
              title="Personal Notes"
              icon={<StickyNote className="w-5 h-5 text-gray-500" />}
            >
              {isEditing ? (
                <textarea
                  value={displayEntry.notes}
                  onChange={(e) => updateEditedField('notes', e.target.value)}
                  className="textarea-field h-32"
                  placeholder="Add your personal notes and thoughts here..."
                />
              ) : (
                <div className="flex items-start justify-between">
                  <p className="text-gray-900 flex-1 whitespace-pre-wrap">
                    {displayEntry.notes || 'No personal notes added yet'}
                  </p>
                  <button
                    onClick={() => handleCopySection(displayEntry.notes)}
                    className="btn-ghost p-2 ml-2"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Entry?
            </h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The entry will be permanently deleted.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
