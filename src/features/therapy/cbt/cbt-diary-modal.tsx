'use client';

// LEGACY MODAL - REPLACED BY CHAT-BASED CBT INTERFACE
// This modal is preserved for test compatibility but should not be used in production

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CBTDiaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToChat?: () => void;
}

export const CBTDiaryModal: React.FC<CBTDiaryModalProps> = ({
  open,
  onOpenChange,
  onSendToChat
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legacy CBT Modal</DialogTitle>
          <DialogDescription>
            This modal has been replaced by the new chat-based CBT interface.
            Please use the modern CBT diary page for the best experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">
            This legacy modal is preserved for test compatibility only.
            The new CBT experience is available through the chat-based interface with:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Unified state management with useUnifiedCBT hook</li>
            <li>Consistent step-by-step guidance with CBTStepWrapper</li>
            <li>Integrated TherapySlider components</li>
            <li>Real-time validation and progress tracking</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onSendToChat && (
            <Button onClick={onSendToChat}>
              Try New CBT Interface
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CBTDiaryModal;