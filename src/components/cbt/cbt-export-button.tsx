'use client';

import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileJson, 
  FileType,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import { cn } from '@/lib/utils/utils';
import { CBTDiaryFormData } from '@/types/therapy';
import { useCBTExportActions } from '@/hooks/therapy/use-cbt-export';
import { CBTExportFormat } from '@/lib/cbt/export-utils';

interface CBTExportButtonProps {
  formData: CBTDiaryFormData;
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
  showErrorToast
}: CBTExportButtonProps) {
  const [lastExportedFormat, setLastExportedFormat] = useState<CBTExportFormat | null>(null);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    exportAsPDF,
    exportAsJSON,
    exportAsMarkdown,
    exportAsText,
    isExporting,
    exportingFormat,
    exportError,
    clearError
  } = useCBTExportActions(formData, markdownContent, {
    onSuccess: (format: CBTExportFormat, _filename: string) => {
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
    }
  });

  const isDisabled = disabled || !isValid || isExporting;
  
  // Get appropriate icon based on state
  const getButtonIcon = () => {
    if (isExporting) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (showSuccessIcon) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (exportError) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <Download className="w-4 h-4" />;
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
    
    const hasEmotions = Object.entries(formData.initialEmotions).some(([key, value]) => {
      if (key === 'other' || key === 'otherIntensity') return false;
      return typeof value === 'number' && value > 0;
    }) || (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0);

    const hasThoughts = formData.automaticThoughts.some(t => t.thought.trim().length > 0);
    
    return hasEmotions || hasThoughts;
  };

  const getDisabledTooltip = () => {
    if (!hasMinimumContent()) {
      return "Add situation and emotions/thoughts to export";
    }
    if (!isValid) {
      return "Complete required fields to export";
    }
    if (disabled) {
      return "Export not available";
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
          "relative transition-all duration-200",
          {
            'text-green-600 border-green-200 hover:bg-green-50': showSuccessIcon,
            'text-red-600 border-red-200 hover:bg-red-50': exportError,
          },
          className
        )}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
        <ChevronDown className={cn("w-4 h-4 ml-1 transition-transform", showDropdown && "rotate-180")} />
      </Button>
      
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-background border rounded-md shadow-lg z-50">
          <div className="p-1">
            <button
              onClick={() => handleExport(exportAsPDF)}
              disabled={isDisabled}
              className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              <div className="flex flex-col items-start">
                <span>Export as PDF</span>
                <span className="text-xs text-muted-foreground">Professional report format</span>
              </div>
            </button>
            
            <button
              onClick={() => handleExport(exportAsMarkdown)}
              disabled={isDisabled}
              className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileType className="w-4 h-4 mr-2 text-blue-600" />
              <div className="flex flex-col items-start">
                <span>Export as Markdown</span>
                <span className="text-xs text-muted-foreground">Formatted text document</span>
              </div>
            </button>
            
            <hr className="my-1" />
            
            <button
              onClick={() => handleExport(exportAsJSON)}
              disabled={isDisabled}
              className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileJson className="w-4 h-4 mr-2 text-green-600" />
              <div className="flex flex-col items-start">
                <span>Export as JSON</span>
                <span className="text-xs text-muted-foreground">Structured data backup</span>
              </div>
            </button>
            
            <button
              onClick={() => handleExport(exportAsText)}
              disabled={isDisabled}
              className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              <div className="flex flex-col items-start">
                <span>Export as Text</span>
                <span className="text-xs text-muted-foreground">Plain text format</span>
              </div>
            </button>
          </div>
        </div>
      )}
      
      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}