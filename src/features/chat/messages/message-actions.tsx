'use client';

import { useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  Download,
  FileText,
  FileJson,
  FileType,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isCBTDiaryMessage, analyzeCBTMessage } from '@/features/chat/lib/cbt-message-detector';
import { logger } from '@/lib/utils/logger';
import { parseCBTFromMarkdown } from '@/features/therapy/lib/parsers';
import { useCBTExportActions } from '@/hooks/therapy/use-cbt-export';
import { CBTExportFormat } from '@/lib/cbt/export-utils';
import { isObsessionsCompulsionsMessage } from '@/features/therapy/obsessions-compulsions/utils/obsessions-message-detector';
import { parseObsessionsCompulsionsFromMarkdown } from '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions';
import {
  useObsessionsExportActions,
  ObsessionsExportFormat,
} from '@/features/therapy/obsessions-compulsions/utils/obsessions-export-utils';
import { createInitialCBTFormData } from '@/types';

interface MessageActionsProps {
  messageId: string;
  messageContent: string;
  messageRole: 'user' | 'assistant' | 'system';
  timestamp: Date;
  className?: string;
}

const MessageActionsComponent = function MessageActions({
  messageId: _messageId,
  messageContent,
  messageRole,
  className,
}: MessageActionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastExportedFormat, setLastExportedFormat] = useState<
    CBTExportFormat | ObsessionsExportFormat | null
  >(null);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for CBT or obsessions content
  const isCBTMessage = messageRole === 'user' && isCBTDiaryMessage(messageContent, 0.6);
  const isObsessionsMessage =
    messageRole === 'user' && isObsessionsCompulsionsMessage(messageContent);
  const shouldShowActions = isCBTMessage || isObsessionsMessage;

  const emptyCBTForm = useMemo(() => createInitialCBTFormData(), []);
  const parsedCBTData = useMemo(
    () => (isCBTMessage ? parseCBTFromMarkdown(messageContent) : null),
    [isCBTMessage, messageContent]
  );
  const parsedObsessionsData = useMemo(
    () => (isObsessionsMessage ? parseObsessionsCompulsionsFromMarkdown(messageContent) : null),
    [isObsessionsMessage, messageContent]
  );

  const {
    exportAsJSON: cbtExportAsJSON,
    exportAsMarkdown: cbtExportAsMarkdown,
    exportAsText: cbtExportAsText,
    isExporting: cbtIsExporting,
    exportingFormat: cbtExportingFormat,
    exportError: cbtExportError,
    clearError: cbtClearError,
  } = useCBTExportActions(
    parsedCBTData?.formData ?? emptyCBTForm,
    isCBTMessage ? messageContent : undefined,
    {
      onSuccess: (format: CBTExportFormat) => {
        setLastExportedFormat(format);
        setShowSuccessIcon(true);
        setShowDropdown(false);
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => {
          setShowSuccessIcon(false);
          setLastExportedFormat(null);
        }, 2000);
      },
      onError: (error: Error, format: CBTExportFormat) => {
        logger.error(
          'CBT export error',
          {
            component: 'MessageActions',
            operation: 'export',
            format,
            messageId: _messageId,
          },
          error
        );
        setShowDropdown(false);
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
          cbtClearError();
        }, 3000);
      },
    }
  );

  const {
    exportAsJSON: obsessionsExportAsJSON,
    exportAsMarkdown: obsessionsExportAsMarkdown,
    exportAsText: obsessionsExportAsText,
    isExporting: obsessionsIsExporting,
    exportingFormat: obsessionsExportingFormat,
    exportError: obsessionsExportError,
    clearError: obsessionsClearError,
  } = useObsessionsExportActions(parsedObsessionsData, messageContent, {
    onSuccess: (format: ObsessionsExportFormat) => {
      setLastExportedFormat(format);
      setShowSuccessIcon(true);
      setShowDropdown(false);
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccessIcon(false);
        setLastExportedFormat(null);
      }, 2000);
    },
    onError: (error: Error, format: ObsessionsExportFormat) => {
      logger.error(
        'Obsessions export error',
        {
          component: 'MessageActions',
          operation: 'export',
          format,
          messageId: _messageId,
        },
        error
      );
      setShowDropdown(false);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        obsessionsClearError();
      }, 3000);
    },
  });

  // Use the appropriate export functions based on message type
  const exportAsJSON = isCBTMessage ? cbtExportAsJSON : obsessionsExportAsJSON;
  const exportAsMarkdown = isCBTMessage ? cbtExportAsMarkdown : obsessionsExportAsMarkdown;
  const exportAsText = isCBTMessage ? cbtExportAsText : obsessionsExportAsText;
  const isExporting = isCBTMessage ? cbtIsExporting : obsessionsIsExporting;
  const exportingFormat = isCBTMessage ? cbtExportingFormat : obsessionsExportingFormat;
  const exportError = isCBTMessage ? cbtExportError : obsessionsExportError;

  // Analyze CBT content for confidence display
  const cbtAnalysis = useMemo(
    () => (isCBTMessage ? analyzeCBTMessage(messageContent) : null),
    [isCBTMessage, messageContent]
  );
  const confidencePercentage = cbtAnalysis ? Math.round(cbtAnalysis.confidence * 100) : null;

  const handleExport = (exportFunction: () => Promise<void>) => {
    void exportFunction();
    setShowDropdown(false);
  };

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Only render if this is a CBT or obsessions message
  if (!shouldShowActions) {
    return null;
  }

  // Get appropriate icon based on state
  const getActionIcon = () => {
    if (isExporting) {
      return <Loader2 className="h-3 w-3 animate-spin" />;
    }
    if (showSuccessIcon) {
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    }
    if (exportError) {
      return <AlertCircle className="h-3 w-3 text-red-600" />;
    }
    return <Download className="h-3 w-3" />;
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

  return (
    <div
      className={cn(
        'absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100',
        {
          'opacity-100': isVisible || isExporting || showSuccessIcon || exportError || showDropdown,
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
            'bg-background/80 h-8 w-8 border p-0 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md',
            {
              'border-green-200 text-green-600 hover:bg-green-50': showSuccessIcon,
              'border-red-200 text-red-600 hover:bg-red-50': exportError,
              'border-blue-200 hover:bg-blue-50': !showSuccessIcon && !exportError,
            }
          )}
          title={getTooltipText()}
          disabled={isExporting}
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          {getActionIcon()}
        </Button>

        {showDropdown && (
          <div className="bg-background absolute top-full right-0 z-50 mt-1 w-56 rounded-md border shadow-lg">
            <div className="text-muted-foreground border-b px-2 py-1.5 text-sm">
              {isObsessionsMessage ? 'Obsessions & Compulsions Tracker' : 'CBT Diary Entry'}
              {isCBTMessage && confidencePercentage !== null
                ? ` (${confidencePercentage}% confidence)`
                : ''}
              {isCBTMessage && parsedCBTData?.isComplete ? (
                <span className="ml-1 text-green-600">✓ Complete</span>
              ) : isCBTMessage ? (
                <span className="ml-1 text-yellow-600">⚠ Partial</span>
              ) : null}
            </div>
            <div className="p-1">
              <button
                onClick={() => handleExport(exportAsMarkdown)}
                disabled={isExporting}
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
                disabled={isExporting}
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
                disabled={isExporting}
                className="hover:bg-accent flex w-full items-center rounded-sm px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText className="mr-2 h-4 w-4 text-gray-600" />
                <div className="flex flex-col items-start">
                  <span>Export as Text</span>
                  <span className="text-muted-foreground text-sm">Plain text format</span>
                </div>
              </button>

              {isCBTMessage && parsedCBTData && parsedCBTData.missingFields.length > 0 && (
                <>
                  <hr className="my-1" />
                  <div className="px-2 py-1.5 text-sm text-yellow-600">
                    <div className="font-semibold">Partial data detected:</div>
                    <div>Missing: {parsedCBTData.missingFields.join(', ')}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showDropdown && (
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
        )}
      </div>
    </div>
  );
};

// Memoized export - only re-render when message content/role changes
export const MessageActions = memo(MessageActionsComponent, (prevProps, nextProps) => {
  return (
    prevProps.messageId === nextProps.messageId &&
    prevProps.messageContent === nextProps.messageContent &&
    prevProps.messageRole === nextProps.messageRole &&
    prevProps.className === nextProps.className
  );
});
