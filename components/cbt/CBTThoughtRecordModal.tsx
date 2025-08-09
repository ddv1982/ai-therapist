'use client';

import React, { useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Minus, 
  Send, 
  RotateCcw,
  Brain
} from 'lucide-react';
import { useCBTThoughtRecord } from '@/hooks/use-cbt-thought-record';
import { CBTEmotion } from '@/types/cbt';
import { cn } from '@/lib/utils';
import { getCBTTokens } from '@/lib/design-system/message';

interface CBTThoughtRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToChat: (formattedContent: string) => void;
}

// Emotion intensity slider component (0-100 scale)
interface EmotionSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const EmotionSlider: React.FC<EmotionSliderProps> = ({ label, value, onChange, className }) => {
  const tokens = getCBTTokens();
  
  return (
    <div className={cn(tokens.slider.container, className)}>
      <div className={tokens.slider.label}>
        <label className={tokens.slider.labelText}>{label}</label>
        <span className={tokens.slider.value}>{value}/100</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={cn(tokens.slider.track, "slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer slider-track:bg-muted slider-track:rounded-lg")}
      />
      <div className={tokens.slider.scale}>
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
};

// Emotion entry component
interface EmotionEntryProps {
  emotion: CBTEmotion;
  index: number;
  onUpdate: (field: keyof CBTEmotion, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  isNewEmotion?: boolean;
}

const EmotionEntry: React.FC<EmotionEntryProps> = ({ 
  emotion, 
  onUpdate, 
  onRemove, 
  canRemove,
  isNewEmotion = false
}) => {
  const tokens = getCBTTokens();
  
  return (
    <div className="relative p-4 border border-border/30 rounded-lg bg-card/50 space-y-3">
      <div>
        <label className={tokens.input.label}>
          {isNewEmotion ? 'New Emotion Name' : 'Emotion Name'}
        </label>
        <Input
          placeholder="e.g., anxious, sad, angry, excited..."
          value={emotion.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="w-full bg-card border border-border/30 rounded-lg p-3 text-foreground"
        />
      </div>
      
      <EmotionSlider
        label={`Intensity (${isNewEmotion ? 'after reframing' : 'initial'})`}
        value={emotion.intensity}
        onChange={(value) => onUpdate('intensity', value)}
      />
      
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <Minus className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export const CBTThoughtRecordModal: React.FC<CBTThoughtRecordModalProps> = ({
  open,
  onOpenChange,
  onSendToChat
}) => {
  const tokens = getCBTTokens();
  const {
    formData,
    updateField,
    addEmotion,
    removeEmotion,
    updateEmotion,
    validateForm,
    resetForm,
    generateFormattedOutput,
    isDirty,
    isValid,
    errors,
    lastSaved
  } = useCBTThoughtRecord();

  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSendToChat = useCallback(() => {
    const errors = validateForm();
    if (errors.length === 0) {
      const formattedContent = generateFormattedOutput();
      onSendToChat(formattedContent);
      onOpenChange(false);
      resetForm();
    }
  }, [validateForm, generateFormattedOutput, onSendToChat, onOpenChange, resetForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className={tokens.modal.header}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pl-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">CBT Thought Record</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  7-column format for challenging unhelpful thoughts
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmReset(true)}
                disabled={!isDirty}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                ✕
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className={cn(tokens.modal.content, "space-y-8")}>
          {/* Date */}
          <div>
            <label className={tokens.input.label}>Date</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full bg-card border border-border/30 rounded-lg p-3 text-foreground hover:border-border/50 focus:border-primary/50 transition-colors duration-200"
            />
          </div>
          
          {/* Column 1: Situation */}
          <div>
            <h3 className={tokens.section.header}>
              1️⃣ Situation
            </h3>
            <p className={tokens.section.description}>
              When, where, who was involved? Be as specific as possible.
            </p>
            <Textarea
              placeholder="Describe the situation concretely... (e.g., &apos;Tuesday morning at 9am, I was in my office when my boss called me into a meeting...&apos;)"
              value={formData.situation}
              onChange={(e) => updateField('situation', e.target.value)}
              className={cn(tokens.input.field, "min-h-[120px]")}
              maxLength={1000}
            />
            {errors.situation && (
              <p className={tokens.input.error}>{errors.situation}</p>
            )}
            <p className={tokens.input.helper}>
              {formData.situation.length}/1000 characters
            </p>
          </div>

          {/* Column 2: Automatic Thoughts */}
          <div>
            <h3 className={tokens.section.header}>
              2️⃣ Automatic Thoughts
            </h3>
            <p className={tokens.section.description}>
              What thoughts immediately popped into your mind? What was your &quot;inner voice&quot; saying?
            </p>
            <Textarea
              placeholder="Write down the automatic thoughts that came up... (e.g., &quot;I&apos;m going to get fired&quot;, &quot;I always mess things up&quot;, &quot;They think I&apos;m incompetent&quot;)"
              value={formData.automaticThoughts}
              onChange={(e) => updateField('automaticThoughts', e.target.value)}
              className={cn(tokens.input.field, "min-h-[120px]")}
              maxLength={1000}
            />
            {errors.automaticThoughts && (
              <p className={tokens.input.error}>{errors.automaticThoughts}</p>
            )}
            <p className={tokens.input.helper}>
              {formData.automaticThoughts.length}/1000 characters
            </p>
          </div>

          {/* Column 3: Emotions & Intensity */}
          <div>
            <h3 className={tokens.section.header}>
              3️⃣ Emotions & Intensity (0-100)
            </h3>
            <p className={tokens.section.description}>
              What emotions did you feel? Rate the intensity from 0 (none) to 100 (overwhelming).
            </p>
            <div className="space-y-4">
              {formData.emotions.map((emotion, index) => (
                <EmotionEntry
                  key={index}
                  emotion={emotion}
                  index={index}
                  onUpdate={(field, value) => updateEmotion(index, field, value)}
                  onRemove={() => removeEmotion(index)}
                  canRemove={formData.emotions.length > 1}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addEmotion()}
                className="w-full h-12 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Emotion
              </Button>
            </div>
            {errors.emotions && (
              <p className={tokens.input.error}>{errors.emotions}</p>
            )}
          </div>

          {/* Column 4: Evidence For */}
          <div>
            <h3 className={tokens.section.header}>
              4️⃣ Evidence FOR the Thought
            </h3>
            <p className={tokens.section.description}>
              What evidence supports this thought being true? What facts back it up?
            </p>
            <Textarea
              placeholder="List evidence that supports your automatic thought... (e.g., 'I did make a mistake on the last project', 'My boss seemed frustrated in the email')"
              value={formData.evidenceFor}
              onChange={(e) => updateField('evidenceFor', e.target.value)}
              className={cn(tokens.input.field, "min-h-[120px]")}
              maxLength={1000}
            />
            {errors.evidenceFor && (
              <p className={tokens.input.error}>{errors.evidenceFor}</p>
            )}
            <p className={tokens.input.helper}>
              {formData.evidenceFor.length}/1000 characters
            </p>
          </div>

          {/* Column 5: Evidence Against */}
          <div>
            <h3 className={tokens.section.header}>
              5️⃣ Evidence AGAINST the Thought
            </h3>
            <p className={tokens.section.description}>
              What evidence contradicts this thought? What facts challenge it?
            </p>
            <Textarea
              placeholder="List evidence that contradicts your automatic thought... (e.g., 'I've received positive feedback recently', 'My boss asked for my input on important decisions', 'I successfully completed 3 other projects')"
              value={formData.evidenceAgainst}
              onChange={(e) => updateField('evidenceAgainst', e.target.value)}
              className={cn(tokens.input.field, "min-h-[120px]")}
              maxLength={1000}
            />
            {errors.evidenceAgainst && (
              <p className={tokens.input.error}>{errors.evidenceAgainst}</p>
            )}
            <p className={tokens.input.helper}>
              {formData.evidenceAgainst.length}/1000 characters
            </p>
          </div>

          {/* Column 6: Balanced Thought */}
          <div>
            <h3 className={tokens.section.header}>
              6️⃣ Balanced/Alternative Thought
            </h3>
            <p className={tokens.section.description}>
              Considering both sides, what&apos;s a more balanced way to think about this situation?
            </p>
            <Textarea
              placeholder="Create a more balanced thought that incorporates both the evidence for and against... (e.g., &apos;While I did make a mistake, I&apos;ve also had many successes. One mistake doesn&apos;t define my entire performance.&apos;)"
              value={formData.balancedThought}
              onChange={(e) => updateField('balancedThought', e.target.value)}
              className={cn(tokens.input.field, "min-h-[120px]")}
              maxLength={1000}
            />
            {errors.balancedThought && (
              <p className={tokens.input.error}>{errors.balancedThought}</p>
            )}
            <p className={tokens.input.helper}>
              {formData.balancedThought.length}/1000 characters
            </p>
          </div>

          {/* Column 7: New Emotions */}
          <div>
            <h3 className={tokens.section.header}>
              7️⃣ New Emotions (After Reframing)
            </h3>
            <p className={tokens.section.description}>
              How do you feel now after considering the balanced thought? Rate the new intensity.
            </p>
            <div className="space-y-4">
              {formData.newEmotions.map((emotion, index) => (
                <EmotionEntry
                  key={index}
                  emotion={emotion}
                  index={index}
                  onUpdate={(field, value) => updateEmotion(index, field, value, true)}
                  onRemove={() => removeEmotion(index, true)}
                  canRemove={formData.newEmotions.length > 1}
                  isNewEmotion={true}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addEmotion(true)}
                className="w-full h-12 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another New Emotion
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className={cn(tokens.modal.footer, "pb-6")}>
          <div className="flex items-center justify-end w-full pr-2">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendToChat}
                disabled={!isValid}
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Chat
              </Button>
            </div>
          </div>
        </DialogFooter>

        {/* Reset Confirmation Dialog */}
        {showConfirmReset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="bg-background p-6 rounded-lg border max-w-md">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Reset Thought Record?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will clear all your entries and start fresh. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    resetForm();
                    setShowConfirmReset(false);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CBTThoughtRecordModal;