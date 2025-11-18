'use client';

import { useState } from 'react';
import {
  Download,
  FileText,
  FileJson,
  FileType,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CBTFormData } from '@/types';
import { useCBTExportActions } from '@/hooks/therapy/use-cbt-export';
import { CBTExportFormat } from '@/lib/cbt/export-utils';

interface CBTExportButtonProps {
  formData: CBTFormData;
  markdownContent?: string;
  isValid?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showSuccessToast?: (message: string) => void;
  showErrorToast?: (message: string) => void;
}

export function CBTExportButton({
  formData,
  markdownContent,
  isValid = true,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className,
  showSuccessToast,
  showErrorToast,
}: CBTExportButtonProps) {
  const [lastExportedFormat, setLastExportedFormat] = useState<CBTExportFormat | null>(null);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    exportAsJSON,
    exportAsMarkdown,
    exportAsText,
    isExporting,
    exportingFormat,
    exportError,
    clearError,
  } = useCBTExportActions(formData, markdownContent, {
    onSuccess: (format: CBTExportFormat) => {
      setLastExportedFormat(format);
      setShowSuccessIcon(true);
      setShowDropdown(false);

      // Clear success icon after 3 seconds
      setTimeout(() => {
        setShowSuccessIcon(false);
        setLastExportedFormat(null);
      }, 3000);

      // Show success toast if callback provided
      if (showSuccessToast) {
        const formatName = format.toUpperCase();
        showSuccessToast(`CBT diary exported as ${formatName} successfully!`);
      }
    },
    onError: (error: Error, format: CBTExportFormat) => {
      setShowDropdown(false);

      // Show error toast if callback provided
      if (showErrorToast) {
        showErrorToast(`Failed to export as ${format.toUpperCase()}: ${error.message}`);
      }

      // Clear error after 5 seconds
      setTimeout(() => {
        clearError();
      }, 5000);
    },
  });

  const isDisabled = disabled || !isValid || isExporting;

  // Get appropriate icon based on state
  const getButtonIcon = () => {
    if (isExporting) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (showSuccessIcon) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (exportError) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return <Download className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isExporting && exportingFormat) {
      return `Exporting ${exportingFormat.toUpperCase()}...`;
    }
    if (showSuccessIcon && lastExportedFormat) {
      return `${lastExportedFormat.toUpperCase()} Exported!`;
    }
    return 'Export';
  };

  // Helper to check if form has minimum content for export
  const hasMinimumContent = () => {
    if (!formData.situation.trim()) return false;

    const hasEmotions =
      Object.entries(formData.initialEmotions).some(([key, value]) => {
        if (key === 'other' || key === 'otherIntensity') return false;
        return typeof value === 'number' && value > 0;
      }) ||
      (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0);

    const hasThoughts = formData.automaticThoughts.some((t) => t.thought.trim().length > 0);

    return hasEmotions || hasThoughts;
  };

  const getDisabledTooltip = () => {
    if (!hasMinimumContent()) {
      return 'Add situation and emotions/thoughts to export';
    }
    if (!isValid) {
      return 'Complete required fields to export';
    }
    if (disabled) {
      return 'Export not available';
    }
    return undefined;
  };

  const handleExport = (exportFunction: () => Promise<void>) => {
    exportFunction();
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={size}
        disabled={isDisabled}
        title={getDisabledTooltip()}
        className={cn(
          'relative transition-all duration-200',
          {
            'border-green-200 text-green-600 hover:bg-green-50': showSuccessIcon,
            'border-red-200 text-red-600 hover:bg-red-50': exportError,
          },
          className
        )}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
        <ChevronDown
          className={cn('ml-1 h-4 w-4 transition-transform', showDropdown && 'rotate-180')}
        />
      </Button>

      {showDropdown && (
        <div className="bg-background absolute top-full right-0 z-50 mt-1 w-56 rounded-md border shadow-lg">
          <div className="p-1">
            <button
              onClick={() => handleExport(exportAsMarkdown)}
              disabled={isDisabled}
              className="hover:bg-accent flex w-full items-center rounded-sm px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileType className="mr-2 h-4 w-4 text-blue-600" />
              <div className="flex flex-col items-start">
                <span>Export as Markdown</span>
                <span className="text-muted-foreground text-sm">Formatted text document</span>
              </div>
            </button>

            <hr className="my-1" />

            <button
              onClick={() => handleExport(exportAsJSON)}
              disabled={isDisabled}
              className="hover:bg-accent flex w-full items-center rounded-sm px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileJson className="mr-2 h-4 w-4 text-green-600" />
              <div className="flex flex-col items-start">
                <span>Export as JSON</span>
                <span className="text-muted-foreground text-sm">Structured data backup</span>
              </div>
            </button>

            <button
              onClick={() => handleExport(exportAsText)}
              disabled={isDisabled}
              className="hover:bg-accent flex w-full items-center rounded-sm px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="mr-2 h-4 w-4 text-gray-600" />
              <div className="flex flex-col items-start">
                <span>Export as Text</span>
                <span className="text-muted-foreground text-sm">Plain text format</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
