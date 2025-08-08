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
  BookOpen, 
  Plus, 
  Minus, 
  Send, 
  RotateCcw,
  Heart,
  Brain,
  MessageCircle,
  CheckSquare,
  Lightbulb,
  Target
} from 'lucide-react';
import { useCBTForm } from '@/hooks/use-cbt-form';
import { CBTDiaryEmotions } from '@/types/cbt';
import { cn } from '@/lib/utils';

interface CBTDiaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToChat: (formattedContent: string) => void;
}

// Emotion Scale Component
interface EmotionScaleProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const EmotionScale: React.FC<EmotionScaleProps> = ({ label, value, onChange, className }) => (
  <div className={cn("space-y-2", className)}>
    <div className="flex justify-between items-center">
      <label className="text-therapy-sm font-medium text-foreground">{label}</label>
      <span className="text-therapy-sm text-muted-foreground font-mono">{value}/10</span>
    </div>
    <input
      type="range"
      min="0"
      max="10"
      step="1"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer slider-track:bg-muted slider-track:rounded-lg"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>0</span>
      <span>5</span>
      <span>10</span>
    </div>
  </div>
);

// Array Field Component for dynamic lists
interface ArrayFieldProps<T = unknown> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number, onChange: (index: number, field: string, value: unknown) => void) => React.ReactNode;
  addButtonText: string;
  emptyMessage: string;
  maxItems?: number;
}

const ArrayField = <T,>({ 
  items, 
  onAdd, 
  onRemove, 
  renderItem, 
  addButtonText, 
  emptyMessage,
  maxItems = 10 
}: ArrayFieldProps<T>) => {
  const handleItemChange = (_index: number, _field: string, _value: unknown) => {
    // This will be handled by the parent component through form state
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-therapy-sm text-muted-foreground text-center py-4 italic">
          {emptyMessage}
        </p>
      ) : (
        items.map((item, index) => (
          <div key={index} className="relative p-4 border border-border/30 rounded-lg bg-card/50">
            {renderItem(item, index, handleItemChange)}
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Minus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))
      )}
      
      {items.length < maxItems && (
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full h-12 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {addButtonText}
        </Button>
      )}
    </div>
  );
};

