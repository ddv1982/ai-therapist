'use client';

import React, { useState } from 'react';
import { 
  Download,
  FileText,
  FileJson,
  FileType,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { isCBTDiaryMessage, analyzeCBTMessage } from '@/lib/chat/cbt-message-detector';
import { logger } from '@/lib/utils/logger';
import { parseCBTFromMarkdown } from '@/lib/therapy/cbt-data-parser';
import { useCBTExportActions } from '@/hooks/therapy/use-cbt-export';
import { CBTExportFormat } from '@/lib/cbt/export-utils';

interface MessageActionsProps {
  messageId: string;
  messageContent: string;
  messageRole: 'user' | 'assistant' | 'system';
  timestamp: Date;
  className?: string;
}

export function MessageActions({
  messageId: _messageId,
  messageContent,
  messageRole,
  className
}: MessageActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastExportedFormat, setLastExportedFormat] = useState<CBTExportFormat | null>(null);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Only show actions for user messages that contain CBT content
  const isCBTMessage = messageRole === 'user' && isCBTDiaryMessage(messageContent, 0.6);
  
  // Parse CBT data for export (always call hooks to avoid conditional hook usage)
  const parsedData = parseCBTFromMarkdown(messageContent);
  
  const {
    exportAsPDF,
    exportAsJSON,
    exportAsMarkdown,
    exportAsText,
    isExporting,
    exportingFormat,
    exportError,
    clearError
  } = useCBTExportActions(parsedData.formData, messageContent, {
    onSuccess: (format: CBTExportFormat) => {
      setLastExportedFormat(format);
      setShowSuccessIcon(true);
      setShowDropdown(false);
      
      // Clear success icon after 2 seconds
      setTimeout(() => {
        setShowSuccessIcon(false);
        setLastExportedFormat(null);
      }, 2000);
    },
    onError: (error: Error, format: CBTExportFormat) => {
      logger.error('CBT export error', {
        component: 'MessageActions',
        operation: 'export',
        format,
        messageId: _messageId
      }, error);
      setShowDropdown(false);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        clearError();
      }, 3000);
    }
  });

  // Only render if this is a CBT message
  if (!isCBTMessage) {
    return null;
  }

  // Get appropriate icon based on state
  const getActionIcon = () => {
    if (isExporting) {
      return <Loader2 className="w-3 h-3 animate-spin" />;
    }
    if (showSuccessIcon) {
      return <CheckCircle className="w-3 h-3 text-green-600" />;
    }
    if (exportError) {
      return <AlertCircle className="w-3 h-3 text-red-600" />;
    }
    return <Download className="w-3 h-3" />;
  };

  const getTooltipText = () => {
    if (isExporting && exportingFormat) {
      return `Exporting ${exportingFormat.toUpperCase()}...`;
    }
    if (showSuccessIcon && lastExportedFormat) {
      return `${lastExportedFormat.toUpperCase()} exported successfully!`;
    }
    if (exportError) {
      return `Export failed: ${exportError}`;
    }
    return 'Export CBT diary entry';
  };

  // Analyze CBT content for confidence display
  const cbtAnalysis = analyzeCBTMessage(messageContent);
  const confidencePercentage = Math.round(cbtAnalysis.confidence * 100);

  const handleExport = (exportFunction: () => Promise<void>) => {
    exportFunction();
    setShowDropdown(false);
  };

  return (
    <div 
      className={cn(
        "absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
        {
          'opacity-100': isVisible || isExporting || showSuccessIcon || exportError || showDropdown
        },
        className
      )}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-200",
            {
              'text-green-600 border-green-200 hover:bg-green-50': showSuccessIcon,
              'text-red-600 border-red-200 hover:bg-red-50': exportError,
              'hover:bg-blue-50 border-blue-200': !showSuccessIcon && !exportError
            }
          )}
          title={getTooltipText()}
          disabled={isExporting}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {getActionIcon()}
        </Button>
        
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-background border rounded-md shadow-lg z-50">
            <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
              CBT Diary Entry ({confidencePercentage}% confidence)
              {parsedData.isComplete ? (
                <span className="text-green-600 ml-1">✓ Complete</span>
              ) : (
                <span className="text-yellow-600 ml-1">⚠ Partial</span>
              )}
            </div>
            
            <div className="p-1">
              <button
                onClick={() => handleExport(exportAsPDF)}
                disabled={isExporting}
                className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                <div className="flex flex-col items-start">
                  <span>Export as PDF</span>
                  <span className="text-sm text-muted-foreground">Professional report format</span>
                </div>
              </button>
              
              <button
                onClick={() => handleExport(exportAsMarkdown)}
                disabled={isExporting}
                className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileType className="w-4 h-4 mr-2 text-blue-600" />
                <div className="flex flex-col items-start">
                  <span>Export as Markdown</span>
                  <span className="text-sm text-muted-foreground">Formatted text document</span>
                </div>
              </button>
              
              <hr className="my-1" />
              
              <button
                onClick={() => handleExport(exportAsJSON)}
                disabled={isExporting}
                className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileJson className="w-4 h-4 mr-2 text-green-600" />
                <div className="flex flex-col items-start">
                  <span>Export as JSON</span>
                  <span className="text-sm text-muted-foreground">Structured data backup</span>
                </div>
              </button>
              
              <button
                onClick={() => handleExport(exportAsText)}
                disabled={isExporting}
                className="w-full flex items-center px-2 py-2 text-sm hover:bg-accent rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2 text-gray-600" />
                <div className="flex flex-col items-start">
                  <span>Export as Text</span>
                  <span className="text-sm text-muted-foreground">Plain text format</span>
                </div>
              </button>

              {parsedData.missingFields.length > 0 && (
                <>
                  <hr className="my-1" />
                  <div className="px-2 py-1.5 text-sm text-yellow-600">
                    <div className="font-semibold">Partial data detected:</div>
                    <div>Missing: {parsedData.missingFields.join(', ')}</div>
                  </div>
                </>
              )}
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
    </div>
  );
}
