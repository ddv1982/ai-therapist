import { useState, useCallback } from 'react';
import { CBTFormData } from '@/types/therapy';
import { 
  exportCBTDiary, 
  CBTExportFormat,
  generateFileName
} from '@/lib/cbt/export-utils';

interface UseCBTExportOptions {
  onSuccess?: (format: CBTExportFormat, filename: string) => void;
  onError?: (error: Error, format: CBTExportFormat) => void;
}

interface UseCBTExportReturn {
  isExporting: boolean;
  exportingFormat: CBTExportFormat | null;
  exportError: string | null;
  exportDiary: (format: CBTExportFormat, formData: CBTFormData, markdownContent?: string) => Promise<void>;
  clearError: () => void;
}

export function useCBTExport(options: UseCBTExportOptions = {}): UseCBTExportReturn {
  const { onSuccess, onError } = options;
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<CBTExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportDiary = useCallback(async (
    format: CBTExportFormat,
    formData: CBTFormData,
    markdownContent?: string
  ): Promise<void> => {
    setIsExporting(true);
    setExportingFormat(format);
    setExportError(null);

    try {
      // Validate form data has minimum required content
      if (!formData.situation.trim()) {
        throw new Error('Cannot export empty diary entry. Please add a situation description.');
      }

      // Check for at least one emotion or thought
      const hasEmotions = Object.entries(formData.initialEmotions).some(([key, value]) => {
        if (key === 'other' || key === 'otherIntensity') return false;
        return typeof value === 'number' && value > 0;
      }) || (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0);

      const hasThoughts = formData.automaticThoughts.some(t => t.thought.trim().length > 0);

      if (!hasEmotions && !hasThoughts) {
        throw new Error('Cannot export incomplete diary entry. Please add emotions or thoughts.');
      }

      // Add a small delay for better UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));

      // Perform the export
      await exportCBTDiary(format, formData, markdownContent);

      // Generate filename for success callback
      const filename = generateFileName(format, formData.date);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(format, filename);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error occurred';
      setExportError(errorMessage);
      
      // Call error callback if provided
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage), format);
      }
      
      throw error; // Re-throw so the UI can handle it if needed
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  }, [onSuccess, onError]);

  const clearError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    isExporting,
    exportingFormat,
    exportError,
    exportDiary,
    clearError
  };
}

// Helper hook for format-specific exports
export function useCBTExportActions(
  formData: CBTFormData,
  markdownContent?: string,
  options?: UseCBTExportOptions
) {
  const { exportDiary, isExporting, exportingFormat, exportError, clearError } = useCBTExport(options);

  const exportAsJSON = useCallback(() => exportDiary('json', formData, markdownContent), [exportDiary, formData, markdownContent]);
  const exportAsMarkdown = useCallback(() => exportDiary('markdown', formData, markdownContent), [exportDiary, formData, markdownContent]);
  const exportAsText = useCallback(() => exportDiary('text', formData, markdownContent), [exportDiary, formData, markdownContent]);

  return {
    exportAsJSON,
    exportAsMarkdown,
    exportAsText,
    isExporting,
    exportingFormat,
    exportError,
    clearError
  };
}