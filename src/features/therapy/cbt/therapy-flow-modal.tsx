"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, FastForward, CheckCircle2, Plus } from "lucide-react";
import { useModernCBTForm } from "./hooks/use-modern-cbt-form";
import { type CBTFormData, type EmotionsData } from "./schemas/cbt-form-schema";
import { type CBTDiarySchemaMode } from "@/types/therapy";

// Flow step types for conversational progression
export type FlowStepType = 
  | 'welcome' 
  | 'date-situation' 
  | 'emotion-discovery' 
  | 'emotion-intensity' 
  | 'thought-capture' 
  | 'thought-analysis'
  | 'belief-exploration' 
  | 'challenge-initiation'
  | 'rational-response'
  | 'schema-modes'
  | 'reflection-optional'
  | 'outcome-emotions'
  | 'session-complete';

export interface FlowStep {
  id: FlowStepType;
  title: string;
  description: string;
  required: boolean;
  component: React.ComponentType<FlowStepProps>;
  validation?: (data: Partial<CBTFormData>) => boolean;
}

export interface FlowStepProps {
  data: Partial<CBTFormData>;
  onDataChange: (updates: Partial<CBTFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  canFastForward: boolean;
}

interface TherapyFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CBTFormData) => void;
  onAutoSave?: (data: CBTFormData) => void;
  initialData?: Partial<CBTFormData>;
}

// Flow step definitions with conversational progression
const FLOW_STEPS: FlowStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your CBT Session',
    description: 'Let\'s work through this together, one step at a time',
    required: true,
    component: WelcomeStep,
    validation: () => true
  },
  {
    id: 'date-situation', 
    title: 'What Happened?',
    description: 'Tell me about the situation that brought you here',
    required: true,
    component: DateSituationStep,
    validation: (data) => !!data.situation && data.situation.length >= 10
  },
  {
    id: 'emotion-discovery',
    title: 'How Did You Feel?', 
    description: 'Let\'s identify the emotions you experienced',
    required: true,
    component: EmotionDiscoveryStep,
    validation: (data): boolean => {
      if (!data.initialEmotions) return false;
      const hasEmotion = Object.entries(data.initialEmotions)
        .some(([key, value]) => key !== 'other' && key !== 'otherIntensity' && (value as number) > 0);
      const hasCustom = Boolean(data.initialEmotions.other && (data.initialEmotions.otherIntensity || 0) > 0);
      return Boolean(hasEmotion || hasCustom);
    }
  },
  {
    id: 'thought-capture',
    title: 'What Thoughts Came Up?',
    description: 'Let\'s capture the thoughts that went through your mind',
    required: true, 
    component: ThoughtCaptureStep,
    validation: (data) => Boolean(data.automaticThoughts && data.automaticThoughts.length > 0 && 
      data.automaticThoughts.some(t => t.thought.trim().length > 0))
  },
  {
    id: 'belief-exploration',
    title: 'Deeper Beliefs',
    description: 'What core beliefs might be at play here?',
    required: true,
    component: BeliefExplorationStep,
    validation: (data) => !!data.coreBeliefText && data.coreBeliefText.length >= 5
  },
  {
    id: 'challenge-initiation', 
    title: 'Let\'s Challenge These Thoughts',
    description: 'Time to examine these thoughts more closely',
    required: true,
    component: ChallengeStep,
    validation: (data) => Boolean(data.challengeQuestions && 
      data.challengeQuestions.some(q => q.answer.trim().length > 0))
  },
  {
    id: 'schema-modes',
    title: 'Schema Modes',
    description: 'Which parts of yourself are most active right now?',
    required: true,
    component: SchemaModesStep,
    validation: (data) => Boolean(data.schemaModes && 
      data.schemaModes.some(mode => mode.selected))
  },
  {
    id: 'reflection-optional',
    title: 'Deeper Reflection',
    description: 'Want to explore patterns from your past? (Optional)',
    required: false,
    component: ReflectionStep,
    validation: () => true
  },
  {
    id: 'outcome-emotions',
    title: 'How Do You Feel Now?',
    description: 'Let\'s see how your emotions have shifted',
    required: true,
    component: OutcomeEmotionsStep,
    validation: (data): boolean => {
      if (!data.finalEmotions) return false;
      const hasEmotion = Object.entries(data.finalEmotions)
        .some(([key, value]) => key !== 'other' && key !== 'otherIntensity' && (value as number) > 0);
      const hasCustom = Boolean(data.finalEmotions.other && (data.finalEmotions.otherIntensity || 0) > 0);
      return Boolean(hasEmotion || hasCustom);
    }
  },
  {
    id: 'session-complete',
    title: 'Session Complete',
    description: 'Great work! Let\'s review your progress',
    required: true,
    component: SessionCompleteStep,
    validation: () => true
  }
];

