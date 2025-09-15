import { ObsessionsCompulsionsData } from '@/types/therapy';
import { parseObsessionsCompulsionsFromMarkdown } from './format-obsessions-compulsions';

export type ObsessionsExportFormat = 'pdf' | 'json' | 'markdown' | 'text';

export interface ObsessionsExportOptions {
  format: ObsessionsExportFormat;
  filename?: string;
}

/**
 * Export obsessions and compulsions data in various formats
 */
export class ObsessionsExportManager {
  private data: ObsessionsCompulsionsData;
  private content: string;

  constructor(data: ObsessionsCompulsionsData, content: string) {
    this.data = data;
    this.content = content;
  }

  /**
   * Export as PDF
   */
  async exportAsPDF(_options: ObsessionsExportOptions): Promise<void> {
    // For now, we'll use a simple text-based approach
    // In a real implementation, you might want to use a PDF library like jsPDF
    const textContent = this.exportAsText(_options);
    const blob = new Blob([textContent], { type: 'text/plain' });
    this.downloadBlob(blob, `${_options.filename || 'obsessions-compulsions'}.txt`);
  }

  /**
   * Export as JSON
   */
  async exportAsJSON(options: ObsessionsExportOptions): Promise<void> {
    const jsonContent = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    this.downloadBlob(blob, `${options.filename || 'obsessions-compulsions'}.json`);
  }

  /**
   * Export as Markdown
   */
  async exportAsMarkdown(options: ObsessionsExportOptions): Promise<void> {
    const blob = new Blob([this.content], { type: 'text/markdown' });
    this.downloadBlob(blob, `${options.filename || 'obsessions-compulsions'}.md`);
  }

  /**
   * Export as plain text
   */
  exportAsText(_options: ObsessionsExportOptions): string {
    let text = 'OBSESSIONS & COMPULSIONS TRACKER\n';
    text += '================================\n\n';

    if (this.data.obsessions.length > 0) {
      text += 'OBSESSIONS\n';
      text += '----------\n\n';
      
      this.data.obsessions.forEach((obsession, index) => {
        text += `${index + 1}. ${obsession.obsession}\n`;
        text += `   Intensity: ${obsession.intensity}/10\n`;
        if (obsession.triggers.length > 0) {
          text += `   Triggers: ${obsession.triggers.join(', ')}\n`;
        }
        text += `   Recorded: ${new Date(obsession.createdAt).toLocaleDateString()}\n\n`;
      });
    }

    if (this.data.compulsions.length > 0) {
      text += 'COMPULSIONS\n';
      text += '-----------\n\n';
      
      this.data.compulsions.forEach((compulsion, index) => {
        text += `${index + 1}. ${compulsion.compulsion}\n`;
        text += `   Frequency: ${compulsion.frequency}/10\n`;
        text += `   Duration: ${compulsion.duration} minutes\n`;
        text += `   Relief Level: ${compulsion.reliefLevel}/10\n`;
        text += `   Recorded: ${new Date(compulsion.createdAt).toLocaleDateString()}\n\n`;
      });
    }

    if (this.data.obsessions.length === 0 && this.data.compulsions.length === 0) {
      text += 'No obsessions or compulsions recorded.\n';
    }

    text += `\nLast updated: ${new Date(this.data.lastModified).toLocaleString()}\n`;

    return text;
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Create export manager from message content
 */
export function createObsessionsExportManager(content: string): ObsessionsExportManager | null {
  const data = parseObsessionsCompulsionsFromMarkdown(content);
  if (!data) return null;
  
  return new ObsessionsExportManager(data, content);
}

/**
 * Hook for obsessions export actions
 */
export function useObsessionsExportActions(
  data: ObsessionsCompulsionsData | null,
  content: string,
  options: {
    onSuccess?: (format: ObsessionsExportFormat) => void;
    onError?: (error: Error, format: ObsessionsExportFormat) => void;
  } = {}
) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportingFormat, setExportingFormat] = React.useState<ObsessionsExportFormat | null>(null);
  const [exportError, setExportError] = React.useState<Error | null>(null);

  const exportAsPDF = React.useCallback(async () => {
    if (!data) return;
    
    setIsExporting(true);
    setExportingFormat('pdf');
    setExportError(null);
    
    try {
      const manager = new ObsessionsExportManager(data, content);
      await manager.exportAsPDF({ format: 'pdf' });
      options.onSuccess?.('pdf');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed');
      setExportError(err);
      options.onError?.(err, 'pdf');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  }, [data, content, options]);

  const exportAsJSON = React.useCallback(async () => {
    if (!data) return;
    
    setIsExporting(true);
    setExportingFormat('json');
    setExportError(null);
    
    try {
      const manager = new ObsessionsExportManager(data, content);
      await manager.exportAsJSON({ format: 'json' });
      options.onSuccess?.('json');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed');
      setExportError(err);
      options.onError?.(err, 'json');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  }, [data, content, options]);

  const exportAsMarkdown = React.useCallback(async () => {
    if (!data) return;
    
    setIsExporting(true);
    setExportingFormat('markdown');
    setExportError(null);
    
    try {
      const manager = new ObsessionsExportManager(data, content);
      await manager.exportAsMarkdown({ format: 'markdown' });
      options.onSuccess?.('markdown');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed');
      setExportError(err);
      options.onError?.(err, 'markdown');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  }, [data, content, options]);

  const exportAsText = React.useCallback(async () => {
    if (!data) return;
    
    setIsExporting(true);
    setExportingFormat('text');
    setExportError(null);
    
    try {
      const manager = new ObsessionsExportManager(data, content);
      const textContent = manager.exportAsText({ format: 'text' });
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'obsessions-compulsions.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      options.onSuccess?.('text');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed');
      setExportError(err);
      options.onError?.(err, 'text');
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  }, [data, content, options]);

  const clearError = React.useCallback(() => {
    setExportError(null);
  }, []);

  return {
    exportAsPDF,
    exportAsJSON,
    exportAsMarkdown,
    exportAsText,
    isExporting,
    exportingFormat,
    exportError,
    clearError
  };
}

// Add React import for the hook
import React from 'react';
