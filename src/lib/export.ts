import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PodcastEntry, ExportOptions } from '@/types';
import { formatDate, arrayToText } from './utils';

// Export entry as PDF
export const exportToPDF = async (entry: PodcastEntry, options: ExportOptions = { format: 'pdf' }): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 6;
    let yPosition = margin;

    // Helper function to add text with wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      
      // Check if we need a new page
      if (yPosition + lines.length * lineHeight > pdf.internal.pageSize.height - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * lineHeight + 2;
    };

    const addSection = (title: string, content: string | string[], addSpace: boolean = true) => {
      if (!content || (Array.isArray(content) && content.length === 0)) return;
      
      if (addSpace) yPosition += 4;
      
      // Section title
      addText(title, 12, true);
      
      // Section content
      if (Array.isArray(content)) {
        content.forEach(item => {
          addText(`• ${item}`, 10);
        });
      } else {
        addText(content, 10);
      }
    };

    // Header
    addText('PODCAST REFINERY', 18, true);
    yPosition += 5;
    
    // Title
    addText(entry.title, 16, true);
    
    // Meta information
    addText(`Speaker: ${entry.speaker || 'Unknown'}`, 10);
    addText(`Date: ${formatDate(entry.date)}`, 10);
    
    if (entry.youtubeLink) {
      addText(`YouTube: ${entry.youtubeLink}`, 10);
    }
    
    yPosition += 10;

    // Main sections
    addSection('MAIN IDEA', entry.mainIdea);
    addSection('KEY TAKEAWAYS', entry.keyTakeaways);
    addSection('CENTRAL PROBLEM', entry.centralProblem);
    addSection('STRENGTHS', entry.strengths);
    addSection('WEAKNESSES', entry.weaknesses);
    addSection('COUNTERARGUMENTS', entry.counterarguments);
    addSection('PRACTICAL LESSONS', entry.practicalLessons);
    addSection('TWO-MINUTE VERSION', entry.twoMinuteVersion);
    addSection('ACTION CHECKLIST', entry.actionChecklist);
    
    // Generated content
    yPosition += 10;
    addText('GENERATED CONTENT', 14, true);
    
    addSection('SOCIAL MEDIA HOOKS', entry.socialMediaHooks, false);
    addSection('CONTENT TOPICS', entry.contentTopics);
    addSection('MONETIZATION IDEAS', entry.monetizationIdeas);
    
    // Personal notes
    if (entry.notes) {
      yPosition += 10;
      addSection('PERSONAL NOTES', entry.notes, false);
    }

    // Save the PDF
    const fileName = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF');
  }
};

// Export entry as Markdown
export const exportToMarkdown = (entry: PodcastEntry): string => {
  const sections = [];
  
  // Header
  sections.push(`# ${entry.title}\n`);
  
  // Meta information
  sections.push('## Information');
  sections.push(`**Speaker:** ${entry.speaker || 'Unknown'}`);
  sections.push(`**Date:** ${formatDate(entry.date)}`);
  if (entry.youtubeLink) {
    sections.push(`**YouTube:** [Watch Video](${entry.youtubeLink})`);
  }
  sections.push('');

  // Helper function to add array content
  const addArraySection = (title: string, content: string[]) => {
    if (content.length === 0) return;
    
    sections.push(`## ${title}`);
    content.forEach(item => {
      sections.push(`- ${item}`);
    });
    sections.push('');
  };

  // Helper function to add text content
  const addTextSection = (title: string, content: string) => {
    if (!content) return;
    
    sections.push(`## ${title}`);
    sections.push(content);
    sections.push('');
  };

  // Main sections
  addTextSection('Main Idea', entry.mainIdea);
  addArraySection('Key Takeaways', entry.keyTakeaways);
  addTextSection('Central Problem', entry.centralProblem);
  addArraySection('Strengths', entry.strengths);
  addArraySection('Weaknesses', entry.weaknesses);
  addArraySection('Counterarguments', entry.counterarguments);
  addArraySection('Practical Lessons', entry.practicalLessons);
  addArraySection('Two-Minute Version', entry.twoMinuteVersion);
  addArraySection('Action Checklist', entry.actionChecklist);
  
  // Generated content
  if (entry.socialMediaHooks.length > 0 || entry.contentTopics.length > 0 || entry.monetizationIdeas.length > 0) {
    sections.push('---');
    sections.push('');
    sections.push('# Generated Content');
    sections.push('');
    
    addArraySection('Social Media Hooks', entry.socialMediaHooks);
    addArraySection('Content Topics', entry.contentTopics);
    addArraySection('Monetization Ideas', entry.monetizationIdeas);
  }
  
  // Personal notes
  if (entry.notes) {
    sections.push('---');
    sections.push('');
    addTextSection('Personal Notes', entry.notes);
  }

  return sections.join('\n');
};

// Download markdown file
export const downloadMarkdown = (entry: PodcastEntry): void => {
  try {
    const markdown = exportToMarkdown(entry);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading markdown:', error);
    throw new Error('Failed to download markdown');
  }
};

// Copy section content with proper formatting
export const copySection = async (title: string, content: string | string[]): Promise<boolean> => {
  try {
    let textToCopy = `${title.toUpperCase()}\n`;
    textToCopy += '='.repeat(title.length) + '\n\n';
    
    if (Array.isArray(content)) {
      content.forEach(item => {
        textToCopy += `• ${item}\n`;
      });
    } else {
      textToCopy += content;
    }
    
    await navigator.clipboard.writeText(textToCopy);
    return true;
  } catch (error) {
    console.error('Error copying section:', error);
    return false;
  }
};

// Export specific sections only
export const exportSections = (entry: PodcastEntry, sections: (keyof PodcastEntry)[]): string => {
  const exportData: any = {};
  
  sections.forEach(section => {
    if (entry[section] !== undefined) {
      exportData[section] = entry[section];
    }
  });
  
  return exportToMarkdown({ 
    ...entry, 
    ...exportData 
  } as PodcastEntry);
};

// Generate summary for social sharing
export const generateSummary = (entry: PodcastEntry, maxLength: number = 280): string => {
  let summary = `📝 ${entry.title}`;
  
  if (entry.speaker) {
    summary += ` by ${entry.speaker}`;
  }
  
  if (entry.mainIdea && summary.length + entry.mainIdea.length + 10 < maxLength) {
    summary += `\n\n💡 ${entry.mainIdea}`;
  }
  
  if (entry.socialMediaHooks.length > 0 && summary.length < maxLength - 50) {
    const hook = entry.socialMediaHooks[0];
    if (summary.length + hook.length + 10 < maxLength) {
      summary += `\n\n🔥 "${hook}"`;
    }
  }
  
  if (entry.youtubeLink && summary.length < maxLength - 30) {
    summary += `\n\n🎥 ${entry.youtubeLink}`;
  }
  
  return summary.substring(0, maxLength);
};
