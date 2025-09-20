'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Upload, Wand2, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { parseNotebookLMText, generateContentIdeas, generateTitle, generateTopicTags } from '@/lib/api';
import { createPodcastEntry } from '@/lib/firestore';
import { PodcastEntry, ParsedNotebookLMData, GeneratedContent } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function NewEntryPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'processing' | 'preview'>('input');
  const [parsedData, setParsedData] = useState<ParsedNotebookLMData | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editableData, setEditableData] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);

  const handleProcess = async () => {
    if (!rawText.trim()) {
      setError('Please paste some text to process');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setStep('processing');

      // Step 1: Parse the NotebookLM text
      const parsed = await parseNotebookLMText(rawText);
      setParsedData(parsed);

      // Step 2: Generate title if missing
      let finalTitle = parsed.title;
      if (!finalTitle && parsed.mainIdea) {
        finalTitle = await generateTitle(parsed.mainIdea, parsed.speaker);
      }

      // Step 3: Generate content ideas
      let generated: GeneratedContent = {
        socialMediaHooks: [],
        contentTopics: [],
        monetizationIdeas: []
      };

      if (parsed.mainIdea || parsed.keyTakeaways?.length || parsed.centralProblem) {
        generated = await generateContentIdeas(
          parsed.mainIdea || '',
          parsed.keyTakeaways || [],
          parsed.centralProblem || ''
        );
      }

      // Step 4: Generate semantic topic tags
      let tags: string[] = [];
      if (finalTitle || parsed.mainIdea || parsed.keyTakeaways?.length) {
        tags = await generateTopicTags(
          finalTitle || '',
          parsed.mainIdea || '',
          parsed.keyTakeaways || [],
          parsed.centralProblem || '',
          parsed.speaker
        );
      }

      setGeneratedContent(generated);
      setGeneratedTags(tags);
      const finalData = { ...parsed, title: finalTitle };
      setParsedData(finalData);
      setEditableData(finalData);
      setStep('preview');
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process text');
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!editableData) return;

    try {
      setIsProcessing(true);
      setError(null);

      const entry: Omit<PodcastEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        title: editableData.title || 'Untitled Podcast',
        youtubeLink: editableData.youtubeLink || '',
        date: new Date(),
        speaker: editableData.speaker || '',
        mainIdea: editableData.mainIdea || '',
        keyTakeaways: editableData.keyTakeaways || [],
        centralProblem: editableData.centralProblem || '',
        strengths: editableData.strengths || [],
        weaknesses: editableData.weaknesses || [],
        counterarguments: editableData.counterarguments || [],
        practicalLessons: editableData.practicalLessons || [],
        twoMinuteVersion: editableData.twoMinuteVersion || [],
        actionChecklist: editableData.actionChecklist || [],
        socialMediaHooks: generatedContent?.socialMediaHooks || [],
        contentTopics: generatedContent?.contentTopics || [],
        monetizationIdeas: generatedContent?.monetizationIdeas || [],
        tags: generatedTags,
        notes: notes,
      };

      const entryId = await createPodcastEntry(entry);
      router.push(`/entry/${entryId}`);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setRawText('');
    setParsedData(null);
    setGeneratedContent(null);
    setEditableData(null);
    setNotes('');
    setStep('input');
    setError(null);
  };

  const updateEditableField = (field: string, value: any) => {
    setEditableData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Collapsible Section Component
  const CollapsibleSection = ({ 
    title, 
    sectionKey, 
    children, 
    defaultExpanded = true 
  }: { 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode; 
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = collapsedSections[sectionKey] !== undefined 
      ? !collapsedSections[sectionKey] 
      : defaultExpanded;

    return (
      <div className="card-collapsible">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="card-header w-full"
        >
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {isExpanded ? (
            <ChevronDown className="w-6 h-6 text-gray-600" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-600" />
          )}
        </button>
        
        {isExpanded && (
          <div className="card-content">
            {children}
          </div>
        )}
      </div>
    );
  };

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
              <h1 className="text-xl font-semibold text-gray-900">New Podcast Entry</h1>
            </div>
            
            {step === 'preview' && (
              <button
                onClick={handleStartOver}
                className="btn-secondary"
                disabled={isProcessing}
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={() => setError(null)} />
          </div>
        )}

        {step === 'input' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Paste Your NotebookLM Summary
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Paste the structured answers from NotebookLM and we&rsquo;ll automatically extract everything into organized fields, then generate social media hooks and content ideas.
              </p>
            </div>

            <div className="card p-6">
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your NotebookLM summary here...

Example:
Main Idea: The core concept discussed in the podcast
Key Takeaways:
• First key takeaway
• Second key takeaway
Strengths:
• First strength mentioned
• Second strength mentioned
..."
                className="textarea-field h-80 text-sm"
                disabled={isProcessing}
              />
              
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {rawText.length} characters
                </div>
                
                <button
                  onClick={handleProcess}
                  disabled={!rawText.trim() || isProcessing}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>Process Entry</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Your Entry
            </h2>
            <p className="text-gray-600 mb-8">
              We&rsquo;re parsing your text and generating content ideas...
            </p>
            <LoadingSpinner size="lg" />
          </div>
        )}

        {step === 'preview' && editableData && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Entry Processed Successfully!
              </h2>
              <p className="text-gray-600 text-lg">
                Review the structured data below. Only Title and YouTube Link are editable.
              </p>
            </div>

            {/* Editable Fields Section */}
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Title - Editable */}
              <div className="card-premium">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Title</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Editable</span>
                </div>
                <textarea
                  value={editableData.title || ''}
                  onChange={(e) => updateEditableField('title', e.target.value)}
                  className="w-full text-2xl font-bold text-gray-900 border-none bg-transparent focus:outline-none focus:ring-0 p-0 resize-none placeholder-gray-400"
                  placeholder="Enter podcast title..."
                  rows={2}
                />
              </div>

              {/* YouTube Link - Editable */}
              <div className="card-premium">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm font-bold">▶</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">YouTube Link</h3>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Editable</span>
                </div>
                <input
                  type="url"
                  value={editableData.youtubeLink || ''}
                  onChange={(e) => updateEditableField('youtubeLink', e.target.value)}
                  className="w-full px-6 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-base bg-white/80 backdrop-blur-sm placeholder-gray-400"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              {/* Speaker - Display Only */}
              <div className="card-premium">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👤</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Speaker</h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Read Only</span>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed font-medium">
                  {editableData.speaker || 'Unknown Speaker'}
                </p>
              </div>
            </div>

            {/* Generated Tags Section */}
            {generatedTags.length > 0 && (
              <div className="max-w-4xl mx-auto">
                <div className="card-premium">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🏷️</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Topic Tags</h3>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">AI Generated</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-full text-sm shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    These semantic tags help categorize and search your podcast content by topic.
                  </p>
                </div>
              </div>
            )}

            {/* Content Sections - Collapsible & Locked */}
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Main Idea */}
              <CollapsibleSection title="Main Idea" sectionKey="mainIdea" defaultExpanded={true}>
                <p className="text-base text-gray-700 leading-relaxed">
                  {editableData.mainIdea || 'No main idea provided'}
                </p>
              </CollapsibleSection>

              {/* Key Takeaways */}
              {editableData.keyTakeaways && editableData.keyTakeaways.length > 0 && (
                <CollapsibleSection 
                  title={`Key Takeaways (${editableData.keyTakeaways.length})`} 
                  sectionKey="keyTakeaways" 
                  defaultExpanded={true}
                >
                  <ul className="space-y-3">
                    {editableData.keyTakeaways.map((takeaway: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                        <span className="text-base text-gray-700 leading-relaxed flex-1">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Central Problem */}
              {editableData.centralProblem && (
                <CollapsibleSection title="Central Problem" sectionKey="centralProblem">
                  <p className="text-base text-gray-700 leading-relaxed">
                    {editableData.centralProblem}
                  </p>
                </CollapsibleSection>
              )}

              {/* Strengths */}
              {editableData.strengths && editableData.strengths.length > 0 && (
                <CollapsibleSection 
                  title={`Strengths (${editableData.strengths.length})`} 
                  sectionKey="strengths"
                >
                  <ul className="space-y-3">
                    {editableData.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-3 flex-shrink-0"></div>
                        <span className="text-base text-gray-700 leading-relaxed flex-1">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Weaknesses */}
              {editableData.weaknesses && editableData.weaknesses.length > 0 && (
                <CollapsibleSection 
                  title={`Weaknesses (${editableData.weaknesses.length})`} 
                  sectionKey="weaknesses"
                >
                  <ul className="space-y-3">
                    {editableData.weaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                        <span className="text-base text-gray-700 leading-relaxed flex-1">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Counterarguments */}
              {editableData.counterarguments && editableData.counterarguments.length > 0 && (
                <CollapsibleSection 
                  title={`Counterarguments (${editableData.counterarguments.length})`} 
                  sectionKey="counterarguments"
                >
                  <ul className="space-y-3">
                    {editableData.counterarguments.map((arg: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-3 flex-shrink-0"></div>
                        <span className="text-base text-gray-700 leading-relaxed flex-1">{arg}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Practical Lessons */}
              {editableData.practicalLessons && editableData.practicalLessons.length > 0 && (
                <CollapsibleSection 
                  title={`Practical Lessons (${editableData.practicalLessons.length})`} 
                  sectionKey="practicalLessons"
                >
                  <ul className="space-y-3">
                    {editableData.practicalLessons.map((lesson: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
                        <span className="text-base text-gray-700 leading-relaxed flex-1">{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Two-Minute Version */}
              {editableData.twoMinuteVersion && editableData.twoMinuteVersion.length > 0 && (
                <CollapsibleSection 
                  title={`Two-Minute Version (${editableData.twoMinuteVersion.length})`} 
                  sectionKey="twoMinuteVersion"
                >
                  <ul className="space-y-3">
                    {editableData.twoMinuteVersion.map((point: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-3 flex-shrink-0"></div>
                        <span className="text-base text-gray-700 leading-relaxed flex-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Action Checklist */}
              {editableData.actionChecklist && editableData.actionChecklist.length > 0 && (
                <CollapsibleSection 
                  title={`Action Checklist (${editableData.actionChecklist.length})`} 
                  sectionKey="actionChecklist"
                >
                  <ul className="space-y-3">
                    {editableData.actionChecklist.map((action: string, index: number) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-5 h-5 bg-green-600 rounded-md flex items-center justify-center mt-1 flex-shrink-0">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <span className="text-base text-gray-700 leading-relaxed flex-1">{action}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
            </div>

            {/* AI-Generated Content */}
            {generatedContent && (generatedContent.socialMediaHooks.length > 0 || generatedContent.contentTopics.length > 0 || generatedContent.monetizationIdeas.length > 0) && (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    AI-Generated Content
                  </h2>
                  <p className="text-gray-600">
                    Ready-to-use content for your marketing and monetization
                  </p>
                </div>

                {/* Social Media Hooks */}
                {generatedContent.socialMediaHooks.length > 0 && (
                  <CollapsibleSection 
                    title={`Social Media Hooks (${generatedContent.socialMediaHooks.length})`} 
                    sectionKey="socialMediaHooks"
                    defaultExpanded={true}
                  >
                    <div className="space-y-4">
                      {generatedContent.socialMediaHooks.map((hook, index) => (
                      <div key={index} className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border border-yellow-200/50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-sm font-bold">🔥</span>
                          </div>
                          <p className="text-yellow-900 font-semibold text-lg leading-relaxed flex-1">
                            &ldquo;{hook}&rdquo;
                          </p>
                        </div>
                      </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Content Topics */}
                {generatedContent.contentTopics.length > 0 && (
                  <CollapsibleSection 
                    title={`Content Topic Ideas (${generatedContent.contentTopics.length})`} 
                    sectionKey="contentTopics"
                  >
                    <ul className="space-y-3">
                      {generatedContent.contentTopics.map((topic, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                            <span className="text-white text-sm">💡</span>
                          </div>
                          <span className="text-base text-gray-700 leading-relaxed flex-1 font-medium">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                )}

                {/* Monetization Ideas */}
                {generatedContent.monetizationIdeas.length > 0 && (
                  <CollapsibleSection 
                    title={`Monetization Ideas (${generatedContent.monetizationIdeas.length})`} 
                    sectionKey="monetizationIdeas"
                  >
                    <ul className="space-y-3">
                      {generatedContent.monetizationIdeas.map((idea, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center mt-1 flex-shrink-0">
                            <span className="text-white text-sm">💰</span>
                          </div>
                          <span className="text-base text-gray-700 leading-relaxed flex-1 font-medium">{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                )}
              </div>
            )}

            {/* Personal Notes - Special Section */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-3xl shadow-xl border-2 border-yellow-200/50 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-lg font-bold">📝</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Personal Notes</h3>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Your Space</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-6 py-4 border border-yellow-200/50 rounded-2xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all duration-300 bg-white/90 backdrop-blur-sm text-base leading-relaxed resize-none shadow-inner placeholder-gray-400"
                  placeholder="Add your personal thoughts, insights, or additional notes here..."
                  rows={6}
                />
                <div className="flex items-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <p className="text-sm text-yellow-700 font-medium">
                    This is your personal writing area - add thoughts, insights, or follow-up ideas.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center pt-8 pb-12">
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-12 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 text-lg"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Saving Entry...</span>
                  </>
                ) : (
                  <span>Save Entry</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