export const CBTDiaryModal: React.FC<CBTDiaryModalProps> = ({
  open,
  onOpenChange,
  onSendToChat
}) => {
  const {
    formData,
    updateField,
    updateNestedField,
    addAutomaticThought,
    removeAutomaticThought,
    addRationalThought,
    removeRationalThought,
    addAdditionalQuestion,
    removeAdditionalQuestion,
    addAlternativeResponse,
    removeAlternativeResponse,
    updateSchemaMode,
    validateForm,
    resetForm,
    generateFormattedOutput,
    isDirty,
    isValid,
    errors,
    lastSaved
  } = useCBTForm();

  const [activeSection, setActiveSection] = useState<string>('situation');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Section navigation
  const sections = [
    { id: 'situation', name: 'Situation', icon: MessageCircle },
    { id: 'emotions', name: 'Emotions', icon: Heart },
    { id: 'thoughts', name: 'Thoughts', icon: Brain },
    { id: 'schema', name: 'Schema', icon: Target },
    { id: 'challenge', name: 'Challenge', icon: Lightbulb },
    { id: 'results', name: 'Results', icon: CheckSquare }
  ];

  const handleSendToChat = useCallback(() => {
    const errors = validateForm();
    if (errors.length === 0) {
      const formattedContent = generateFormattedOutput();
      onSendToChat(formattedContent);
      onOpenChange(false);
      resetForm();
    }
  }, [validateForm, generateFormattedOutput, onSendToChat, onOpenChange, resetForm]);

  const handleEmotionChange = useCallback((emotionKey: keyof CBTDiaryEmotions, value: number) => {
    updateNestedField(`initialEmotions.${emotionKey}`, value);
  }, [updateNestedField]);

  const handleFinalEmotionChange = useCallback((emotionKey: keyof CBTDiaryEmotions, value: number) => {
    updateNestedField(`finalEmotions.${emotionKey}`, value);
  }, [updateNestedField]);

  const renderSituationSection = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-therapy-sm font-medium mb-2">
          Date
        </label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => updateField('date', e.target.value)}
          className="w-full"
        />
      </div>
      
      <div>
        <label className="block text-therapy-sm font-medium mb-2">
          Situation <span className="text-red-500">*</span>
        </label>
        <Textarea
          placeholder="Where am I? With whom? What is happening? Describe the specific context, location, people present, and circumstances..."
          value={formData.situation}
          onChange={(e) => updateField('situation', e.target.value)}
          className="w-full min-h-[120px] resize-none"
          maxLength={1000}
        />
        {errors.situation && (
          <p className="text-red-500 text-xs mt-1">{errors.situation}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formData.situation.length}/1000 characters
        </p>
      </div>
    </div>
  );

  const renderEmotionsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-therapy-base font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Initial Emotions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <EmotionScale
            label="Fear"
            value={formData.initialEmotions.fear}
            onChange={(value) => handleEmotionChange('fear', value)}
          />
          <EmotionScale
            label="Anger"
            value={formData.initialEmotions.anger}
            onChange={(value) => handleEmotionChange('anger', value)}
          />
          <EmotionScale
            label="Sadness"
            value={formData.initialEmotions.sadness}
            onChange={(value) => handleEmotionChange('sadness', value)}
          />
          <EmotionScale
            label="Joy"
            value={formData.initialEmotions.joy}
            onChange={(value) => handleEmotionChange('joy', value)}
          />
          <EmotionScale
            label="Anxiety"
            value={formData.initialEmotions.anxiety}
            onChange={(value) => handleEmotionChange('anxiety', value)}
          />
          <EmotionScale
            label="Shame"
            value={formData.initialEmotions.shame}
            onChange={(value) => handleEmotionChange('shame', value)}
          />
          <EmotionScale
            label="Guilt"
            value={formData.initialEmotions.guilt}
            onChange={(value) => handleEmotionChange('guilt', value)}
          />
        </div>
        
        <div className="mt-6 p-4 border border-border/30 rounded-lg bg-muted/20">
          <h4 className="text-therapy-sm font-medium mb-3">Other Emotion</h4>
          <div className="space-y-3">
            <Input
              placeholder="Name of emotion (e.g., jealousy, excitement)"
              value={formData.initialEmotions.other || ''}
              onChange={(e) => updateNestedField('initialEmotions.other', e.target.value)}
            />
            {formData.initialEmotions.other && (
              <EmotionScale
                label={formData.initialEmotions.other}
                value={formData.initialEmotions.otherIntensity || 0}
                onChange={(value) => handleEmotionChange('otherIntensity', value)}
              />
            )}
          </div>
        </div>

        {errors.initialEmotions && (
          <p className="text-red-500 text-xs mt-2">{errors.initialEmotions}</p>
        )}
      </div>
    </div>
  );

  const renderThoughtsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-therapy-base font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Automatic Thoughts
        </h3>
        <ArrayField
          items={formData.automaticThoughts}
          onAdd={addAutomaticThought}
          onRemove={removeAutomaticThought}
          addButtonText="Add Another Thought"
          emptyMessage="No automatic thoughts recorded yet"
          renderItem={(thought, index) => (
            <div className="space-y-3">
              <div>
                <label className="block text-therapy-sm font-medium mb-2">
                  Automatic Thought {index + 1}
                </label>
                <Textarea
                  placeholder="What thoughts immediately came to mind? What was I telling myself?"
                  value={thought.thought}
                  onChange={(e) => {
                    const newThoughts = [...formData.automaticThoughts];
                    newThoughts[index] = { ...newThoughts[index], thought: e.target.value };
                    updateField('automaticThoughts', newThoughts);
                  }}
                  className="w-full min-h-[80px] resize-none"
                />
              </div>
              <EmotionScale
                label="How much do you believe this thought? (Credibility)"
                value={thought.credibility}
                onChange={(value) => {
                  const newThoughts = [...formData.automaticThoughts];
                  newThoughts[index] = { ...newThoughts[index], credibility: value };
                  updateField('automaticThoughts', newThoughts);
                }}
              />
            </div>
          )}
        />
        {errors.automaticThoughts && (
          <p className="text-red-500 text-xs mt-2">{errors.automaticThoughts}</p>
        )}
      </div>
    </div>
  );

  const renderSchemaSection = () => (
    <div className="space-y-6">
      {/* Core Belief */}
      <div>
        <h3 className="text-therapy-base font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Core Belief
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-therapy-sm font-medium mb-2">
              Core Belief <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="What deeper belief about myself, others, or the world does this connect to?"
              value={formData.coreBeliefText}
              onChange={(e) => updateField('coreBeliefText', e.target.value)}
              className="w-full min-h-[80px] resize-none"
            />
            {errors.coreBeliefText && (
              <p className="text-red-500 text-xs mt-1">{errors.coreBeliefText}</p>
            )}
          </div>
          <EmotionScale
            label="How much do you believe this core belief? (Credibility)"
            value={formData.coreBeliefCredibility}
            onChange={(value) => updateField('coreBeliefCredibility', value)}
          />
        </div>
      </div>

      {/* Schema Behaviors */}
      <div>
        <h3 className="text-therapy-base font-semibold mb-4">Schema-Behaviors</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-therapy-sm font-medium mb-2">
              Confirming Behaviors
            </label>
            <Textarea
              placeholder="Actions that reinforce the belief"
              value={formData.confirmingBehaviors}
              onChange={(e) => updateField('confirmingBehaviors', e.target.value)}
              className="w-full min-h-[60px] resize-none"
            />
          </div>
          <div>
            <label className="block text-therapy-sm font-medium mb-2">
              Avoidant Behaviors
            </label>
            <Textarea
              placeholder="Actions to escape or avoid the situation"
              value={formData.avoidantBehaviors}
              onChange={(e) => updateField('avoidantBehaviors', e.target.value)}
              className="w-full min-h-[60px] resize-none"
            />
          </div>
          <div>
            <label className="block text-therapy-sm font-medium mb-2">
              Overriding Behaviors
            </label>
            <Textarea
              placeholder="Compensatory actions to counteract the belief"
              value={formData.overridingBehaviors}
              onChange={(e) => updateField('overridingBehaviors', e.target.value)}
              className="w-full min-h-[60px] resize-none"
            />
          </div>
        </div>
      </div>

      {/* Schema Modes */}
      <div>
        <h3 className="text-therapy-base font-semibold mb-4">Schema-Modes</h3>
        <p className="text-therapy-sm text-muted-foreground mb-4">
          Which emotional states were you experiencing?
        </p>
        <div className="space-y-3">
          {formData.schemaModes.map((mode) => (
            <label key={mode.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={mode.selected}
                onChange={(e) => updateSchemaMode(mode.id, e.target.checked)}
                className="w-4 h-4 mt-1 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
              />
              <div className="flex-1">
                <div className="font-medium text-therapy-sm">{mode.name}</div>
                <div className="text-xs text-muted-foreground italic">{mode.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChallengeSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-therapy-base font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Challenge Questions
        </h3>
        <div className="space-y-4">
          {formData.challengeQuestions.map((question, index) => (
            <div key={index} className="p-4 border border-border/30 rounded-lg bg-card/50">
              <div className="font-medium text-therapy-sm mb-2 text-primary">
                {question.question}
              </div>
              <Textarea
                placeholder="Explore your thoughts and feelings about this question..."
                value={question.answer}
                onChange={(e) => {
                  const newQuestions = [...formData.challengeQuestions];
                  newQuestions[index] = { ...newQuestions[index], answer: e.target.value };
                  updateField('challengeQuestions', newQuestions);
                }}
                className="w-full min-h-[80px] resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-therapy-base font-semibold mb-4">Additional Questions</h3>
        <ArrayField
          items={formData.additionalQuestions}
          onAdd={addAdditionalQuestion}
          onRemove={removeAdditionalQuestion}
          addButtonText="Add Custom Question"
          emptyMessage="No additional questions added"
          renderItem={(question, index) => (
            <div className="space-y-3">
              <div>
                <label className="block text-therapy-sm font-medium mb-2">
                  Question
                </label>
                <Input
                  placeholder="Enter your question"
                  value={question.question}
                  onChange={(e) => {
                    const newQuestions = [...formData.additionalQuestions];
                    newQuestions[index] = { ...newQuestions[index], question: e.target.value };
                    updateField('additionalQuestions', newQuestions);
                  }}
                />
              </div>
              <div>
                <label className="block text-therapy-sm font-medium mb-2">
                  Answer
                </label>
                <Textarea
                  placeholder="Explore your thoughts about this question..."
                  value={question.answer}
                  onChange={(e) => {
                    const newQuestions = [...formData.additionalQuestions];
                    newQuestions[index] = { ...newQuestions[index], answer: e.target.value };
                    updateField('additionalQuestions', newQuestions);
                  }}
                  className="w-full min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}
        />
      </div>

      <div>
        <h3 className="text-therapy-base font-semibold mb-4">Rational Thoughts</h3>
        <ArrayField
          items={formData.rationalThoughts}
          onAdd={addRationalThought}
          onRemove={removeRationalThought}
          addButtonText="Add Rational Thought"
          emptyMessage="No rational thoughts developed yet"
          renderItem={(thought, index) => (
            <div className="space-y-3">
              <div>
                <label className="block text-therapy-sm font-medium mb-2">
                  Balanced Perspective {index + 1}
                </label>
                <Textarea
                  placeholder="What would be a more balanced way to think about this?"
                  value={thought.thought}
                  onChange={(e) => {
                    const newThoughts = [...formData.rationalThoughts];
                    newThoughts[index] = { ...newThoughts[index], thought: e.target.value };
                    updateField('rationalThoughts', newThoughts);
                  }}
                  className="w-full min-h-[80px] resize-none"
                />
              </div>
              <EmotionScale
                label="How confident are you in this rational thought?"
                value={thought.confidence}
                onChange={(value) => {
                  const newThoughts = [...formData.rationalThoughts];
                  newThoughts[index] = { ...newThoughts[index], confidence: value };
                  updateField('rationalThoughts', newThoughts);
                }}
              />
            </div>
          )}
        />
      </div>
    </div>
  );

  const renderResultsSection = () => (
    <div className="space-y-6">
      {/* Final Emotions */}
      <div>
        <h3 className="text-therapy-base font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-accent" />
          Effect on Feelings
        </h3>
        <p className="text-therapy-sm text-muted-foreground mb-4">
          How do you feel after completing this reflection?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <EmotionScale
            label="Fear"
            value={formData.finalEmotions.fear}
            onChange={(value) => handleFinalEmotionChange('fear', value)}
          />
          <EmotionScale
            label="Anger"
            value={formData.finalEmotions.anger}
            onChange={(value) => handleFinalEmotionChange('anger', value)}
          />
          <EmotionScale
            label="Sadness"
            value={formData.finalEmotions.sadness}
            onChange={(value) => handleFinalEmotionChange('sadness', value)}
          />
          <EmotionScale
            label="Joy"
            value={formData.finalEmotions.joy}
            onChange={(value) => handleFinalEmotionChange('joy', value)}
          />
          <EmotionScale
            label="Anxiety"
            value={formData.finalEmotions.anxiety}
            onChange={(value) => handleFinalEmotionChange('anxiety', value)}
          />
          <EmotionScale
            label="Shame"
            value={formData.finalEmotions.shame}
            onChange={(value) => handleFinalEmotionChange('shame', value)}
          />
          <EmotionScale
            label="Guilt"
            value={formData.finalEmotions.guilt}
            onChange={(value) => handleFinalEmotionChange('guilt', value)}
          />
        </div>
        
        {formData.initialEmotions.other && (
          <div className="mt-4">
            <EmotionScale
              label={formData.initialEmotions.other}
              value={formData.finalEmotions.otherIntensity || 0}
              onChange={(value) => handleFinalEmotionChange('otherIntensity', value)}
            />
          </div>
        )}

        <div className="mt-6">
          <EmotionScale
            label="Credibility of Original Automatic Thoughts"
            value={formData.originalThoughtCredibility}
            onChange={(value) => updateField('originalThoughtCredibility', value)}
          />
        </div>
      </div>

      {/* New Behaviors */}
      <div>
        <h3 className="text-therapy-base font-semibold mb-4">New Behaviors</h3>
        <div>
          <label className="block text-therapy-sm font-medium mb-2">
            What will you do differently next time this situation arises?
          </label>
          <Textarea
            placeholder="Describe new behaviors or responses you want to try..."
            value={formData.newBehaviors}
            onChange={(e) => updateField('newBehaviors', e.target.value)}
            className="w-full min-h-[100px] resize-none"
          />
        </div>
      </div>

      {/* Alternative Responses */}
      <div>
        <h3 className="text-therapy-base font-semibold mb-4">Alternative Responses</h3>
        <ArrayField
          items={formData.alternativeResponses}
          onAdd={addAlternativeResponse}
          onRemove={removeAlternativeResponse}
          addButtonText="Add Alternative Response"
          emptyMessage="No alternative responses identified"
          renderItem={(response, index) => (
            <div>
              <label className="block text-therapy-sm font-medium mb-2">
                Alternative Response {index + 1}
              </label>
              <Textarea
                placeholder="Describe an alternative way to respond in future situations..."
                value={response.response}
                onChange={(e) => {
                  const newResponses = [...formData.alternativeResponses];
                  newResponses[index] = { ...newResponses[index], response: e.target.value };
                  updateField('alternativeResponses', newResponses);
                }}
                className="w-full min-h-[80px] resize-none"
              />
            </div>
          )}
        />
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'situation': return renderSituationSection();
      case 'emotions': return renderEmotionsSection();
      case 'thoughts': return renderThoughtsSection();
      case 'schema': return renderSchemaSection();
      case 'challenge': return renderChallengeSection();
      case 'results': return renderResultsSection();
      default: return renderSituationSection();
    }
  };

  const currentSectionIndex = sections.findIndex(s => s.id === activeSection);
  const canGoNext = currentSectionIndex < sections.length - 1;
  const canGoPrev = currentSectionIndex > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-therapy-lg">CBT Diary Entry</DialogTitle>
                <DialogDescription>
                  Structured reflection for cognitive behavioral therapy
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
                className="h-8 px-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Section Navigation */}
        <div className="px-6 py-3 border-b border-border/20 bg-muted/20 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              const hasError = Object.keys(errors).some(key => 
                (section.id === 'situation' && (key === 'situation')) ||
                (section.id === 'emotions' && key === 'initialEmotions') ||
                (section.id === 'thoughts' && key === 'automaticThoughts') ||
                (section.id === 'schema' && key === 'coreBeliefText')
              );

              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2 h-8 px-3 text-xs",
                    hasError && "border-red-300 text-red-600"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {section.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderCurrentSection()}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setActiveSection(sections[currentSectionIndex - 1]?.id)}
                disabled={!canGoPrev}
                className="h-9"
              >
                ← Previous
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {currentSectionIndex + 1} of {sections.length}
              </span>
              <Button
                variant="ghost"
                onClick={() => setActiveSection(sections[currentSectionIndex + 1]?.id)}
                disabled={!canGoNext}
                className="h-9"
              >
                Next →
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendToChat}
                disabled={!isValid}
                className="h-9 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
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
              <h3 className="text-therapy-lg font-semibold mb-2">Reset CBT Diary?</h3>
              <p className="text-therapy-sm text-muted-foreground mb-4">
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
                    setActiveSection('situation');
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