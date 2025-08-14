'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { loadCBTDraft, useDraftSaver, CBT_DRAFT_KEYS, clearCBTDraft } from '@/lib/utils/cbt-draft-utils';

export interface SchemaMode {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  intensity?: number;
}

export interface SchemaModesData {
  selectedModes: SchemaMode[];
}

interface SchemaModesProps {
  onComplete: (data: SchemaModesData) => void;
  initialData?: SchemaModesData;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
}

// Default schema modes based on Schema Therapy
const DEFAULT_SCHEMA_MODES: SchemaMode[] = [
  {
    id: 'vulnerable-child',
    name: 'The Vulnerable Child',
    description: 'scared, helpless, needy',
    selected: false,
    intensity: 5
  },
  {
    id: 'angry-child',
    name: 'The Angry Child', 
    description: 'frustrated, defiant, rebellious',
    selected: false,
    intensity: 5
  },
  {
    id: 'punishing-parent',
    name: 'The Punishing Parent',
    description: 'critical, harsh, demanding',
    selected: false,
    intensity: 5
  },
  {
    id: 'demanding-parent',
    name: 'The Demanding Parent',
    description: 'controlling, entitled, impatient',
    selected: false,
    intensity: 5
  },
  {
    id: 'detached-self-soother',
    name: 'The Detached Self-Soother',
    description: 'withdrawn, disconnected, avoiding',
    selected: false,
    intensity: 5
  },
  {
    id: 'healthy-adult',
    name: 'The Healthy Adult',
    description: 'balanced, rational, caring',
    selected: false,
    intensity: 5
  }
];


export function SchemaModes({ 
  onComplete, 
  initialData,
  stepNumber,
  totalSteps,
  className 
}: SchemaModesProps) {
  // Default schema modes data
  const defaultModesData: SchemaModesData = {
    selectedModes: DEFAULT_SCHEMA_MODES
  };

  const [modesData, setModesData] = useState<SchemaModesData>(() => {
    const draftData = loadCBTDraft(CBT_DRAFT_KEYS.SCHEMA_MODES, defaultModesData);
    
    // Use initialData if provided, otherwise use draft data
    if (initialData?.selectedModes) {
      return initialData;
    }
    
    return draftData;
  });

  // Auto-save draft as user interacts
  const { isDraftSaved } = useDraftSaver(CBT_DRAFT_KEYS.SCHEMA_MODES, modesData);

  const handleModeToggle = useCallback((modeId: string) => {
    setModesData(prev => ({
      ...prev,
      selectedModes: prev.selectedModes.map(mode => 
        mode.id === modeId 
          ? { ...mode, selected: !mode.selected }
          : mode
      )
    }));
  }, []);

  const handleIntensityChange = useCallback((modeId: string, intensity: number) => {
    setModesData(prev => ({
      ...prev,
      selectedModes: prev.selectedModes.map(mode => 
        mode.id === modeId 
          ? { ...mode, intensity }
          : mode
      )
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const selectedModes = modesData.selectedModes.filter(mode => mode.selected);
    if (selectedModes.length > 0) {
      // Clear the draft since step is completed
      clearCBTDraft(CBT_DRAFT_KEYS.SCHEMA_MODES);
      
      // Complete the step and proceed to actions
      onComplete({ selectedModes });
    }
  }, [modesData, onComplete]);

  const selectedModes = modesData.selectedModes.filter(mode => mode.selected);
  const isValid = selectedModes.length > 0;

  // Schema mode colors for visual differentiation - compatible with light/dark mode
  const getModeColor = (modeId: string) => {
    switch (modeId) {
      case 'vulnerable-child': return 'bg-blue-600';
      case 'angry-child': return 'bg-red-600';
      case 'punishing-parent': return 'bg-purple-600';
      case 'demanding-parent': return 'bg-orange-500';
      case 'detached-self-soother': return 'bg-slate-600';
      case 'healthy-adult': return 'bg-green-600';
      default: return 'bg-primary';
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto w-full", className)}>
      {/* Conversational Header */}
      <div className="mb-6 text-center px-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary font-medium">
          <Users className="w-4 h-4" />
          Step {stepNumber} of {totalSteps}: Schema modes exploration
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Which parts of yourself are most active in this situation?
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          {selectedModes.length > 0 && (
            <p className="text-xs text-primary/70 font-medium">{selectedModes.length} modes selected</p>
          )}
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
          {/* Information */}
          <div className="p-3 bg-muted/30 rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground">
              <strong>Schema modes</strong> are different emotional states or &ldquo;parts&rdquo; of ourselves that become active in different situations. 
              Select the modes that feel most present for you right now, and adjust their intensity.
            </p>
          </div>

          {/* Schema Modes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modesData.selectedModes.map((mode) => {
              const isSelected = mode.selected;
              
              return (
                <Card 
                  key={mode.id} 
                  className={cn(
                    "p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
                    isSelected 
                      ? "ring-2 ring-primary bg-primary/5 border-primary/30" 
                      : "hover:border-primary/20 bg-muted/30"
                  )}
                  onClick={() => handleModeToggle(mode.id)}
                >
                  <div className="space-y-2">
                    {/* Mode Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                          getModeColor(mode.id)
                        )}>
                          {mode.id === 'vulnerable-child' && '👶'}
                          {mode.id === 'angry-child' && '😠'}
                          {mode.id === 'punishing-parent' && '🔨'}
                          {mode.id === 'demanding-parent' && '👑'}
                          {mode.id === 'detached-self-soother' && '🌫️'}
                          {mode.id === 'healthy-adult' && '🌟'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{mode.name}</h4>
                          <p className="text-xs text-muted-foreground italic">{mode.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <>
                            <span className="text-sm font-medium text-primary">{mode.intensity || 5}/10</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModeToggle(mode.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-muted-foreground/10" />
                        )}
                      </div>
                    </div>
                    
                    {/* Intensity Slider (only shown when selected) */}
                    {isSelected && (
                      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={mode.intensity || 5}
                          onChange={(e) => handleIntensityChange(mode.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>1</span>
                          <span className="hidden sm:inline">5</span>
                          <span>10</span>
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
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="text-sm font-medium text-primary mb-2">Active Schema Modes:</h4>
              <div className="space-y-1">
                {selectedModes.map((mode) => (
                  <div key={mode.id} className="flex justify-between items-center text-xs">
                    <span className="text-foreground">{mode.name}</span>
                    <span className="text-muted-foreground">Intensity: {mode.intensity}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-50"
            >
              {/* Shimmer effect */}
              <div className="shimmer-effect"></div>
              <Send className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">
                {selectedModes.length > 0 
                  ? `Continue with ${selectedModes.length} active modes` 
                  : "Continue to Action Plan"
                }
              </span>
            </Button>
            
            {!isValid && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Select at least one schema mode to continue
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}