export function TherapyFlowModal({
  isOpen,
  onClose, 
  onSave,
  onAutoSave,
  initialData
}: TherapyFlowModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    form,
    // actions, // Will be used in Phase 2-3
    state
  } = useModernCBTForm({ 
    autoSaveDelay: 3000,
    onAutoSave 
  });

  // Initialize form data if provided
  useEffect(() => {
    if (initialData && isOpen) {
      // Set initial data in form
      Object.entries(initialData).forEach(([key, value]) => {
        form.setValue(key as keyof CBTFormData, value);
      });
    }
  }, [initialData, isOpen, form]);

  const currentStep = FLOW_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === FLOW_STEPS.length - 1;
  const canGoBack = currentStepIndex > 0;
  const formData = form.getValues();

  // Progress calculation
  const totalSteps = FLOW_STEPS.length;
  const requiredSteps = FLOW_STEPS.filter(step => step.required).length;
  const completedRequiredSteps = Array.from(completedSteps).filter(index => 
    FLOW_STEPS[index].required
  ).length;
  const overallProgress = Math.round((completedRequiredSteps / requiredSteps) * 100);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const finalData = form.getValues() as CBTFormData;
      await onSave(finalData);
      onClose();
    } catch (error) {
      console.error('CBT flow submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSave, onClose]);

  const handleNext = useCallback(() => {
    // Validate current step if required
    if (currentStep.required && currentStep.validation) {
      const isValid = currentStep.validation(formData);
      if (!isValid) {
        // Show validation error - will be enhanced in Phase 4
        return;
      }
    }

    // Mark step as completed
    setCompletedSteps(prev => new Set([...Array.from(prev), currentStepIndex]));

    if (isLastStep) {
      // Submit the form
      handleSubmit();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, currentStep, formData, isLastStep, handleSubmit]);

  const handleBack = useCallback(() => {
    if (canGoBack) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [canGoBack]);

  const handleFastForward = useCallback(() => {
    if (!currentStep.required) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep.required]);

  const handleDataChange = useCallback((updates: Partial<CBTFormData>) => {
    Object.entries(updates).forEach(([key, value]) => {
      form.setValue(key as keyof CBTFormData, value);
    });
  }, [form]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50">
      <div className="absolute inset-0 flex flex-col">
        {/* Progress Header */}
        <div className="flex-none bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">CBT Therapy Session</h2>
                <Badge variant="secondary" className="text-sm">
                  Step {currentStepIndex + 1} of {totalSteps}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            {/* Progress Visualization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="text-muted-foreground">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="w-full h-2" />
              
              {/* Step Indicators */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {FLOW_STEPS.map((step, index) => {
                  const isCompleted = completedSteps.has(index);
                  const isCurrent = index === currentStepIndex;
                  const isPast = index < currentStepIndex;
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
                        isCurrent 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : isCompleted || isPast
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        isCompleted 
                          ? 'bg-green-500' 
                          : isCurrent 
                          ? 'bg-white animate-pulse' 
                          : 'bg-current opacity-50'
                      }`} />
                      <span className="whitespace-nowrap">{step.title}</span>
                      {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-4xl mx-auto px-6 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="h-full"
              >
                <Card className="h-full p-8 shadow-lg border-0 bg-card/80 backdrop-blur-sm">
                  <div className="h-full flex flex-col">
                    {/* Step Header */}
                    <div className="flex-none mb-8">
                      <h3 className="text-3xl font-semibold mb-2">{currentStep.title}</h3>
                      <p className="text-muted-foreground text-lg">{currentStep.description}</p>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 overflow-auto">
                      <currentStep.component
                        data={formData}
                        onDataChange={handleDataChange}
                        onNext={handleNext}
                        onBack={handleBack}
                        canFastForward={!currentStep.required}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex-none bg-background/95 backdrop-blur-sm border-t">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={!canGoBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                {!currentStep.required && (
                  <Button
                    variant="ghost"
                    onClick={handleFastForward}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <FastForward className="w-4 h-4" />
                    FastForward Optional
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {state.isDirty && (
                  <Badge variant="secondary" className="text-xs">
                    Auto-saving...
                  </Badge>
                )}

                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 min-w-[120px]"
                  size="lg"
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isSubmitting ? 'Saving...' : 'Complete Session'}
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// STEP COMPONENTS (Basic Implementation)
// ========================================

function WelcomeStep({ onNext }: FlowStepProps) {
  return (
    <div className="text-center space-y-6 py-12">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
        <span className="text-3xl">🧠</span>
      </div>
      <div className="space-y-4">
        <h4 className="text-2xl font-medium">Welcome to Your CBT Session</h4>
        <p className="text-muted-foreground max-w-2xl">
          I&apos;m here to guide you through a structured reflection on your thoughts and feelings. 
          We&apos;ll take this one step at a time, and you can always go back to modify your responses.
        </p>
        <p className="text-sm text-muted-foreground">
          This usually takes 10-15 minutes. Are you ready to begin?
        </p>
      </div>
      <Button onClick={onNext} size="lg" className="mt-8">
        Let&apos;s Start
      </Button>
    </div>
  );
}

function DateSituationStep({ data, onDataChange, onNext }: FlowStepProps) {
  const [situation, setSituation] = useState(data.situation || '');
  const [date, setDate] = useState(data.date || new Date().toISOString().split('T')[0]);

  const handleContinue = () => {
    onDataChange({ date, situation });
    onNext();
  };

  const isValid = situation.trim().length >= 10;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-base font-medium">When did this happen?</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-lg p-4 h-14"
          />
        </div>

        <div className="space-y-3">
          <label className="text-base font-medium">What happened? Describe the situation:</label>
          <p className="text-sm text-muted-foreground">
            Try to be objective, like a camera recording the scene. Include who was there, what was said or done, and the key details.
          </p>
          <Textarea
            placeholder="I was in a meeting with my boss when they said..."
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            className="min-h-[200px] text-base p-4 resize-none"
          />
          <div className="flex justify-between items-center text-sm">
            <span className={situation.length < 10 ? 'text-destructive' : 'text-muted-foreground'}>
              {situation.length < 10 ? `Need ${10 - situation.length} more characters` : 'Good detail!'}
            </span>
            <span className="text-muted-foreground">{situation.length} characters</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleContinue}
        disabled={!isValid}
        size="lg"
        className="w-full h-14 text-base"
      >
        Continue to Emotions →
      </Button>
    </div>
  );
}

function EmotionDiscoveryStep({ data, onDataChange, onNext }: FlowStepProps) {
  const [emotions, setEmotions] = useState(data.initialEmotions || {
    fear: 0, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0,
    other: '', otherIntensity: 0
  });

  const emotionConfig = [
    { key: 'anxiety', label: 'Anxious/Worried', color: 'from-yellow-500 to-orange-500', emoji: '😰' },
    { key: 'anger', label: 'Angry/Frustrated', color: 'from-red-500 to-pink-500', emoji: '😠' },
    { key: 'sadness', label: 'Sad/Down', color: 'from-blue-500 to-indigo-500', emoji: '😢' },
    { key: 'fear', label: 'Scared/Afraid', color: 'from-purple-500 to-violet-500', emoji: '😨' },
    { key: 'shame', label: 'Ashamed/Embarrassed', color: 'from-gray-500 to-slate-500', emoji: '😳' },
    { key: 'guilt', label: 'Guilty/Regretful', color: 'from-amber-500 to-yellow-500', emoji: '😔' },
    { key: 'joy', label: 'Happy/Content', color: 'from-green-500 to-emerald-500', emoji: '😊' }
  ];

  const handleEmotionChange = (emotion: string, value: number) => {
    const newEmotions = { ...emotions, [emotion]: value };
    setEmotions(newEmotions);
  };

  const handleCustomEmotion = (field: 'other' | 'otherIntensity', value: string | number) => {
    const newEmotions = { ...emotions, [field]: value };
    setEmotions(newEmotions);
  };

  const handleContinue = () => {
    onDataChange({ initialEmotions: emotions });
    onNext();
  };

  const hasValidEmotion = emotions ? (
    Object.entries(emotions)
      .some(([key, value]) => key !== 'other' && key !== 'otherIntensity' && (value as number) > 0) ||
    (emotions.other && (emotions.otherIntensity || 0) > 0)
  ) : false;

  const primaryEmotions = emotionConfig.filter(e => {
    if (!emotions) return false;
    const value = (emotions as EmotionsData)[e.key as keyof EmotionsData];
    return typeof value === 'number' && value > 0;
  });
  const maxEmotion = emotionConfig.reduce((max, curr) => {
    if (!emotions) return max;
    const currValue = (emotions as EmotionsData)[curr.key as keyof EmotionsData];
    const maxValue = (emotions as EmotionsData)[max.key as keyof EmotionsData];
    const currNum = typeof currValue === 'number' ? currValue : 0;
    const maxNum = typeof maxValue === 'number' ? maxValue : 0;
    return currNum > maxNum ? curr : max;
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="text-6xl">
          {primaryEmotions.length > 0 ? primaryEmotions.map(e => e.emoji).join('') : '🤔'}
        </div>
        <div className="space-y-2">
          {hasValidEmotion && (
            <p className="text-lg text-muted-foreground">
              It sounds like <span className="font-medium text-foreground">{maxEmotion.label.toLowerCase()}</span> was your strongest feeling.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {emotionConfig.map((emotion) => {
          const rawValue = emotions ? (emotions as EmotionsData)[emotion.key as keyof EmotionsData] : 0;
          const value = typeof rawValue === 'number' ? rawValue : 0;
          return (
            <Card key={emotion.key} className="p-6 transition-all hover:shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${emotion.color} flex items-center justify-center text-2xl`}>
                    {emotion.emoji}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{emotion.label}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Not at all</span>
                      <span className="text-lg font-semibold">{value}/10</span>
                      <span className="text-sm text-muted-foreground">Extremely</span>
                    </div>
                  </div>
                </div>
                
                <Slider
                  value={[value]}
                  onValueChange={(values) => handleEmotionChange(emotion.key, values[0])}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Custom Emotion */}
      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="font-medium">Other emotion not listed above?</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="e.g., Overwhelmed, Confused, Hopeful..."
                value={emotions.other || ''}
                onChange={(e) => handleCustomEmotion('other', e.target.value)}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Intensity</span>
                <span className="font-medium">{emotions.otherIntensity || 0}/10</span>
              </div>
              <Slider
                value={[emotions.otherIntensity || 0]}
                onValueChange={(values) => handleCustomEmotion('otherIntensity', values[0])}
                max={10}
                step={1}
                disabled={!emotions.other}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      <Button 
        onClick={handleContinue}
        disabled={!hasValidEmotion}
        size="lg"
        className="w-full h-14 text-base"
      >
        Continue to Thoughts →
      </Button>
    </div>
  );
}

function ThoughtCaptureStep({ data, onDataChange, onNext }: FlowStepProps) {
  const [thoughts, setThoughts] = useState<Array<{thought: string, credibility: number}>>(
    data.automaticThoughts || [{ thought: '', credibility: 5 }]
  );

  const handleThoughtChange = (index: number, field: 'thought' | 'credibility', value: string | number) => {
    const newThoughts = [...thoughts];
    newThoughts[index] = { ...newThoughts[index], [field]: value };
    setThoughts(newThoughts);
  };

  const addThought = () => {
    setThoughts([...thoughts, { thought: '', credibility: 5 }]);
  };

  const removeThought = (index: number) => {
    if (thoughts.length > 1) {
      setThoughts(thoughts.filter((_, i) => i !== index));
    }
  };

  const handleContinue = () => {
    onDataChange({ automaticThoughts: thoughts });
    onNext();
  };

  const hasValidThoughts = thoughts.some(t => t.thought.trim().length > 0);
  const completedThoughts = thoughts.filter(t => t.thought.trim().length > 0);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="text-6xl">💭</div>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            What thoughts went through your mind in that moment? Let&apos;s capture them one by one.
          </p>
          {completedThoughts.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {completedThoughts.length} thought{completedThoughts.length !== 1 ? 's' : ''} captured so far
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {thoughts.map((thought, index) => (
          <Card key={index} className="p-6 transition-all hover:shadow-lg">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-lg">Thought #{index + 1}</h4>
                {thoughts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeThought(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What exactly went through your mind?
                  </label>
                  <Textarea
                    placeholder="I'm going to mess this up..." 
                    value={thought.thought}
                    onChange={(e) => handleThoughtChange(index, 'thought', e.target.value)}
                    className="min-h-[100px] text-base resize-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      How much did you believe this thought? (0 = not at all, 10 = completely)
                    </label>
                    <span className="text-lg font-semibold">{thought.credibility}/10</span>
                  </div>
                  <Slider
                    value={[thought.credibility]}
                    onValueChange={(values) => handleThoughtChange(index, 'credibility', values[0])}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>&quot;I don&apos;t believe this at all&quot;</span>
                    <span>&quot;This is absolutely true&quot;</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={addThought}
          className="flex-1 h-12 text-base border-dashed"
          disabled={thoughts.length >= 5}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Thought
        </Button>
      </div>

      <Button 
        onClick={handleContinue}
        disabled={!hasValidThoughts}
        size="lg"
        className="w-full h-14 text-base"
      >
        Explore Core Beliefs →
      </Button>
    </div>
  );
}

function BeliefExplorationStep({ data, onDataChange, onNext }: FlowStepProps) {
  const [coreBeliefText, setCoreBeliefText] = useState(data.coreBeliefText || '');
  const [coreBeliefCredibility, setCoreBeliefCredibility] = useState(data.coreBeliefCredibility || 5);
  const [behaviors, setBehaviors] = useState({
    confirming: data.confirmingBehaviors || '',
    avoidant: data.avoidantBehaviors || '',
    overriding: data.overridingBehaviors || ''
  });

  const handleContinue = () => {
    onDataChange({ 
      coreBeliefText,
      coreBeliefCredibility,
      confirmingBehaviors: behaviors.confirming,
      avoidantBehaviors: behaviors.avoidant,
      overridingBehaviors: behaviors.overriding
    });
    onNext();
  };

  const isValid = coreBeliefText.trim().length >= 5;

  const beliefPrompts = [
    "I am...",
    "Others are...", 
    "The world is...",
    "I must...",
    "If I don't... then..."
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="text-6xl">🧠</div>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Let&apos;s explore the deeper beliefs that might be driving these thoughts.
          </p>
          <p className="text-sm text-muted-foreground">
            What core belief about yourself, others, or the world feels most relevant here?
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-base font-medium">Core Belief</label>
            <p className="text-sm text-muted-foreground">
              What fundamental belief feels activated? Try starting with: {beliefPrompts.join(', ')}
            </p>
            <Textarea
              placeholder="I am not good enough..."
              value={coreBeliefText}
              onChange={(e) => setCoreBeliefText(e.target.value)}
              className="min-h-[120px] text-base resize-none"
            />
            <div className="text-right text-sm text-muted-foreground">
              {coreBeliefText.length < 5 ? `Need ${5 - coreBeliefText.length} more characters` : '✓ Good'}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-base font-medium">
                How strongly do you believe this right now?
              </label>
              <span className="text-lg font-semibold">{coreBeliefCredibility}/10</span>
            </div>
            <Slider
              value={[coreBeliefCredibility]}
              onValueChange={(values) => setCoreBeliefCredibility(values[0])}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>&quot;I don&apos;t believe this&quot;</span>
              <span>&quot;This feels completely true&quot;</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Confirming Behaviors</h4>
            <p className="text-xs text-muted-foreground">What do you do that reinforces this belief?</p>
            <Textarea
              placeholder="I avoid speaking up..."
              value={behaviors.confirming}
              onChange={(e) => setBehaviors({...behaviors, confirming: e.target.value})}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Avoidant Behaviors</h4>
            <p className="text-xs text-muted-foreground">What do you avoid because of this belief?</p>
            <Textarea
              placeholder="I don't try new things..."
              value={behaviors.avoidant}
              onChange={(e) => setBehaviors({...behaviors, avoidant: e.target.value})}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Overcompensating Behaviors</h4>
            <p className="text-xs text-muted-foreground">Do you overdo anything to fight this belief?</p>
            <Textarea
              placeholder="I work excessively to prove myself..."
              value={behaviors.overriding}
              onChange={(e) => setBehaviors({...behaviors, overriding: e.target.value})}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </Card>
      </div>


      <Button 
        onClick={handleContinue}
        disabled={!isValid}
        size="lg"
        className="w-full h-14 text-base"
      >
        Continue to Challenge Thoughts →
      </Button>
    </div>
  );
}

function ChallengeStep({ data, onDataChange, onNext }: FlowStepProps) {
  const defaultQuestions = [
    { question: "What evidence supports this belief?", answer: "" },
    { question: "What evidence contradicts this belief?", answer: "" },
    { question: "What would you tell a friend who had this belief?", answer: "" },
    { question: "Is this belief helpful or harmful to you?", answer: "" },
    { question: "What would be a more balanced way to think about this?", answer: "" },
    { question: "What does it say about me that I have this thought?", answer: "" },
    { question: "Are thoughts the same as actions?", answer: "" },
    { question: "Can I influence the future with my thoughts alone?", answer: "" },
    { question: "What is the effect of this thought on my life?", answer: "" },
    { question: "Is this thought in line with my values?", answer: "" }
  ];

  const [questions, setQuestions] = useState(
    data.challengeQuestions && data.challengeQuestions.length > 0 
      ? data.challengeQuestions 
      : defaultQuestions
  );
  const [rationalThoughts, setRationalThoughts] = useState<Array<{thought: string, confidence: number}>>(
    data.rationalThoughts || [{ thought: '', confidence: 5 }]
  );

  const handleQuestionChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleRationalChange = (index: number, field: 'thought' | 'confidence', value: string | number) => {
    const newRationals = [...rationalThoughts];
    newRationals[index] = { ...newRationals[index], [field]: value };
    setRationalThoughts(newRationals);
  };

  const addRationalThought = () => {
    setRationalThoughts([...rationalThoughts, { thought: '', confidence: 5 }]);
  };

  const removeRationalThought = (index: number) => {
    if (rationalThoughts.length > 1) {
      setRationalThoughts(rationalThoughts.filter((_, i) => i !== index));
    }
  };

  const handleContinue = () => {
    onDataChange({ 
      challengeQuestions: questions,
      rationalThoughts,
      additionalQuestions: []
    });
    onNext();
  };

  const hasAnswers = questions.some(q => q.answer.trim().length > 0);
  const answeredCount = questions.filter(q => q.answer.trim().length > 0).length;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Let&apos;s examine your thoughts and beliefs more closely. Take your time with each question.
          </p>
          {answeredCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {answeredCount} of {questions.length} questions answered
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            💡 You can answer as many or as few as feel helpful right now
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-1">{index + 1}</Badge>
                <div className="flex-1 space-y-3">
                  <h4 className="font-medium text-base">{q.question}</h4>
                  <Textarea
                    placeholder="Take your time to reflect..."
                    value={q.answer}
                    onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                    className="min-h-[100px] text-base resize-none"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <h4 className="text-xl font-semibold mb-2">Alternative Thoughts</h4>
          <p className="text-muted-foreground">
            Based on your reflections, what are some more balanced or helpful ways to think about this?
          </p>
        </div>

        {rationalThoughts.map((rational, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h4 className="font-medium">Alternative Thought #{index + 1}</h4>
                {rationalThoughts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRationalThought(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              <Textarea
                placeholder="A more balanced way to think about this is..."
                value={rational.thought}
                onChange={(e) => handleRationalChange(index, 'thought', e.target.value)}
                className="min-h-[80px] text-base resize-none"
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">How confident do you feel about this alternative?</span>
                  <span className="text-lg font-semibold">{rational.confidence}/10</span>
                </div>
                <Slider
                  value={[rational.confidence]}
                  onValueChange={(values) => handleRationalChange(index, 'confidence', values[0])}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addRationalThought}
          className="w-full h-12 text-base border-dashed"
          disabled={rationalThoughts.length >= 5}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Alternative Thought
        </Button>
      </div>

      <Button 
        onClick={handleContinue}
        disabled={!hasAnswers}
        size="lg"
        className="w-full h-14 text-base"
      >
        Continue to Schema Modes →
      </Button>
    </div>
  );
}

function ReflectionStep({ data, onDataChange, onNext }: FlowStepProps) {
  const [enabled, setEnabled] = useState(data.schemaReflection?.enabled || false);
  const [selfAssessment, setSelfAssessment] = useState(data.schemaReflection?.selfAssessment || '');
  const [reflectionQuestions, setReflectionQuestions] = useState(
    data.schemaReflection?.questions || [
      { question: "Does this situation remind you of anything from your childhood?", answer: "", category: "childhood" as const, isRequired: false },
      { question: "What messages did you receive growing up about situations like this?", answer: "", category: "childhood" as const, isRequired: false },
      { question: "When have you felt this way before in your life?", answer: "", category: "schemas" as const, isRequired: false },
      { question: "What patterns do you notice in how you respond to stress?", answer: "", category: "coping" as const, isRequired: false },
      { question: "Which 'part' of you is most active right now?", answer: "", category: "modes" as const, isRequired: false },
      { question: "What would your healthiest, most balanced self do?", answer: "", category: "modes" as const, isRequired: false }
    ]
  );
  
  const reflectionPrompts = [
    {
      category: 'childhood',
      title: 'Childhood Connections',
      questions: [
        "Does this situation remind you of anything from your childhood?",
        "What messages did you receive growing up about situations like this?",
        "How did your family handle similar challenges?"
      ]
    },
    {
      category: 'patterns', 
      title: 'Life Patterns',
      questions: [
        "When have you felt this way before in your life?",
        "What patterns do you notice in how you respond to stress?",
        "Are there themes that keep showing up for you?"
      ]
    },
    {
      category: 'values',
      title: 'Values & Growth',
      questions: [
        "What would your wisest, most compassionate self say about this?",
        "How might this challenge help you grow?",
        "What values do you want to honor in how you respond?"
      ]
    }
  ];

  const handleQuestionChange = (index: number, answer: string) => {
    const newQuestions = [...reflectionQuestions];
    newQuestions[index] = { ...newQuestions[index], answer };
    setReflectionQuestions(newQuestions);
  };

  const handleContinue = () => {
    onDataChange({ 
      schemaReflection: {
        enabled,
        selfAssessment,
        questions: reflectionQuestions
      }
    });
    onNext();
  };

  if (!enabled) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto text-center">
        <div className="space-y-4">
          <div className="text-6xl">🪞</div>
          <div className="space-y-2">
            <h4 className="text-2xl font-semibold">Deeper Reflection (Optional)</h4>
            <p className="text-lg text-muted-foreground">
              Would you like to explore deeper patterns and connections? This can provide valuable insights.
            </p>
            <p className="text-sm text-muted-foreground">
              This section is optional and will add a few minutes to your session.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => onNext()}
            size="lg"
            className="min-w-[140px]"
          >
            FastForward for Now
          </Button>
          <Button
            onClick={() => setEnabled(true)}
            size="lg"
            className="min-w-[140px]"
          >
            Let&apos;s Explore
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="text-6xl">🪞</div>
        <div className="space-y-2">
          <h4 className="text-2xl font-semibold">Deeper Reflection</h4>
          <p className="text-lg text-muted-foreground">
            Let&apos;s explore deeper patterns and insights about this experience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reflectionPrompts.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="p-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">{section.title}</h4>
              <div className="space-y-3">
                {section.questions.map((question, qIndex) => (
                  <div key={qIndex} className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-3">
                    {question}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Individual Questions */}
      <div className="space-y-4">
        {reflectionQuestions.map((q, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-1 text-xs">{q.category}</Badge>
                <h5 className="font-medium text-sm flex-1">{q.question}</h5>
              </div>
              <Textarea
                placeholder="Take your time to reflect..."
                value={q.answer}
                onChange={(e) => handleQuestionChange(index, e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Overall Reflection</h4>
          <p className="text-sm text-muted-foreground">
            What overall insights or connections do you notice across these reflections?
          </p>
          <Textarea
            placeholder="I notice patterns of... This connects to... I realize that... Looking at this more deeply..."
            value={selfAssessment}
            onChange={(e) => setSelfAssessment(e.target.value)}
            className="min-h-[120px] text-base resize-none"
          />
        </div>
      </Card>

      <Button 
        onClick={handleContinue}
        size="lg"
        className="w-full h-14 text-base"
      >
        Continue to Final Check-in →
      </Button>
    </div>
  );
}

function OutcomeEmotionsStep({ data, onDataChange, onNext }: FlowStepProps) {
  const [finalEmotions, setFinalEmotions] = useState(data.finalEmotions || {
    fear: 0, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0,
    other: '', otherIntensity: 0
  });
  const [newBehaviors, setNewBehaviors] = useState(data.newBehaviors || '');
  const [alternativeResponses, setAlternativeResponses] = useState(
    data.alternativeResponses || [{ response: '' }]
  );

  const initialEmotions = data.initialEmotions || {};
  
  const emotionConfig = [
    { key: 'anxiety', label: 'Anxious/Worried', color: 'from-yellow-500 to-orange-500', emoji: '😰' },
    { key: 'anger', label: 'Angry/Frustrated', color: 'from-red-500 to-pink-500', emoji: '😠' },
    { key: 'sadness', label: 'Sad/Down', color: 'from-blue-500 to-indigo-500', emoji: '😢' },
    { key: 'fear', label: 'Scared/Afraid', color: 'from-purple-500 to-violet-500', emoji: '😨' },
    { key: 'shame', label: 'Ashamed/Embarrassed', color: 'from-gray-500 to-slate-500', emoji: '😳' },
    { key: 'guilt', label: 'Guilty/Regretful', color: 'from-amber-500 to-yellow-500', emoji: '😔' },
    { key: 'joy', label: 'Happy/Content', color: 'from-green-500 to-emerald-500', emoji: '😊' }
  ];

  const handleEmotionChange = (emotion: string, value: number) => {
    const newEmotions = { ...finalEmotions, [emotion]: value };
    setFinalEmotions(newEmotions);
  };

  const handleResponseChange = (index: number, value: string) => {
    const newResponses = [...alternativeResponses];
    newResponses[index] = { response: value };
    setAlternativeResponses(newResponses);
  };

  const addResponse = () => {
    setAlternativeResponses([...alternativeResponses, { response: '' }]);
  };

  const removeResponse = (index: number) => {
    if (alternativeResponses.length > 1) {
      setAlternativeResponses(alternativeResponses.filter((_, i) => i !== index));
    }
  };

  const handleContinue = () => {
    onDataChange({ 
      finalEmotions,
      newBehaviors,
      alternativeResponses,
      originalThoughtCredibility: 0 // Will be calculated from thoughts
    });
    onNext();
  };

  const hasValidEmotions = Object.entries(finalEmotions)
    .some(([key, value]) => key !== 'other' && key !== 'otherIntensity' && (value as number) > 0) ||
    (finalEmotions.other && (finalEmotions.otherIntensity || 0) > 0);

  // Calculate emotion changes
  const emotionChanges = emotionConfig.map(emotion => {
    const initialValue = initialEmotions ? (initialEmotions as EmotionsData)[emotion.key as keyof EmotionsData] : 0;
    const finalValue = finalEmotions ? (finalEmotions as EmotionsData)[emotion.key as keyof EmotionsData] : 0;
    const initial = typeof initialValue === 'number' ? initialValue : 0;
    const final = typeof finalValue === 'number' ? finalValue : 0;
    const change = final - initial;
    return { ...emotion, initial, final, change };
  }).filter(e => e.initial > 0 || e.final > 0);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="text-6xl">✨</div>
        <div className="space-y-2">
          <h4 className="text-2xl font-semibold">How Are You Feeling Now?</h4>
          <p className="text-lg text-muted-foreground">
            After working through this process, let&apos;s check in with your current emotional state.
          </p>
        </div>
      </div>

      {/* Emotion Comparison */}
      {emotionChanges.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Emotional Changes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emotionChanges.map((emotion) => (
              <div key={emotion.key} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emotion.emoji}</span>
                  <span className="font-medium">{emotion.label}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={emotion.change < 0 ? 'text-green-600' : emotion.change > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                    {emotion.initial} → {emotion.final}
                    {emotion.change !== 0 && (
                      <span className="ml-1">({emotion.change > 0 ? '+' : ''}{emotion.change})</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Current Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emotionConfig.map((emotion) => {
          const rawValue = finalEmotions ? (finalEmotions as EmotionsData)[emotion.key as keyof EmotionsData] : 0;
          const value = typeof rawValue === 'number' ? rawValue : 0;
          return (
            <Card key={emotion.key} className="p-4 transition-all hover:shadow-md">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${emotion.color} flex items-center justify-center text-lg`}>
                    {emotion.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{emotion.label}</span>
                      <span className="font-semibold">{value}/10</span>
                    </div>
                  </div>
                </div>
                
                <Slider
                  value={[value]}
                  onValueChange={(values) => handleEmotionChange(emotion.key, values[0])}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Future Behaviors */}
      <Card className="p-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Moving Forward</h4>
          <div className="space-y-3">
            <label className="text-sm font-medium">
              What behaviors or responses might you try differently in the future?
            </label>
            <Textarea
              placeholder="Next time I'll try to... I want to remember to... I could..."
              value={newBehaviors}
              onChange={(e) => setNewBehaviors(e.target.value)}
              className="min-h-[100px] text-base resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Alternative Responses */}
      <div className="space-y-4">
        <h4 className="font-semibold">Alternative Responses for Next Time</h4>
        {alternativeResponses.map((response, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">{index + 1}</Badge>
              <div className="flex-1">
                <Textarea
                  placeholder="Instead of... I could..."
                  value={response.response}
                  onChange={(e) => handleResponseChange(index, e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
              {alternativeResponses.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResponse(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          </Card>
        ))}
        
        <Button
          variant="outline"
          onClick={addResponse}
          className="w-full h-10 border-dashed"
          disabled={alternativeResponses.length >= 5}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Response
        </Button>
      </div>

      <Button 
        onClick={handleContinue}
        disabled={!hasValidEmotions}
        size="lg"
        className="w-full h-14 text-base"
      >
        Complete Session →
      </Button>
    </div>
  );
}

function SessionCompleteStep({ data }: FlowStepProps) {
  const completedSections = [
    data.situation ? 'Situation explored' : null,
    data.initialEmotions ? 'Initial emotions identified' : null,
    data.automaticThoughts?.length ? `${data.automaticThoughts.length} thoughts captured` : null,
    data.coreBeliefText ? 'Core belief examined' : null,
    data.challengeQuestions?.some(q => q.answer) ? 'Thoughts challenged' : null,
    data.schemaReflection?.enabled ? 'Deep reflection completed' : null,
    data.finalEmotions ? 'Final emotions recorded' : null
  ].filter(Boolean);

  const insights = [];
  
  // Emotion change insight
  if (data.initialEmotions && data.finalEmotions) {
    const emotions = ['anxiety', 'anger', 'sadness', 'fear', 'shame', 'guilt'];
    const changes = emotions.map(e => {
      const initialValue = data.initialEmotions ? (data.initialEmotions as EmotionsData)[e as keyof EmotionsData] : 0;
      const finalValue = data.finalEmotions ? (data.finalEmotions as EmotionsData)[e as keyof EmotionsData] : 0;
      const initial = typeof initialValue === 'number' ? initialValue : 0;
      const final = typeof finalValue === 'number' ? finalValue : 0;
      return { emotion: e, change: final - initial };
    }).filter(c => Math.abs(c.change) >= 2);
    
    if (changes.length > 0) {
      const improved = changes.filter(c => c.change < 0);
      const worsened = changes.filter(c => c.change > 0);
      
      if (improved.length > 0) {
        insights.push(`✅ Your ${improved.map(c => c.emotion).join(', ')} decreased during this session`);
      }
      if (worsened.length > 0) {
        insights.push(`⚠️ Your ${worsened.map(c => c.emotion).join(', ')} increased - this is normal as you process difficult feelings`);
      }
    }
  }

  // Thought insight
  if (data.automaticThoughts?.length) {
    const avgCredibility = data.automaticThoughts.reduce((sum, t) => sum + t.credibility, 0) / data.automaticThoughts.length;
    if (avgCredibility > 7) {
      insights.push('🧠 You had strong belief in your automatic thoughts - great awareness!');
    } else if (avgCredibility < 4) {
      insights.push('✨ You showed good distance from your automatic thoughts');
    }
  }

  // Challenge insight
  if (data.challengeQuestions && data.challengeQuestions.filter(q => q.answer.trim().length > 0).length >= 3) {
    insights.push('🔍 You engaged deeply with challenging your thoughts - excellent work!');
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-6">
        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
          <CheckCircle2 className="w-16 h-16 text-white" />
        </div>
        <div className="space-y-4">
          <h4 className="text-3xl font-semibold">Session Complete! 🎉</h4>
          <p className="text-xl text-muted-foreground">
            You&apos;ve done meaningful work processing your thoughts and emotions.
          </p>
        </div>
      </div>

      {/* Session Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">✅</span>
            What You Accomplished
          </h4>
          <div className="space-y-2">
            {completedSections.map((section, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>{section}</span>
              </div>
            ))}
          </div>
        </Card>

        {insights.length > 0 && (
          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-lg">💡</span>
              Key Insights
            </h4>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="text-sm p-3 rounded-lg bg-accent/50">
                  {insight}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Next Steps */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">🚀</span>
          What&apos;s Next?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium">Practice</div>
            <div className="text-muted-foreground">Use your alternative thoughts when similar situations arise</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Reflect</div>
            <div className="text-muted-foreground">Review this session and notice patterns over time</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Continue</div>
            <div className="text-muted-foreground">Regular CBT practice builds resilience and insight</div>
          </div>
        </div>
      </Card>

      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          Your session has been saved and you can share it with your therapist or review it anytime.
        </p>
        <div className="text-xs text-muted-foreground">
          Remember: Healing is a process, not a destination. You&apos;re doing great. 💚
        </div>
      </div>
    </div>
  );
}

function SchemaModesStep({ data, onDataChange, onNext }: FlowStepProps) {
  const [schemaModes, setSchemaModes] = useState(() => {
    const defaultModes = [
      { id: 'vulnerable-child', name: 'The Vulnerable Child', description: 'scared, helpless, needy', selected: false, intensity: 5 },
      { id: 'angry-child', name: 'The Angry Child', description: 'frustrated, defiant, rebellious', selected: false, intensity: 5 },
      { id: 'punishing-parent', name: 'The Punishing Parent', description: 'critical, harsh, demanding', selected: false, intensity: 5 },
      { id: 'demanding-parent', name: 'The Demanding Parent', description: 'controlling, entitled, impatient', selected: false, intensity: 5 },
      { id: 'detached-self-soother', name: 'The Detached Self-Soother', description: 'withdrawn, disconnected, avoiding', selected: false, intensity: 5 },
      { id: 'healthy-adult', name: 'The Healthy Adult', description: 'balanced, rational, caring', selected: false, intensity: 5 }
    ];
    
    // If data.schemaModes exists, merge with defaults ensuring intensity is included
    if (data.schemaModes) {
      return data.schemaModes.map(mode => ({
        ...mode,
        intensity: (mode as CBTDiarySchemaMode).intensity || 5 // Ensure intensity exists
      }));
    }
    
    return defaultModes;
  });

  const handleModeToggle = (id: string) => {
    setSchemaModes(prev => prev.map(mode => 
      mode.id === id ? { ...mode, selected: !mode.selected } : mode
    ));
  };

  const handleIntensityChange = (id: string, intensity: number) => {
    setSchemaModes(prev => prev.map(mode => 
      mode.id === id ? { ...mode, intensity } : mode
    ));
  };

  const handleContinue = () => {
    onDataChange({ schemaModes });
    onNext();
  };

  const selectedModes = schemaModes.filter(mode => mode.selected);
  const isValid = selectedModes.length > 0;

  // Schema mode colors for visual differentiation
  const getModeColor = (modeId: string) => {
    switch (modeId) {
      case 'vulnerable-child': return 'from-blue-400 to-blue-600';
      case 'angry-child': return 'from-red-400 to-red-600';
      case 'punishing-parent': return 'from-purple-400 to-purple-600';
      case 'demanding-parent': return 'from-orange-400 to-orange-600';
      case 'detached-self-soother': return 'from-gray-400 to-gray-600';
      case 'healthy-adult': return 'from-green-400 to-green-600';
      default: return 'from-muted to-muted';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="text-center space-y-4">
        <div className="text-6xl">👥</div>
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Schema modes are different &ldquo;parts&rdquo; of ourselves that become active in various situations.
          </p>
          <p className="text-sm text-muted-foreground">
            Which modes feel most present for you in this situation? Select any that resonate.
          </p>
          {selectedModes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedModes.length} mode{selectedModes.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </div>

      {/* Information Card */}
      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">
          <strong>Schema modes</strong> represent different emotional states or behavioral patterns. 
          There&apos;s no right or wrong answer - simply notice which parts of yourself feel most active right now.
        </p>
      </Card>

      {/* Schema Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemaModes.map((mode) => {
          const isSelected = mode.selected;
          
          return (
            <Card 
              key={mode.id} 
              className={`p-6 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                isSelected 
                  ? "ring-2 ring-primary bg-primary/5 border-primary/30 shadow-md" 
                  : "hover:border-primary/20"
              }`}
              onClick={() => handleModeToggle(mode.id)}
            >
              <div className="space-y-4">
                {/* Mode Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getModeColor(mode.id)} flex items-center justify-center text-white font-semibold text-sm`}>
                      {mode.name.split(' ').map(word => word[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-base text-foreground">{mode.name}</h4>
                      <p className="text-sm text-muted-foreground italic">{mode.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                </div>
                
                {/* Intensity Slider (only shown when selected) */}
                {isSelected && (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-foreground">Intensity</label>
                      <span className="text-sm text-muted-foreground font-mono">{mode.intensity || 5}/10</span>
                    </div>
                    <Slider
                      value={[mode.intensity || 5]}
                      onValueChange={(values) => handleIntensityChange(mode.id, values[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 - Mild</span>
                      <span>5 - Moderate</span>
                      <span>10 - Intense</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Modes Summary */}
      {selectedModes.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <h4 className="text-base font-medium text-primary mb-3">Active Schema Modes:</h4>
          <div className="space-y-2">
            {selectedModes.map((mode) => (
              <div key={mode.id} className="flex justify-between items-center text-sm">
                <span className="text-foreground font-medium">{mode.name}</span>
                <span className="text-muted-foreground">Intensity: {mode.intensity || 5}/10</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Button 
        onClick={handleContinue}
        disabled={!isValid}
        size="lg"
        className="w-full h-14 text-base"
      >
        {selectedModes.length > 0 
          ? `Continue with ${selectedModes.length} active mode${selectedModes.length !== 1 ? 's' : ''} →` 
          : "Continue to Reflection →"}
      </Button>

      {!isValid && (
        <p className="text-sm text-muted-foreground text-center">
          Select at least one schema mode to continue
        </p>
      )}
    </div>
  );
}