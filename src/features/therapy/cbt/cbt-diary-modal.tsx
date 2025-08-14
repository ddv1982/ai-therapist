'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
import { useCBTForm } from '@/hooks/therapy/use-cbt-form';
import { NumericEmotionKeys } from '@/types/therapy';
import { cn } from '@/lib/utils/utils';
import { clearAllCBTDrafts } from '@/lib/utils/cbt-draft-utils';
import { detectCrisisContent, CrisisDetectionResult } from '@/lib/therapy/crisis-detection';
import { CrisisAlert } from '@/components/therapy/crisis-alert';
import { SituationSection, EmotionsSection, ThoughtsSection, EmotionScale, ArrayField } from './components';

interface CBTDiaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendToChat: (formattedContent: string) => void;
}


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
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [sectionTransition, setSectionTransition] = useState<string | null>(null);
  const [announceMessage, setAnnounceMessage] = useState<string>('');
  const [crisisDetection, setCrisisDetection] = useState<CrisisDetectionResult | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const sectionContentRef = useRef<HTMLDivElement>(null);

  // Guard against uninitialized schema reflection data
  const schemaReflection = useMemo(() => formData.schemaReflection || {
    enabled: false,
    questions: [],
    selfAssessment: ''
  }, [formData.schemaReflection]);

  // Section navigation
  const sections = useMemo(() => [
    { id: 'situation', name: 'Situation', icon: MessageCircle, required: true },
    { id: 'emotions', name: 'Emotions', icon: Heart, required: true },
    { id: 'thoughts', name: 'Thoughts', icon: Brain, required: true },
    { id: 'schema', name: 'Schema', icon: Target, required: true },
    { id: 'challenge', name: 'Challenge', icon: Lightbulb, required: true },
    { id: 'reflection', name: 'Reflection', icon: Eye, required: false },
    { id: 'results', name: 'Results', icon: CheckSquare, required: false }
  ], []);

  // Calculate overall progress
  const calculateOverallProgress = useCallback(() => {
    return Math.round(sections.reduce((acc, section) => {
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
    }, 0) / sections.length);
  }, [sections, formData, schemaReflection]);

  const overallProgress = calculateOverallProgress();

  // Crisis detection monitoring
  useEffect(() => {
    // Collect all text content from the form
    const textContent = [
      formData.situation,
      ...formData.automaticThoughts.map(t => t.thought),
      formData.coreBeliefText,
      ...formData.challengeQuestions.map(q => q.answer),
      ...formData.additionalQuestions.map(q => q.answer),
      ...formData.rationalThoughts.map(t => t.thought),
      formData.newBehaviors,
      ...formData.alternativeResponses.map(r => r.response),
      formData.schemaReflection?.selfAssessment || '',
      ...formData.schemaReflection?.questions.map(q => q.answer) || []
    ].filter(text => text && text.trim()).join(' ');

    if (textContent.trim().length > 10) { // Only check if there's substantial content
      const detection = detectCrisisContent(textContent);
      setCrisisDetection(detection);
      
      // Show alert for high-risk content
      if (detection.isHighRisk && !showCrisisAlert) {
        setShowCrisisAlert(true);
        setAnnounceMessage('Crisis support resources have been detected and are available for review.');
      }
    }
  }, [formData, showCrisisAlert]);

  // Track section completion and add keyboard navigation
  useEffect(() => {
    const newCompleted = new Set<string>();
    
    sections.forEach(section => {
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
      
      if (completion >= 50) { // Consider section completed at 50% or more
        newCompleted.add(section.id);
      }
    });
    
    setCompletedSections(newCompleted);
  }, [formData, schemaReflection, sections]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when modal is focused
      if (!document.querySelector('[role="dialog"]')?.contains(document.activeElement)) {
        return;
      }

      const currentIndex = sections.findIndex(s => s.id === activeSection);
      
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            setActiveSection(sections[currentIndex - 1].id);
          }
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < sections.length - 1) {
            setActiveSection(sections[currentIndex + 1].id);
          }
          break;
        case 'Home':
          event.preventDefault();
          setActiveSection(sections[0].id);
          break;
        case 'End':
          event.preventDefault();
          setActiveSection(sections[sections.length - 1].id);
          break;
        case 'Escape':
          event.preventDefault();
          onOpenChange(false);
          break;
        // Number keys for direct section access
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
          event.preventDefault();
          const sectionIndex = parseInt(event.key) - 1;
          if (sections[sectionIndex]) {
            setActiveSection(sections[sectionIndex].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, activeSection, sections, onOpenChange]);

  const handleSendToChat = useCallback(async () => {
    const errors = validateForm();
    if (errors.length === 0) {
      setIsProcessing(true);
      try {
        // Add a small delay to show the loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const formattedContent = generateFormattedOutput();
        onSendToChat(formattedContent);
        onOpenChange(false);
        resetForm();
        // Clear all individual CBT component drafts from localStorage
        clearAllCBTDrafts();
      } catch (error) {
        console.error('Error sending CBT diary to chat:', error);
        // Handle error if needed
      } finally {
        setIsProcessing(false);
      }
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
    <SituationSection
      formData={formData}
      updateField={updateField}
      errors={errors}
    />
  );

  const renderEmotionsSection = () => (
    <EmotionsSection
      formData={formData}
      handleEmotionChange={handleEmotionChange}
      handleOtherIntensityChange={handleOtherIntensityChange}
      updateNestedField={updateNestedField}
      errors={errors}
    />
  );

  const renderThoughtsSection = () => (
    <ThoughtsSection
      formData={formData}
      updateField={updateField}
      addAutomaticThought={addAutomaticThought}
      removeAutomaticThought={removeAutomaticThought}
      errors={errors}
    />
  );

  const renderSchemaSection = () => (
    <Card className="p-6 space-y-8 min-h-[600px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Core Belief & Schema Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {/* Core Belief */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-base font-medium text-foreground">
              Core Belief <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="What deeper belief about myself, others, or the world does this connect to?"
              value={formData.coreBeliefText}
              onChange={(e) => updateField('coreBeliefText', e.target.value)}
              className="min-h-[120px] resize-none"
            />
            {errors.coreBeliefText && (
              <p className="text-destructive text-sm mt-1">{errors.coreBeliefText}</p>
            )}
          </div>
          <EmotionScale
            label="How much do you believe this core belief? (Credibility)"
            value={formData.coreBeliefCredibility}
            onChange={(value) => updateField('coreBeliefCredibility', value)}
          />
        </div>

        {/* Schema Behaviors */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Schema-Behaviors</h4>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-base font-medium text-foreground">
                Confirming Behaviors
              </label>
              <Textarea
                placeholder="Actions that reinforce the belief"
                value={formData.confirmingBehaviors}
                onChange={(e) => updateField('confirmingBehaviors', e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-base font-medium text-foreground">
                Avoidant Behaviors
              </label>
              <Textarea
                placeholder="Actions to escape or avoid the situation"
                value={formData.avoidantBehaviors}
                onChange={(e) => updateField('avoidantBehaviors', e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-base font-medium text-foreground">
                Overriding Behaviors
              </label>
              <Textarea
                placeholder="Compensatory actions to counteract the belief"
                value={formData.overridingBehaviors}
                onChange={(e) => updateField('overridingBehaviors', e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Schema Modes */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Schema-Modes</h4>
          <p className="text-sm text-muted-foreground">
            Which emotional states were you experiencing?
          </p>
          <div className="space-y-2">
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
      </CardContent>
    </Card>
  );

  const renderChallengeSection = () => (
    <Card className="p-6 space-y-8 min-h-[600px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Challenge & Reframe
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {/* Challenge Questions */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Challenge Questions</h4>
          <div className="space-y-4">
            {formData.challengeQuestions.map((question, index) => (
              <div key={index} className="p-4 border rounded-lg bg-card/50">
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
                  className="min-h-[120px] resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Additional Questions */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Additional Questions</h4>
          <ArrayField
            items={formData.additionalQuestions}
            onAdd={addAdditionalQuestion}
            onRemove={removeAdditionalQuestion}
            addButtonText="Add Custom Question"
            emptyMessage="No additional questions added"
            renderItem={(question, index) => (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-base font-medium text-foreground">
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
                <div className="space-y-2">
                  <label className="text-base font-medium text-foreground">
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
                    className="min-h-[120px] resize-none"
                  />
                </div>
              </div>
            )}
          />
        </div>

        {/* Rational Thoughts */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Rational Thoughts</h4>
          <ArrayField
            items={formData.rationalThoughts}
            onAdd={addRationalThought}
            onRemove={removeRationalThought}
            addButtonText="Add Rational Thought"
            emptyMessage="No rational thoughts developed yet"
            renderItem={(thought, index) => (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-base font-medium text-foreground">
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
                    className="min-h-[120px] resize-none"
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
      </CardContent>
    </Card>
  );

  const renderResultsSection = () => (
    <Card className="p-6 space-y-8 min-h-[400px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Results & Future Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {/* Final Emotions */}
        <div className="space-y-4">
          <div>
            <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              Effect on Feelings
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              How do you feel after completing this reflection?
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
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
            <div>
              <EmotionScale
                label={formData.initialEmotions.other}
                value={formData.finalEmotions.otherIntensity || 0}
                onChange={(value) => handleOtherIntensityChange('finalEmotions', value)}
              />
            </div>
          )}

          <div>
            <EmotionScale
              label="Credibility of Original Automatic Thoughts"
              value={formData.originalThoughtCredibility}
              onChange={(value) => updateField('originalThoughtCredibility', value)}
            />
          </div>
        </div>

        {/* New Behaviors */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">New Behaviors</h4>
          <div className="space-y-2">
            <label className="text-base font-medium text-foreground">
              What will you do differently next time this situation arises?
            </label>
            <Textarea
              placeholder="Describe new behaviors or responses you want to try..."
              value={formData.newBehaviors}
              onChange={(e) => updateField('newBehaviors', e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        {/* Alternative Responses */}
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">Alternative Responses</h4>
          <ArrayField
            items={formData.alternativeResponses}
            onAdd={addAlternativeResponse}
            onRemove={removeAlternativeResponse}
            addButtonText="Add Alternative Response"
            emptyMessage="No alternative responses identified"
            renderItem={(response, index) => (
              <div className="space-y-2">
                <label className="text-base font-medium text-foreground">
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
                  className="min-h-[120px] resize-none"
                />
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderReflectionSection = () => (
    <Card className="p-6 space-y-8 min-h-[600px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Schema Reflection
          <Badge variant="outline" className="text-xs">Optional</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Explore your deeper patterns and emotional responses through guided self-reflection.
        </p>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
      
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
            <label htmlFor="enable-reflection" className="block text-sm font-medium mb-2 text-foreground">
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
            <h4 className="text-base font-semibold mb-4 text-foreground">
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
            <h4 className="text-base font-semibold mb-4 text-foreground">Personal Assessment</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Take a moment for open-ended reflection about your patterns and insights. 
              What themes emerge as you explore this situation?
            </p>
            <div className="relative">
              <Textarea
                placeholder="What patterns do you notice about yourself in this situation? What insights are emerging for you? What feels familiar or different about how you're responding? What does your inner wisdom tell you about this experience?"
                value={schemaReflection.selfAssessment}
                onChange={(e) => updateSchemaReflectionAssessment(e.target.value)}
                className={cn("w-full min-h-[140px] resize-none bg-card border border-border/30 rounded-lg p-4 text-foreground leading-relaxed hover:border-border/50 focus:border-primary/50 transition-colors duration-200")}
                maxLength={2000}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                {schemaReflection.selfAssessment.length}/2000
              </div>
            </div>
          </div>

          {/* Reflection Questions */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-foreground">Guided Reflection Questions</h4>
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
                      <h5 className="block text-sm font-medium mb-2 text-foreground">{name}</h5>
                      <div className="text-xs text-muted-foreground">
                        {answeredCount}/{categoryQuestions.length} answered
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {categoryQuestions.map((question, _index) => {
                        const globalIndex = schemaReflection.questions.indexOf(question);
                        
                        return (
                          <div key={globalIndex}>
                            <label className="block text-sm font-medium mb-2 text-foreground">
                              {question.question}
                            </label>
                            <Textarea
                              placeholder="Take time to explore this question honestly and compassionately. What comes up for you? What patterns or insights emerge?"
                              value={question.answer}
                              onChange={(e) => updateSchemaReflectionQuestion(globalIndex, 'answer', e.target.value)}
                              className={cn("w-full min-h-[80px] resize-none bg-card border border-border/30 rounded-lg p-4 text-foreground leading-relaxed hover:border-border/50 focus:border-primary/50 transition-colors duration-200")}
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
              <h4 className="text-base font-semibold mb-4 text-foreground">Custom Questions</h4>
              
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
                            className="w-full min-h-[120px] resize-none bg-card border border-border/30 rounded-lg p-4 text-foreground leading-relaxed hover:border-border/50 focus:border-primary/50 transition-colors duration-200"
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
                            className={cn("w-full min-h-[80px] resize-none bg-card border border-border/30 rounded-lg p-4 text-foreground leading-relaxed hover:border-border/50 focus:border-primary/50 transition-colors duration-200")}
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
      </CardContent>
    </Card>
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
        className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-7xl h-[95vh] sm:h-[90vh] md:h-[85vh] max-h-[700px] sm:max-h-[800px] md:max-h-[900px] min-h-[600px] p-0"
      >
        <ErrorBoundary
          showErrorDetails={process.env.NODE_ENV === 'development'}
          onError={(error, errorInfo) => {
            console.error('CBT Diary Modal Error:', error, errorInfo);
          }}
          resetKeys={[activeSection, JSON.stringify(formData)]}
        >
        {/* Screen reader announcements */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          role="status"
        >
          {announceMessage}
        </div>
        
        <div className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-0">
          {/* Header */}
          <DialogHeader className="border-b p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-semibold">CBT Diary Entry</DialogTitle>
                  <DialogDescription className="text-base text-muted-foreground">
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
              {crisisDetection?.isHighRisk && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-red-700">Support resources available</span>
                </div>
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

          {/* Navigation */}
          <div className="border-b p-4" role="navigation" aria-label="CBT diary sections">
            <div className="flex flex-wrap gap-2 sm:gap-4 justify-center"
                 role="tablist" 
                 aria-label="CBT diary section navigation"
            >
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
              const isCompleted = completedSections.has(section.id);
              const canNavigateToSection = isCompleted || index <= currentSectionIndex + 1; // Allow forward by 1 step

              return (
                <div key={section.id} className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (canNavigateToSection || isActive) {
                        setSectionTransition(section.id);
                        setAnnounceMessage(`Loading ${section.name} section`);
                        setTimeout(() => {
                          setActiveSection(section.id);
                          setSectionTransition(null);
                          setAnnounceMessage(`Now viewing ${section.name} section. ${section.required ? 'This section is required.' : 'This section is optional.'}`);
                          
                          // Focus the section content for accessibility
                          setTimeout(() => {
                            if (sectionContentRef.current) {
                              sectionContentRef.current.focus();
                            }
                          }, 100);
                        }, 150);
                      }
                    }}
                    disabled={!canNavigateToSection && !isActive}
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
                      isCompleted && !isActive && "border-green-300 bg-green-50/30 hover:bg-green-50/50",
                      !canNavigateToSection && !isActive && "opacity-50 cursor-not-allowed hover:!bg-muted hover:!text-muted-foreground",
                      "relative overflow-hidden rounded-lg"
                    )}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`cbt-section-${section.id}`}
                    aria-describedby={`cbt-section-desc-${section.id}`}
                    aria-label={`${section.name} section${section.required ? ' (required)' : ' (optional)'}${isActive ? ' (current)' : ''}${completion === 100 ? ' (completed)' : completion > 0 ? ` (${completion}% complete)` : ''}${canNavigateToSection ? ' (clickable)' : ' (locked)'}`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {/* Progress background - Enhanced with animation */}
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 h-1 sm:h-1.5 transition-all duration-500 ease-in-out",
                        completion > 0 && completion < 100 ? "bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm" : 
                        completion === 100 ? "bg-gradient-to-r from-green-500 to-green-600 shadow-sm" : "bg-transparent"
                      )}
                      style={{ 
                        width: `${completion}%`,
                        borderRadius: completion > 0 ? '2px' : '0'
                      }}
                    >
                      {completion > 0 && completion < 100 && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                      )}
                    </div>
                    
                    
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
                    
                    
                    {/* Completion indicator */}
                    {isCompleted && !isActive && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                    
                    {/* Reflection availability indicator */}
                    {isReflection && !reflectionEnabled && !isCompleted && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
                    )}
                    
                    {/* Locked indicator */}
                    {!canNavigateToSection && !isActive && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-muted-foreground rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🔒</span>
                      </div>
                    )}
                  </Button>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap border">
                    {!canNavigateToSection && !isActive ? "🔒 Complete previous sections first" :
                     completion === 100 ? "✓ Complete - Click to review" : 
                     completion > 0 ? `${completion}% complete - Click to continue` : 
                     isReflection && !reflectionEnabled ? "Click to enable reflection" : 
                     section.required ? "Required section" : "Optional section"}
                    {canNavigateToSection && !isActive && (
                      <div className="text-[10px] opacity-75 mt-1">
                        Keyboard: {index + 1}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Overall Progress */}
          <div className="mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  Overall Progress
                  {overallProgress === 100 && (
                    <span className="text-green-500 animate-bounce">🎉</span>
                  )}
                </span>
                <span className={cn(
                  "text-sm font-semibold transition-colors duration-300",
                  overallProgress < 30 ? "text-red-500" :
                  overallProgress < 70 ? "text-yellow-500" :
                  overallProgress < 100 ? "text-blue-500" :
                  "text-green-500"
                )}>
                  {overallProgress}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={overallProgress} 
                  className="w-full h-3 bg-muted/30 transition-all duration-500" 
                />
                {/* Completion celebration effect */}
                {overallProgress === 100 && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse" />
                )}
              </div>
              
              {/* Progress milestone messages */}
              <div className="text-xs text-muted-foreground text-center">
                {overallProgress === 0 ? "🌱 Ready to begin your CBT journey" :
                 overallProgress < 25 ? "📝 Making great progress!" :
                 overallProgress < 50 ? "🔍 Diving deeper into your thoughts" :
                 overallProgress < 75 ? "💡 Developing new insights" :
                 overallProgress < 100 ? "🎯 Almost there! You're doing amazing" :
                 "✨ Complete! Ready to share your insights"}
              </div>
            </div>
            
            {/* Keyboard shortcuts info */}
            <div className="mt-3 text-xs text-muted-foreground text-center">
              <span className="hidden sm:inline">
                💡 Use arrow keys, numbers (1-7), or click to navigate • ESC to close
              </span>
              <span className="sm:hidden">
                💡 Tap section buttons to navigate
              </span>
            </div>
          </div>
        </div>

          {/* Main Content - Scrollable */}
          <ScrollArea className="flex-1 min-h-0 cbt-modal-scroll-area">
            <div className="p-6 h-full">
              <div 
                className="mx-auto max-w-4xl space-y-8 min-h-full"
                role="tabpanel"
                id={`cbt-section-${activeSection}`}
                aria-labelledby={`cbt-section-tab-${activeSection}`}
              >
                {/* Crisis Alert */}
                {showCrisisAlert && crisisDetection && (
                  <CrisisAlert
                    crisisResult={crisisDetection}
                    onDismiss={() => setShowCrisisAlert(false)}
                    onAcknowledge={() => {
                      setAnnounceMessage('Crisis resources acknowledged. Thank you for taking care of yourself.');
                    }}
                    className="mb-6"
                  />
                )}
                {sectionTransition ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4">
                      <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">
                        Loading {sections.find(s => s.id === sectionTransition)?.name}...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={sectionContentRef}
                    className={cn(
                      "transition-all duration-300 ease-in-out focus:outline-none",
                      isProcessing && "opacity-50 pointer-events-none"
                    )}
                    tabIndex={-1}
                    aria-live="polite"
                  >
                    {renderCurrentSection()}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <DialogFooter className="border-t p-6">
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
                disabled={!isValid || isProcessing}
                className={cn(
                  "bg-gradient-to-r transition-all duration-200 relative",
                  isValid && !isProcessing
                    ? "from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl" 
                    : "from-muted to-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label={
                  isProcessing ? "Processing diary entry..." :
                  isValid ? "Send diary entry to chat" : "Complete required sections first"
                }
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to Chat
                  </>
                )}
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
        
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center space-y-4 p-8 bg-card rounded-lg border shadow-lg">
              <div className="w-12 h-12 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Processing Your CBT Diary</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Preparing your thoughtful reflection for therapeutic discussion...
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};

export default CBTDiaryModal;