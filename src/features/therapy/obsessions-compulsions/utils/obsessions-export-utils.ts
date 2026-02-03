import { useState, useCallback } from 'react';
import { ObsessionsCompulsionsData } from '@/types';

export type ObsessionsExportFormat = 'json' | 'markdown' | 'text';

interface ObsessionsExportOptions {
  format: ObsessionsExportFormat;
  filename?: string;
}

/**
 * Export obsessions and compulsions data in various formats
 */
class ObsessionsExportManager {
  private data: ObsessionsCompulsionsData;
  private content: string;

  constructor(data: ObsessionsCompulsionsData, content: string) {
    this.data = data;
    this.content = content;
  }

  // PDF export removed

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
   * Export as plain text file
   */
  exportAsTextFile(options: ObsessionsExportOptions): void {
    const textContent = this.exportAsText(options);
    const blob = new Blob([textContent], { type: 'text/plain' });
    this.downloadBlob(blob, `${options.filename || 'obsessions-compulsions'}.txt`);
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ObsessionsExportFormat | null>(null);
  const [exportError, setExportError] = useState<Error | null>(null);

  // PDF export removed

  const exportAsJSON = useCallback(async () => {
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

  const exportAsMarkdown = useCallback(async () => {
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

  const exportAsText = useCallback(async () => {
    if (!data) return;

    setIsExporting(true);
    setExportingFormat('text');
    setExportError(null);

    try {
      const manager = new ObsessionsExportManager(data, content);
      manager.exportAsTextFile({ format: 'text' });
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

  const clearError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    exportAsJSON,
    exportAsMarkdown,
    exportAsText,
    isExporting,
    exportingFormat,
    exportError,
    clearError,
  };
}
