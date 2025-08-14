'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Brain, Plus, Minus, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { loadCBTDraft, useDraftSaver, CBT_DRAFT_KEYS, clearCBTDraft } from '@/lib/utils/cbt-draft-utils';

export interface ThoughtData {
  thought: string;
  credibility: number;
}

interface ThoughtRecordProps {
  onComplete: (data: ThoughtData[]) => void;
  initialData?: ThoughtData[];
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

// Individual credibility slider component
interface CredibilitySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const CredibilitySlider: React.FC<CredibilitySliderProps> = ({ 
  label, 
  value, 
  onChange, 
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-sm text-muted-foreground font-mono">{value}/10</span>
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
        <span>0 - Don&apos;t believe</span>
        <span>5 - Somewhat</span>
        <span>10 - Completely believe</span>
      </div>
    </div>
  );
};

export function ThoughtRecord({ 
  onComplete, 
  initialData,
  title: _title = "What thoughts went through your mind?",
  subtitle: _subtitle = "Record the automatic thoughts that came up during this situation",
  stepNumber,
  totalSteps,
  className 
}: ThoughtRecordProps) {
  // Default thought data
  const defaultThoughts: ThoughtData[] = [{ thought: '', credibility: 5 }];

  const [thoughts, setThoughts] = useState<ThoughtData[]>(() => {
    const draftData = loadCBTDraft(CBT_DRAFT_KEYS.THOUGHTS, defaultThoughts);
    
    // Use initialData if provided, otherwise use draft data
    if (initialData && initialData.length > 0) {
      return initialData;
    }
    
    // Return draft data if it has content, otherwise default
    return draftData.length > 0 ? draftData : defaultThoughts;
  });

  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(() => 
    new Array(thoughts.length).fill('')
  );
  const [errors, setErrors] = useState<string[]>(() => 
    new Array(thoughts.length).fill('')
  );

  // Auto-save draft as user types
  const { isDraftSaved } = useDraftSaver(CBT_DRAFT_KEYS.THOUGHTS, thoughts);

  // Common thought prompts to help users get started
  const thoughtPrompts = [
    "I'm not good enough",
    "Something bad will happen",
    "I can't handle this",
    "People will judge me",
    "I always mess things up",
    "I should be perfect",
    "No one cares about me",
    "I'm in danger",
    "I can't trust anyone",
    "This is all my fault"
  ];

  const handleThoughtChange = useCallback((index: number, newThought: string) => {
    const updatedThoughts = [...thoughts];
    updatedThoughts[index] = { ...updatedThoughts[index], thought: newThought };
    setThoughts(updatedThoughts);
    
    // Clear selection when manually typing (unless it matches exactly)
    const updatedSelectedPrompts = [...selectedPrompts];
    if (updatedSelectedPrompts[index] !== newThought) {
      updatedSelectedPrompts[index] = '';
      setSelectedPrompts(updatedSelectedPrompts);
    }
    
    // Clear errors for this thought
    const newErrors = [...errors];
    newErrors[index] = '';
    setErrors(newErrors);
  }, [thoughts, errors, selectedPrompts]);

  const handleCredibilityChange = useCallback((index: number, credibility: number) => {
    const updatedThoughts = [...thoughts];
    updatedThoughts[index] = { ...updatedThoughts[index], credibility };
    setThoughts(updatedThoughts);
  }, [thoughts]);

  const handlePromptSelect = useCallback((prompt: string, index: number) => {
    handleThoughtChange(index, prompt);
    
    // Set the selected prompt for this thought index
    const updatedSelectedPrompts = [...selectedPrompts];
    updatedSelectedPrompts[index] = prompt;
    setSelectedPrompts(updatedSelectedPrompts);
  }, [handleThoughtChange, selectedPrompts]);

  const addThought = useCallback(() => {
    if (thoughts.length < 5) {
      setThoughts(prev => [...prev, { thought: '', credibility: 5 }]);
      setSelectedPrompts(prev => [...prev, '']);
      setErrors(prev => [...prev, '']);
    }
  }, [thoughts.length]);

  const removeThought = useCallback((index: number) => {
    if (thoughts.length > 1) {
      setThoughts(prev => prev.filter((_, i) => i !== index));
      setSelectedPrompts(prev => prev.filter((_, i) => i !== index));
      setErrors(prev => prev.filter((_, i) => i !== index));
    }
  }, [thoughts.length]);

  const validateThoughts = useCallback(() => {
    const newErrors: string[] = [];
    let isValid = true;

    thoughts.forEach((thought, index) => {
      if (thought.thought.trim().length < 3) {
        newErrors[index] = 'Please enter at least 3 characters';
        isValid = false;
      } else {
        newErrors[index] = '';
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [thoughts]);

  const handleSubmit = useCallback(() => {
    if (validateThoughts()) {
      const validThoughts = thoughts.filter(t => t.thought.trim().length >= 3);
      
      // Clear the draft since step is completed
      clearCBTDraft(CBT_DRAFT_KEYS.THOUGHTS);
      
      onComplete(validThoughts);
    }
  }, [thoughts, validateThoughts, onComplete]);

  const hasValidThoughts = thoughts.some(t => t.thought.trim().length >= 3);
  const validThoughtCount = thoughts.filter(t => t.thought.trim().length >= 3).length;

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Conversational Header */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
          <Brain className="w-4 h-4" />
          Step {stepNumber} of {totalSteps}: What thoughts went through your mind?
        </div>
        <div className={`mt-2 flex justify-center`}>
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all duration-300 ${
            isDraftSaved 
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Saved
          </div>
        </div>
      </div>

      <Card className="p-4 border-border bg-card">
        <div className="space-y-4 w-full max-w-full overflow-hidden">
        {/* Thought Prompts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
            <span>Common thoughts (tap to use):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {thoughtPrompts.map((prompt, index) => {
              const isSelected = selectedPrompts[0] === prompt;
              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePromptSelect(prompt, 0)}
                  className={cn(
                    "text-xs h-7 px-2",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "border-dashed hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {prompt}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Thought Entries */}
        <div className="space-y-4">
          {thoughts.map((thought, index) => (
            <Card key={index} className="p-4 bg-muted/30 border border-border/30 w-full max-w-full overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-base font-medium text-foreground">
                    Automatic Thought {index + 1}
                  </label>
                  {thoughts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeThought(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    placeholder="What thoughts immediately came to mind? What was I telling myself?"
                    value={thought.thought}
                    onChange={(e) => handleThoughtChange(index, e.target.value)}
                    className="min-h-[100px] resize-none w-full max-w-full break-words overflow-hidden"
                  />
                  {errors[index] && (
                    <p className="text-destructive text-sm break-words">{errors[index]}</p>
                  )}
                </div>

                <CredibilitySlider
                  label="How much do you believe this thought? (Credibility)"
                  value={thought.credibility}
                  onChange={(value) => handleCredibilityChange(index, value)}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Add Another Thought - Separated with proper spacing */}
        {thoughts.length < 5 && (
          <div className="pt-2 border-t border-border/30">
            <Button
              variant="outline"
              onClick={addThought}
              className="w-full h-12 border-dashed hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Thought
            </Button>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!hasValidThoughts}
          className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
          size="lg"
        >
          {/* Shimmer effect */}
          <div className="shimmer-effect"></div>
          <Send className="w-4 h-4 mr-2 relative z-10" />
          <span className="relative z-10">Share My Thoughts ({validThoughtCount})</span>
        </Button>

        {/* Helper Text */}
        <div className="text-center space-y-2">
          {!hasValidThoughts && (
            <p className="text-sm text-muted-foreground">
              Please record at least one thought to continue
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            💭 Try to capture the exact words that went through your mind
          </p>
        </div>
        </div>
      </Card>
    </div>
  );
}