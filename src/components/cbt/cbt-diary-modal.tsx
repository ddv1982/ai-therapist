'use client';

import React, { useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Textarea } from '@/components/ui/primitives/textarea';
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
  Target,
  Eye
} from 'lucide-react';
import { CBTExportButton } from './cbt-export-button';
import { useCBTForm } from '@/hooks/use-cbt-form';
import { NumericEmotionKeys } from '@/types/therapy';
import { cn } from '@/lib/utils/utils';
import { getCBTTokens } from '@/lib/design-system/message';

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

const EmotionScale: React.FC<EmotionScaleProps> = ({ label, value, onChange, className }) => {
  const tokens = getCBTTokens();
  
  return (
    <div className={cn(tokens.slider.container, className)}>
      <div className={tokens.slider.label}>
        <label className={tokens.slider.labelText}>{label}</label>
        <span className={tokens.slider.value}>{value}/10</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={cn(
          tokens.slider.track,
          "slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer slider-track:bg-muted slider-track:rounded-lg"
        )}
      />
      <div className={tokens.slider.scale}>
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
};

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
  const tokens = getCBTTokens();
  
  const handleItemChange = (_index: number, _field: string, _value: unknown) => {
    // This will be handled by the parent component through form state
  };

  return (
    <div className={tokens.arrayField.container}>
      {items.length === 0 ? (
        <p className={tokens.arrayField.empty}>
          {emptyMessage}
        </p>
      ) : (
        items.map((item, index) => (
          <div key={index} className={tokens.arrayField.item}>
            {renderItem(item, index, handleItemChange)}
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className={tokens.arrayField.removeButton}
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
          className={tokens.arrayField.addButton}
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
  const tokens = getCBTTokens();
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
    toggleSchemaReflection,
    updateSchemaReflectionQuestion,
    addSchemaReflectionQuestion,
    removeSchemaReflectionQuestion,
    updateSchemaReflectionAssessment,
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

  // Guard against uninitialized schema reflection data
  const schemaReflection = formData.schemaReflection || {
    enabled: false,
    questions: [],
    selfAssessment: ''
  };

  // Section navigation
  const sections = [
    { id: 'situation', name: 'Situation', icon: MessageCircle, required: true },
    { id: 'emotions', name: 'Emotions', icon: Heart, required: true },
    { id: 'thoughts', name: 'Thoughts', icon: Brain, required: true },
    { id: 'schema', name: 'Schema', icon: Target, required: true },
    { id: 'challenge', name: 'Challenge', icon: Lightbulb, required: true },
    { id: 'reflection', name: 'Reflection', icon: Eye, required: false },
    { id: 'results', name: 'Results', icon: CheckSquare, required: false }
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

  const handleEmotionChange = useCallback((emotionKey: NumericEmotionKeys, value: number) => {
    updateNestedField(`initialEmotions.${emotionKey}`, value);
  }, [updateNestedField]);

  const handleFinalEmotionChange = useCallback((emotionKey: NumericEmotionKeys, value: number) => {
    updateNestedField(`finalEmotions.${emotionKey}`, value);
  }, [updateNestedField]);

  // Handle special emotion fields like otherIntensity separately
  const handleOtherIntensityChange = useCallback((field: 'initialEmotions' | 'finalEmotions', value: number) => {
    updateNestedField(`${field}.otherIntensity`, value);
  }, [updateNestedField]);

  const renderSituationSection = () => (
    <div className={tokens.section.container}>
      <div>
        <label className={tokens.input.label}>
          Date
        </label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => updateField('date', e.target.value)}
          className="w-full bg-card border border-border/30 rounded-lg p-3 text-foreground hover:border-border/50 focus:border-primary/50 transition-colors duration-200"
        />
      </div>
      
      <div>
        <label className={tokens.input.label}>
          Situation <span className={tokens.input.required}>*</span>
        </label>
        <Textarea
          placeholder="Where am I? With whom? What is happening? Describe the specific context, location, people present, and circumstances..."
          value={formData.situation}
          onChange={(e) => updateField('situation', e.target.value)}
          className={cn(tokens.input.field, "min-h-[380px]")}
          maxLength={1000}
        />
        {errors.situation && (
          <p className={tokens.input.error}>{errors.situation}</p>
        )}
        <p className={tokens.input.helper}>
          {formData.situation.length}/1000 characters
        </p>
      </div>
    </div>
  );

  const renderEmotionsSection = () => (
    <div className={tokens.section.container}>
      <div>
        <h3 className={tokens.section.header}>
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
        
        <div className="mt-6 p-4 border border-border/30 rounded-lg bg-card/50">
          <h4 className={tokens.section.subHeader}>Other Emotion</h4>
          <div className="space-y-3">
            <Input
              placeholder="Name of emotion (e.g., jealousy, excitement)"
              value={formData.initialEmotions.other || ''}
              onChange={(e) => updateNestedField('initialEmotions.other', e.target.value)}
              className="w-full bg-card border border-border/30 rounded-lg p-3 text-foreground"
            />
            {formData.initialEmotions.other && (
              <EmotionScale
                label={formData.initialEmotions.other}
                value={formData.initialEmotions.otherIntensity || 0}
                onChange={(value) => handleOtherIntensityChange('initialEmotions', value)}
              />
            )}
          </div>
        </div>

        {errors.initialEmotions && (
          <p className={tokens.input.error}>{errors.initialEmotions}</p>
        )}
      </div>
    </div>
  );

  const renderThoughtsSection = () => (
    <div className={tokens.section.container}>
      <div>
        <h3 className={tokens.section.header}>
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
                <label className={tokens.input.label}>
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
                  className={tokens.input.field}
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
          <p className={tokens.input.error}>{errors.automaticThoughts}</p>
        )}
      </div>
    </div>
  );

  const renderSchemaSection = () => (
    <div className={tokens.section.container}>
      {/* Core Belief */}
      <div>
        <h3 className={tokens.section.header}>
          <Target className="w-5 h-5 text-primary" />
          Core Belief
        </h3>
        <div className="space-y-4">
          <div>
            <label className={tokens.input.label}>
              Core Belief <span className={tokens.input.required}>*</span>
            </label>
            <Textarea
              placeholder="What deeper belief about myself, others, or the world does this connect to?"
              value={formData.coreBeliefText}
              onChange={(e) => updateField('coreBeliefText', e.target.value)}
              className={tokens.input.field}
            />
            {errors.coreBeliefText && (
              <p className={tokens.input.error}>{errors.coreBeliefText}</p>
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
        <h3 className={tokens.section.subHeader}>Schema-Behaviors</h3>
        <div className="space-y-4">
          <div>
            <label className={tokens.input.label}>
              Confirming Behaviors
            </label>
            <Textarea
              placeholder="Actions that reinforce the belief"
              value={formData.confirmingBehaviors}
              onChange={(e) => updateField('confirmingBehaviors', e.target.value)}
              className={cn(tokens.input.field, "min-h-[60px]")}
            />
          </div>
          <div>
            <label className={tokens.input.label}>
              Avoidant Behaviors
            </label>
            <Textarea
              placeholder="Actions to escape or avoid the situation"
              value={formData.avoidantBehaviors}
              onChange={(e) => updateField('avoidantBehaviors', e.target.value)}
              className={cn(tokens.input.field, "min-h-[60px]")}
            />
          </div>
          <div>
            <label className={tokens.input.label}>
              Overriding Behaviors
            </label>
            <Textarea
              placeholder="Compensatory actions to counteract the belief"
              value={formData.overridingBehaviors}
              onChange={(e) => updateField('overridingBehaviors', e.target.value)}
              className={cn(tokens.input.field, "min-h-[60px]")}
            />
          </div>
        </div>
      </div>

      {/* Schema Modes */}
      <div>
        <h3 className={tokens.section.subHeader}>Schema-Modes</h3>
        <p className={tokens.section.description}>
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
                <div className="font-medium text-sm text-foreground">{mode.name}</div>
                <div className="text-xs text-muted-foreground italic">{mode.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChallengeSection = () => (
    <div className={tokens.section.container}>
      <div>
        <h3 className={tokens.section.header}>
          <Lightbulb className="w-5 h-5 text-primary" />
          Challenge Questions
        </h3>
        <div className="space-y-4">
          {formData.challengeQuestions.map((question, index) => (
            <div key={index} className={tokens.arrayField.item}>
              <div className="font-medium text-sm mb-2 text-primary">
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
                className={tokens.input.field}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={tokens.section.subHeader}>Additional Questions</h3>
        <ArrayField
          items={formData.additionalQuestions}
          onAdd={addAdditionalQuestion}
          onRemove={removeAdditionalQuestion}
          addButtonText="Add Custom Question"
          emptyMessage="No additional questions added"
          renderItem={(question, index) => (
            <div className="space-y-3">
              <div>
                <label className={tokens.input.label}>
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
                  className="w-full bg-card border border-border/30 rounded-lg p-3 text-foreground"
                />
              </div>
              <div>
                <label className={tokens.input.label}>
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
                  className={tokens.input.field}
                />
              </div>
            </div>
          )}
        />
      </div>

      <div>
        <h3 className={tokens.section.subHeader}>Rational Thoughts</h3>
        <ArrayField
          items={formData.rationalThoughts}
          onAdd={addRationalThought}
          onRemove={removeRationalThought}
          addButtonText="Add Rational Thought"
          emptyMessage="No rational thoughts developed yet"
          renderItem={(thought, index) => (
            <div className="space-y-3">
              <div>
                <label className={tokens.input.label}>
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
                  className={tokens.input.field}
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
    <div className={tokens.section.container}>
      {/* Final Emotions */}
      <div>
        <h3 className={tokens.section.header}>
          <Heart className="w-5 h-5 text-accent" />
          Effect on Feelings
        </h3>
        <p className={tokens.section.description}>
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
              onChange={(value) => handleOtherIntensityChange('finalEmotions', value)}
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
        <h3 className={tokens.section.subHeader}>New Behaviors</h3>
        <div>
          <label className={tokens.input.label}>
            What will you do differently next time this situation arises?
          </label>
          <Textarea
            placeholder="Describe new behaviors or responses you want to try..."
            value={formData.newBehaviors}
            onChange={(e) => updateField('newBehaviors', e.target.value)}
            className={cn(tokens.input.field, "min-h-[100px]")}
          />
        </div>
      </div>

      {/* Alternative Responses */}
      <div>
        <h3 className={tokens.section.subHeader}>Alternative Responses</h3>
        <ArrayField
          items={formData.alternativeResponses}
          onAdd={addAlternativeResponse}
          onRemove={removeAlternativeResponse}
          addButtonText="Add Alternative Response"
          emptyMessage="No alternative responses identified"
          renderItem={(response, index) => (
            <div>
              <label className={tokens.input.label}>
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
                className={tokens.input.field}
              />
            </div>
          )}
        />
      </div>
    </div>
  );

  const renderReflectionSection = () => (
    <div className={tokens.section.container}>
      {/* Header consistent with other sections */}
      <div>
        <h3 className={tokens.section.header}>
          <Eye className="w-5 h-5 text-primary" />
          Schema Reflection
          <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
        </h3>
        <p className={tokens.section.description}>
          Explore your deeper patterns and emotional responses through guided self-reflection.
        </p>
      </div>
      
      {/* Enable reflection checkbox - simplified styling */}
      <div>
        <div className="flex items-center gap-3 mb-4 p-4 border border-border/30 rounded-lg bg-muted/20">
          <input
            type="checkbox"
            id="enable-reflection"
            checked={schemaReflection.enabled}
            onChange={(e) => toggleSchemaReflection(e.target.checked)}
            className="w-5 h-5 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
          />
          <div className="flex-1">
            <label htmlFor="enable-reflection" className={tokens.input.label}>
              Enable Schema Reflection
            </label>
            <p className="text-sm text-muted-foreground">
              Unlock deeper insights through therapeutic self-exploration
            </p>
          </div>
          {!schemaReflection.enabled && (
            <div className="text-xs text-muted-foreground">
              11 Questions Available
            </div>
          )}
        </div>
      </div>

      {/* Reflection Preview (shown when disabled) */}
      {!schemaReflection.enabled && (
        <div>
          <div className="p-4 border border-border/30 rounded-lg bg-muted/20">
            <h4 className={tokens.section.subHeader}>
              What You&apos;ll Explore
            </h4>
            <p className="text-muted-foreground mb-4">
              Schema reflection helps you understand the deeper patterns behind your reactions. 
              This therapeutic approach reveals connections to your past and guides healing.
            </p>
            
            {/* Sample Questions Preview */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border border-border/30 rounded-lg">
                  <h5 className="text-sm font-medium text-foreground mb-1">Childhood Patterns</h5>
                  <p className="text-xs text-muted-foreground">
                    What does this situation remind you of from your past?
                  </p>
                </div>
                <div className="p-3 border border-border/30 rounded-lg">
                  <h5 className="text-sm font-medium text-foreground mb-1">Schema Patterns</h5>
                  <p className="text-xs text-muted-foreground">
                    Do you notice patterns of perfectionism or people-pleasing?
                  </p>
                </div>
              </div>
              
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  11 professionally crafted questions across therapeutic domains
                </p>
                <Button
                  type="button"
                  onClick={() => toggleSchemaReflection(true)}
                  className="hover:bg-accent hover:text-accent-foreground"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Begin Schema Reflection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schema Reflection Content (only visible when enabled) */}
      {schemaReflection.enabled && (
        <div className="space-y-6">
          {/* Personal Assessment */}
          <div>
            <h4 className={tokens.section.subHeader}>Personal Assessment</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Take a moment for open-ended reflection about your patterns and insights. 
              What themes emerge as you explore this situation?
            </p>
            <div className="relative">
              <Textarea
                placeholder="What patterns do you notice about yourself in this situation? What insights are emerging for you? What feels familiar or different about how you're responding? What does your inner wisdom tell you about this experience?"
                value={schemaReflection.selfAssessment}
                onChange={(e) => updateSchemaReflectionAssessment(e.target.value)}
                className={cn(tokens.input.field, "min-h-[140px]")}
                maxLength={2000}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                {schemaReflection.selfAssessment.length}/2000
              </div>
            </div>
          </div>

          {/* Reflection Questions */}
          <div>
            <h4 className={tokens.section.subHeader}>Guided Reflection Questions</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Answer the questions that resonate most deeply with your experience.
            </p>
            
            {/* Questions by Category */}
            <div className="space-y-4">
              {[
                { key: 'childhood', name: 'Childhood Patterns' },
                { key: 'schemas', name: 'Schema Patterns' },
                { key: 'coping', name: 'Coping Strategies' },
                { key: 'modes', name: 'Emotional Modes' }
              ].map(({ key, name }) => {
                const categoryQuestions = schemaReflection.questions.filter(q => q.category === key);
                const answeredCount = categoryQuestions.filter(q => q.answer.trim()).length;
                
                return (
                  <div key={key} className="p-4 border border-border/30 rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className={tokens.input.label}>{name}</h5>
                      <div className="text-xs text-muted-foreground">
                        {answeredCount}/{categoryQuestions.length} answered
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {categoryQuestions.map((question, _index) => {
                        const globalIndex = schemaReflection.questions.indexOf(question);
                        
                        return (
                          <div key={globalIndex}>
                            <label className={tokens.input.label}>
                              {question.question}
                            </label>
                            <Textarea
                              placeholder="Take time to explore this question honestly and compassionately. What comes up for you? What patterns or insights emerge?"
                              value={question.answer}
                              onChange={(e) => updateSchemaReflectionQuestion(globalIndex, 'answer', e.target.value)}
                              className={cn(tokens.input.field, "min-h-[80px]")}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Questions */}
          {schemaReflection.questions.filter(q => q.category === 'custom').length > 0 && (
            <div>
              <h4 className={tokens.section.subHeader}>Custom Questions</h4>
              
              <div className="space-y-4">
                {schemaReflection.questions
                  .map((question, index) => ({ question, index }))
                  .filter(({ question }) => question.category === 'custom')
                  .map(({ question, index }) => {
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="What would you like to explore about this experience?"
                            value={question.question}
                            onChange={(e) => updateSchemaReflectionQuestion(index, 'question', e.target.value)}
                            className={tokens.input.field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSchemaReflectionQuestion(index)}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                        {question.question.trim() && (
                          <Textarea
                            placeholder="Take time to explore your custom question with curiosity and self-compassion..."
                            value={question.answer}
                            onChange={(e) => updateSchemaReflectionQuestion(index, 'answer', e.target.value)}
                            className={cn(tokens.input.field, "min-h-[80px]")}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Add Custom Question Button */}
          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => addSchemaReflectionQuestion('custom')}
              className="hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Reflection Question
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'situation': return renderSituationSection();
      case 'emotions': return renderEmotionsSection();
      case 'thoughts': return renderThoughtsSection();
      case 'schema': return renderSchemaSection();
      case 'reflection': return renderReflectionSection();
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
        className="max-w-4xl w-full h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0 sm:max-w-5xl"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className={tokens.modal.header}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pl-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">CBT Diary Entry</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
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

        {/* Section Navigation - Therapeutic Design */}
        <div className="px-4 sm:px-6 py-4 border-b border-border/30 bg-gradient-to-r from-background via-muted/5 to-background overflow-x-auto">
          <div className="flex gap-2 sm:gap-4 min-w-max sm:flex-wrap sm:min-w-0 justify-start sm:justify-center">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;
              const hasError = Object.keys(errors).some(key => 
                (section.id === 'situation' && (key === 'situation')) ||
                (section.id === 'emotions' && key === 'initialEmotions') ||
                (section.id === 'thoughts' && key === 'automaticThoughts') ||
                (section.id === 'schema' && key === 'coreBeliefText') ||
                (section.id === 'challenge' && key === 'challengeQuestions')
              );
              
              // Progress calculation for each section
              const getCompletion = () => {
                switch (section.id) {
                  case 'situation':
                    return formData.situation.trim() ? 100 : 0;
                  case 'emotions':
                    const hasInitialEmotion = Object.entries(formData.initialEmotions).some(([key, value]) => 
                      key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
                    ) || (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0);
                    return hasInitialEmotion ? 100 : 0;
                  case 'thoughts':
                    const hasThoughts = formData.automaticThoughts.some(t => t.thought.trim());
                    return hasThoughts ? 100 : 0;
                  case 'schema':
                    const hasSchema = formData.coreBeliefText.trim();
                    const selectedModes = formData.schemaModes.filter(m => m.selected).length;
                    return hasSchema ? (selectedModes > 0 ? 100 : 75) : 0;
                  case 'reflection':
                    if (!schemaReflection.enabled) return 0;
                    const hasAssessment = schemaReflection.selfAssessment.trim();
                    const answeredQuestions = schemaReflection.questions.filter(q => q.answer.trim()).length;
                    const totalQuestions = schemaReflection.questions.length;
                    const questionProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 70 : 0;
                    const assessmentProgress = hasAssessment ? 30 : 0;
                    return Math.round(questionProgress + assessmentProgress);
                  case 'challenge':
                    const answeredChallenges = formData.challengeQuestions.filter(q => q.answer.trim()).length;
                    const hasRationalThoughts = formData.rationalThoughts.some(t => t.thought.trim());
                    return answeredChallenges > 0 ? (hasRationalThoughts ? 100 : 70) : 0;
                  case 'results':
                    const hasFinalEmotion = Object.entries(formData.finalEmotions).some(([key, value]) => 
                      key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
                    ) || (formData.finalEmotions.otherIntensity && formData.finalEmotions.otherIntensity > 0);
                    const hasNewBehaviors = formData.newBehaviors.trim();
                    return hasFinalEmotion ? (hasNewBehaviors ? 100 : 60) : 0;
                  default:
                    return 0;
                }
              };
              
              const completion = getCompletion();
              const isReflection = section.id === 'reflection';
              const reflectionEnabled = schemaReflection.enabled;

              return (
                <div key={section.id} className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 sm:gap-2 h-auto py-2 sm:py-3 px-2 sm:px-3 min-w-[72px] sm:min-w-[88px] transition-all duration-200",
                      // Use standard accent hover colors consistently
                      "hover:!bg-accent hover:!text-accent-foreground",
                      isActive 
                        ? "!bg-primary !text-primary-foreground shadow-md" 
                        : section.required 
                        ? "!bg-muted !border !border-muted-foreground/20 !text-foreground shadow-sm"
                        : "!bg-background !border !border-border/30",
                      hasError && "border-red-300 bg-red-50/50 text-red-700 hover:bg-red-50",
                      !section.required && !isActive && "border-dashed border-muted-foreground/30",
                      isReflection && !reflectionEnabled && "border-dashed border-primary/40 hover:border-primary/60",
                      "relative overflow-hidden rounded-lg"
                    )}
                    aria-pressed={isActive}
                    aria-label={`${section.name} section${section.required ? ' (required)' : ' (optional)'}${isActive ? ' (current)' : ''}${completion === 100 ? ' (completed)' : completion > 0 ? ` (${completion}% complete)` : ''}`}
                  >
                    {/* Progress background */}
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 h-0.5 sm:h-1 transition-all duration-300",
                        completion > 0 && completion < 100 ? "bg-yellow-400" : 
                        completion === 100 ? "bg-green-500" : "bg-transparent"
                      )}
                      style={{ width: `${completion}%` }}
                    />
                    
                    
                    <div className="flex items-center justify-center">
                      <Icon className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                        isActive && "text-primary-foreground",
                        !isActive && section.required && "text-foreground",
                        !isActive && !section.required && "text-muted-foreground",
                        isReflection && reflectionEnabled && !isActive && "text-primary",
                        section.id === 'challenge' && !isActive && "text-red-500",
                        hasError && "text-red-500"
                      )} />
                    </div>
                    
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs font-medium leading-tight text-center">
                        {section.name}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full leading-none",
                        section.required 
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-muted/60 text-muted-foreground"
                      )}>
                        {section.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    
                    <span className="text-[10px] font-medium text-center opacity-60">
                      {index + 1} of {sections.length}
                    </span>
                    
                    
                    {/* Reflection availability indicator */}
                    {isReflection && !reflectionEnabled && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
                    )}
                  </Button>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap border">
                    {completion === 100 ? "✓ Complete" : 
                     completion > 0 ? `${completion}% complete` : 
                     isReflection && !reflectionEnabled ? "Click to enable reflection" : 
                     section.required ? "Required section" : "Optional section"}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Overall Progress */}
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium flex-shrink-0">Overall Progress</span>
              <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ 
                    width: `${Math.round(sections.reduce((acc, section) => {
                      const completion = (() => {
                        switch (section.id) {
                          case 'situation': return formData.situation.trim() ? 100 : 0;
                          case 'emotions': return (Object.entries(formData.initialEmotions).some(([key, value]) => 
                            key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
                          ) || (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0)) ? 100 : 0;
                          case 'thoughts': return formData.automaticThoughts.some(t => t.thought.trim()) ? 100 : 0;
                          case 'schema': return formData.coreBeliefText.trim() ? 100 : 0;
                          case 'reflection': return schemaReflection.enabled && 
                            (schemaReflection.selfAssessment.trim() || 
                             schemaReflection.questions.some(q => q.answer.trim())) ? 100 : 0;
                          case 'challenge': return formData.challengeQuestions.some(q => q.answer.trim()) ? 100 : 0;
                          case 'results': return (Object.entries(formData.finalEmotions).some(([key, value]) => 
                            key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
                          ) || (formData.finalEmotions.otherIntensity && formData.finalEmotions.otherIntensity > 0)) ? 100 : 0;
                          default: return 0;
                        }
                      })();
                      return acc + completion;
                    }, 0) / sections.length)}%`
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium min-w-[3rem]">
                {Math.round(sections.reduce((acc, section) => {
                  const completion = (() => {
                    switch (section.id) {
                      case 'situation': return formData.situation.trim() ? 100 : 0;
                      case 'emotions': return (Object.entries(formData.initialEmotions).some(([key, value]) => 
                        key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
                      ) || (formData.initialEmotions.otherIntensity && formData.initialEmotions.otherIntensity > 0)) ? 100 : 0;
                      case 'thoughts': return formData.automaticThoughts.some(t => t.thought.trim()) ? 100 : 0;
                      case 'schema': return formData.coreBeliefText.trim() ? 100 : 0;
                      case 'reflection': return schemaReflection.enabled && 
                        (schemaReflection.selfAssessment.trim() || 
                         schemaReflection.questions.some(q => q.answer.trim())) ? 100 : 0;
                      case 'challenge': return formData.challengeQuestions.some(q => q.answer.trim()) ? 100 : 0;
                      case 'results': return (Object.entries(formData.finalEmotions).some(([key, value]) => 
                        key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0
                      ) || (formData.finalEmotions.otherIntensity && formData.finalEmotions.otherIntensity > 0)) ? 100 : 0;
                      default: return 0;
                    }
                  })();
                  return acc + completion;
                }, 0) / sections.length)}%
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={tokens.modal.content}>
          {renderCurrentSection()}
        </div>

        {/* Footer */}
        <DialogFooter className={cn(tokens.modal.footer, "p-6 pt-4 border-t border-border/30")}>
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSection(sections[currentSectionIndex - 1]?.id)}
                disabled={!canGoPrev}
                className="px-4 hover:bg-accent hover:text-accent-foreground transition-colors"
                tabIndex={canGoPrev ? 0 : -1}
                aria-label="Go to previous section"
              >
                ← Previous
              </Button>
              <div className="flex items-center gap-2 px-2 sm:px-4">
                <span className="text-xs text-muted-foreground font-medium">
                  {currentSectionIndex + 1} of {sections.length}
                </span>
                {isDirty && lastSaved && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="hidden sm:inline">Auto-saved</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSection(sections[currentSectionIndex + 1]?.id)}
                disabled={!canGoNext}
                className="px-4 hover:bg-accent hover:text-accent-foreground transition-colors"
                tabIndex={canGoNext ? 0 : -1}
                aria-label="Go to next section"
              >
                Next →
              </Button>
            </div>
            
            <div className="flex items-center gap-3 pr-2">
              {/* Accessibility indicator */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {isValid ? "Form is complete and ready to send" : "Please complete required sections before sending"}
              </div>
              
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Cancel and close diary"
              >
                Cancel
              </Button>
              
              <CBTExportButton 
                formData={formData}
                isValid={isValid}
                disabled={!isDirty}
                size="default"
                variant="outline"
              />
              
              <Button
                onClick={handleSendToChat}
                disabled={!isValid}
                className={cn(
                  "bg-gradient-to-r transition-all duration-200",
                  isValid 
                    ? "from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl" 
                    : "from-muted to-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label={isValid ? "Send diary entry to chat" : "Complete required sections first"}
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
              <h3 className="text-lg font-semibold mb-2 text-foreground">Reset CBT Diary?</h3>
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

export default CBTDiaryModal;