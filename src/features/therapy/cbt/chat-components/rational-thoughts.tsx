'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Lightbulb, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { loadCBTDraft, useDraftSaver, CBT_DRAFT_KEYS, clearCBTDraft } from '@/lib/utils/cbt-draft-utils';

export interface RationalThoughtsData {
  rationalThoughts: Array<{ thought: string; confidence: number }>;
}

interface RationalThoughtsProps {
  onComplete: (data: RationalThoughtsData) => void;
  initialData?: RationalThoughtsData;
  coreBeliefText?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

// Confidence slider component
interface ConfidenceSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({ 
  label, 
  value, 
  onChange, 
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-foreground">{label}</label>
        <span className="text-xs text-muted-foreground font-mono">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1 - Slightly</span>
        <span>5 - Moderately</span>
        <span>10 - Completely</span>
      </div>
    </div>
  );
};

export function RationalThoughts({ 
  onComplete, 
  initialData,
  coreBeliefText,
  stepNumber,
  totalSteps,
  className 
}: RationalThoughtsProps) {
  // Default rational thoughts data
  const defaultThoughtsData: RationalThoughtsData = {
    rationalThoughts: [
      { thought: '', confidence: 5 }
    ]
  };

  const [thoughtsData, setThoughtsData] = useState<RationalThoughtsData>(() => {
    const draftData = loadCBTDraft(CBT_DRAFT_KEYS.RATIONAL_THOUGHTS, defaultThoughtsData);
    
    // Use initialData if provided, otherwise use draft data
    if (initialData?.rationalThoughts) {
      return initialData;
    }
    
    return draftData;
  });

  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(() =>
    new Array(thoughtsData.rationalThoughts.length).fill('')
  );

  // Auto-save draft as user types
  const { isDraftSaved } = useDraftSaver(CBT_DRAFT_KEYS.RATIONAL_THOUGHTS, thoughtsData);

  const handleThoughtChange = useCallback((index: number, field: 'thought' | 'confidence', value: string | number) => {
    setThoughtsData(prev => ({
      ...prev,
      rationalThoughts: prev.rationalThoughts.map((t, i) => 
        i === index ? { ...t, [field]: value } : t
      )
    }));

    // Clear selection when manually typing (unless it matches exactly)
    if (field === 'thought') {
      const updatedSelectedPrompts = [...selectedPrompts];
      if (updatedSelectedPrompts[index] !== value) {
        updatedSelectedPrompts[index] = '';
        setSelectedPrompts(updatedSelectedPrompts);
      }
    }
  }, [selectedPrompts]);

  const addThought = useCallback(() => {
    if (thoughtsData.rationalThoughts.length < 5) {
      setThoughtsData(prev => ({
        ...prev,
        rationalThoughts: [...prev.rationalThoughts, { thought: '', confidence: 5 }]
      }));
      setSelectedPrompts(prev => [...prev, '']);
    }
  }, [thoughtsData.rationalThoughts.length]);

  const removeThought = useCallback((index: number) => {
    if (thoughtsData.rationalThoughts.length > 1) {
      setThoughtsData(prev => ({
        ...prev,
        rationalThoughts: prev.rationalThoughts.filter((_, i) => i !== index)
      }));
      setSelectedPrompts(prev => prev.filter((_, i) => i !== index));
    }
  }, [thoughtsData.rationalThoughts.length]);

  const handlePromptSelect = useCallback((prompt: string, index: number) => {
    handleThoughtChange(index, 'thought', prompt);
    
    // Set the selected prompt for this thought index
    const updatedSelectedPrompts = [...selectedPrompts];
    updatedSelectedPrompts[index] = prompt;
    setSelectedPrompts(updatedSelectedPrompts);
  }, [handleThoughtChange, selectedPrompts]);

  const handleSubmit = useCallback(() => {
    const validThoughts = thoughtsData.rationalThoughts.filter(t => t.thought.trim());
    if (validThoughts.length > 0) {
      // Clear the draft since step is completed
      clearCBTDraft(CBT_DRAFT_KEYS.RATIONAL_THOUGHTS);
      
      // Always complete the step first for normal CBT flow progression
      onComplete({ rationalThoughts: validThoughts });
    }
  }, [thoughtsData, onComplete]);

  const validThoughtCount = thoughtsData.rationalThoughts.filter(t => t.thought.trim()).length;
  const isValid = validThoughtCount > 0;

  // Helper prompts
  const thoughtPrompts = [
    "Maybe I'm being too hard on myself",
    "I've overcome challenges before",
    "Nobody is perfect, and that's okay",
    "I can learn and grow from this experience",
    "There might be other explanations",
    "I have people who care about me"
  ];

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {/* Conversational Header */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
          <Lightbulb className="w-4 h-4" />
          Step {stepNumber} of {totalSteps}: Rational alternatives
        </div>
        {coreBeliefText && (
          <p className="text-xs text-muted-foreground mt-2">
            Alternative to: &ldquo;{coreBeliefText}&rdquo;
          </p>
        )}
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
        <div className="space-y-4">
          {/* Quick Thought Prompts */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Helpful starting points:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {thoughtPrompts.slice(0, 4).map((prompt, index) => {
                const isSelected = selectedPrompts[0] === prompt;
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePromptSelect(prompt, 0)}
                    className={cn(
                      "text-xs h-8 px-3 text-left justify-start",
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

          {/* Rational Thoughts */}
          <div className="space-y-4">
            {thoughtsData.rationalThoughts.map((thoughtData, index) => (
              <Card key={index} className="p-4 bg-muted/30 border border-border/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      Rational Thought {index + 1}
                    </h4>
                    {thoughtsData.rationalThoughts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeThought(index)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    placeholder="What's a more balanced, realistic way to think about this?"
                    value={thoughtData.thought}
                    onChange={(e) => handleThoughtChange(index, 'thought', e.target.value)}
                    className="min-h-[60px] resize-none"
                    maxLength={200}
                  />
                  
                  {thoughtData.thought.trim() && (
                    <ConfidenceSlider
                      label="How confident do you feel in this alternative thought?"
                      value={thoughtData.confidence}
                      onChange={(value) => handleThoughtChange(index, 'confidence', value)}
                    />
                  )}
                  
                  <div className="flex justify-end text-xs text-muted-foreground">
                    <span>{thoughtData.thought.length}/200</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add Thought */}
          {thoughtsData.rationalThoughts.length < 5 && (
            <Button
              variant="outline"
              onClick={addThought}
              className="w-full h-8 border-dashed hover:bg-accent hover:text-accent-foreground"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Thought
            </Button>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
          >
            {/* Shimmer effect */}
            <div className="shimmer-effect"></div>
            <Send className="w-4 h-4 mr-2 relative z-10" />
            <span className="relative z-10">{validThoughtCount > 0 ? `Continue with ${validThoughtCount} thoughts` : "Continue to Schema Modes"}</span>
          </Button>
          
          {!isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Write at least one rational thought to continue
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}