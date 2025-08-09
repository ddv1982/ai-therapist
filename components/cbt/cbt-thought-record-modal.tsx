'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Minus, 
  Brain
} from 'lucide-react';
import { BaseCBTModal, EmotionSlider } from './base-cbt-modal';
import { useCBTThoughtRecord } from '@/hooks/use-cbt-thought-record';
import { CBTEmotion } from '@/types/cbt';
import { cn } from '@/lib/utils';
import { getCBTTokens } from '@/lib/design-system/message';

interface CBTThoughtRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToChat: (formattedContent: string) => void;
}

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
    <BaseCBTModal
      open={open}
      onOpenChange={onOpenChange}
      onSendToChat={onSendToChat}
      title="CBT Thought Record"
      description="7-column format for challenging unhelpful thoughts"
      icon={<Brain className="w-5 h-5 text-white" />}
      isValid={isValid}
      isDirty={isDirty}
      lastSaved={lastSaved}
      onReset={resetForm}
      onSubmit={handleSendToChat}
    >
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
          placeholder="Describe the situation concretely... (e.g., 'Tuesday morning at 9am, I was in my office when my boss called me into a meeting...')"
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
          What thoughts immediately popped into your mind? What was your &ldquo;inner voice&rdquo; saying?
        </p>
        <Textarea
          placeholder="Write down the automatic thoughts that came up... (e.g., 'I'm going to get fired', 'I always mess things up', 'They think I'm incompetent')"
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
          placeholder="Create a more balanced thought that incorporates both the evidence for and against... (e.g., 'While I did make a mistake, I've also had many successes. One mistake doesn't define my entire performance.')"
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
    </BaseCBTModal>
  );
};

export default CBTThoughtRecordModal;