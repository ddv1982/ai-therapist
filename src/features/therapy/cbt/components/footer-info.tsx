import React from 'react';

interface FooterInfoProps {
  isStreaming: boolean;
  isCBTActive: boolean;
  cbtCurrentStep: string;
  hasStarted: boolean;
}

export function FooterInfo({ isStreaming, isCBTActive, cbtCurrentStep, hasStarted }: FooterInfoProps) {
  return (
    <div className="border-t bg-card/50 backdrop-blur-md">
      <div className={"max-w-4xl mx-auto py-4 text-center px-4 sm:px-6"}>
        <div className="text-sm text-muted-foreground">
          {isStreaming ? (
            <span>🔄 Analyzing your CBT session and preparing for chat...</span>
          ) : isCBTActive && cbtCurrentStep !== 'complete' && cbtCurrentStep !== 'final-emotions' ? (
            <span>💙 Complete the {cbtCurrentStep.replace('-', ' ')} exercise above to continue your CBT journey</span>
          ) : isCBTActive && cbtCurrentStep === 'final-emotions' ? (
            <span>💙 Reflect on your emotions, then click &quot;Send to Chat&quot; for AI analysis</span>
          ) : hasStarted ? (
            <span>💙 Your progress is automatically saved in each step - no additional input needed</span>
          ) : (
            <span>💙 Start your CBT session to begin therapeutic exploration</span>
          )}
        </div>
      </div>
    </div>
  );
}
