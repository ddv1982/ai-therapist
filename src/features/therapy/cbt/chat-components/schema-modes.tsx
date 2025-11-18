'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CBTStepWrapper } from '@/components/ui/cbt-step-wrapper';
import { useCBTDataManager } from '@/hooks/therapy/use-cbt-data-manager';
// Removed CBTFormValidationError import - validation errors not displayed
import { useTranslations } from 'next-intl';
import { TherapySlider } from '@/components/ui/therapy-slider';

import type { CBTStepType, SchemaMode, SchemaModesData } from '@/types';

interface SchemaModesProps {
  onComplete: (data: SchemaModesData) => void;
  initialData?: SchemaModesData;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  totalSteps?: number;
  className?: string;
  onNavigateStep?: (step: CBTStepType) => void;
}

// Default schema modes based on Schema Therapy
const SCHEMA_MODE_TRANSLATIONS: Record<string, { name: string; description: string }> = {
  'vulnerable-child': {
    name: 'schema.mode.vulnerableChild.name',
    description: 'schema.mode.vulnerableChild.description',
  },
  'angry-child': {
    name: 'schema.mode.angryChild.name',
    description: 'schema.mode.angryChild.description',
  },
  'punishing-parent': {
    name: 'schema.mode.punishingParent.name',
    description: 'schema.mode.punishingParent.description',
  },
  'demanding-parent': {
    name: 'schema.mode.demandingParent.name',
    description: 'schema.mode.demandingParent.description',
  },
  'detached-self-soother': {
    name: 'schema.mode.detachedSelfSoother.name',
    description: 'schema.mode.detachedSelfSoother.description',
  },
  'healthy-adult': {
    name: 'schema.mode.healthyAdult.name',
    description: 'schema.mode.healthyAdult.description',
  },
};

const DEFAULT_SCHEMA_MODES: SchemaMode[] = Object.entries(SCHEMA_MODE_TRANSLATIONS).map(
  ([id, keys]) => ({
    id,
    name: keys.name,
    description: keys.description,
    selected: false,
    intensity: 5,
  })
);

export function SchemaModes({
  onComplete,
  initialData,
  className,
  onNavigateStep,
}: SchemaModesProps) {
  const { sessionData, schemaActions, navigation } = useCBTDataManager();
  const t = useTranslations('cbt');
  const modeTranslations = useTranslations();

  // Get schema modes data from unified CBT hook
  const schemaModesData = sessionData?.schemaModes;
  const lastModified = sessionData?.lastModified;

  // Default schema modes data
  const defaultModesData: SchemaModesData = {
    selectedModes: DEFAULT_SCHEMA_MODES,
  };

  const [modesData, setModesData] = useState<SchemaModesData>(() => {
    // Use initialData if provided, otherwise use Redux data or default
    if (initialData?.selectedModes) {
      return initialData;
    }

    // Convert Redux schema modes to component format
    if (schemaModesData && schemaModesData.length > 0) {
      const selectedModes = DEFAULT_SCHEMA_MODES.map((mode) => ({
        ...mode,
        // Compare using stable id, not display name
        selected: schemaModesData.some(
          (reduxMode: any) => reduxMode.mode === mode.id && reduxMode.isActive
        ),
        intensity: schemaModesData.find((reduxMode: any) => reduxMode.mode === mode.id)?.intensity || 5,
      }));
      return { selectedModes };
    }

    return defaultModesData;
  });

  // Auto-save to Redux when modes change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const reduxModes = modesData.selectedModes
        .filter((mode) => mode.selected)
        .map((mode) => ({
          // Persist stable id into store for consistency
          mode: mode.id,
          description: SCHEMA_MODE_TRANSLATIONS[mode.id]?.description ?? mode.description,
          intensity: mode.intensity || 5,
          isActive: mode.selected,
        }));
      schemaActions.updateSchemaModes(reduxModes);
    }, 500); // Debounce updates by 500ms

    return () => clearTimeout(timeoutId);
  }, [modesData, schemaActions]);

  // Visual indicator for auto-save (based on Redux lastModified)
  const isDraftSaved = !!lastModified;

  // CBT chat bridge for sending data to session
  // Note: Chat bridge no longer used - data sent only in final comprehensive summary

  const translateMode = useCallback(
    (mode: SchemaMode) => {
      const keys = SCHEMA_MODE_TRANSLATIONS[mode.id];

      if (!keys) {
        return mode;
      }

      return {
        ...mode,
        name: modeTranslations(keys.name as Parameters<typeof modeTranslations>[0]),
        description: modeTranslations(keys.description as Parameters<typeof modeTranslations>[0]),
      };
    },
    [modeTranslations]
  );

  const handleModeToggle = useCallback((modeId: string) => {
    setModesData((prev) => ({
      ...prev,
      selectedModes: prev.selectedModes.map((mode) =>
        mode.id === modeId ? { ...mode, selected: !mode.selected } : mode
      ),
    }));
  }, []);

  const handleIntensityChange = useCallback((modeId: string, intensity: number) => {
    setModesData((prev) => ({
      ...prev,
      selectedModes: prev.selectedModes.map((mode) =>
        mode.id === modeId ? { ...mode, intensity } : mode
      ),
    }));
  }, []);

  const translatedModes = modesData.selectedModes.map(translateMode);
  const selectedModes = translatedModes.filter((mode) => mode.selected);
  const isValid = selectedModes.length > 0;

  // Validation logic - keeps form functional without showing error messages

  // Next handler for CBTStepWrapper
  const handleNext = useCallback(async () => {
    const selectedModes = modesData.selectedModes.filter((mode) => mode.selected);
    if (selectedModes.length > 0) {
      // Update store with final data
      const reduxModes = selectedModes.map((mode) => ({
        mode: mode.id,
        description: SCHEMA_MODE_TRANSLATIONS[mode.id]?.description ?? mode.description,
        intensity: mode.intensity || 5,
        isActive: mode.selected,
      }));
      schemaActions.updateSchemaModes(reduxModes);

      // Complete the step and proceed to actions
      onComplete({ selectedModes });
    }
  }, [modesData, schemaActions, onComplete]);

  // Schema mode colors for visual differentiation - compatible with light/dark mode
  const getModeColor = (modeId: string) => {
    switch (modeId) {
      case 'vulnerable-child':
        return 'bg-blue-600';
      case 'angry-child':
        return 'bg-red-600';
      case 'punishing-parent':
        return 'bg-purple-600';
      case 'demanding-parent':
        return 'bg-orange-500';
      case 'detached-self-soother':
        return 'bg-slate-600';
      case 'healthy-adult':
        return 'bg-green-600';
      default:
        return 'bg-primary';
    }
  };

  return (
    <CBTStepWrapper
      step="schema-modes"
      title={t('schema.title')}
      subtitle={t('schema.subtitle')}
      isValid={isValid}
      validationErrors={[]} // No validation error display
      onNext={handleNext}
      onPrevious={() => {
        navigation.goPrevious();
      }}
      className={className}
      onNavigateStep={onNavigateStep}
    >
      <div className="mb-4 flex items-center justify-center gap-4">
        {selectedModes.length > 0 && (
          <p className="text-primary/70 text-sm font-semibold">
            {selectedModes.length} {t('schema.selected')}
          </p>
        )}
        <div
          className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-all duration-200 ${
            isDraftSaved
              ? 'scale-100 bg-green-50 text-green-700 opacity-100 ring-1 ring-green-600/10 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/20'
              : 'scale-95 opacity-0'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          {t('status.saved')}
        </div>
      </div>

      <Card className="border-border bg-card p-4">
        <div className="space-y-4">
          {/* Information */}
          <div className="bg-muted/30 border-border/30 rounded-lg border p-3">
            <p className="text-muted-foreground text-sm">
              <strong>{t('schema.modes')}</strong> {t('schema.desc')}
            </p>
          </div>

          {/* Schema Modes Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {translatedModes.map((mode) => {
              const isSelected = mode.selected;

              return (
                <Card
                  key={mode.id}
                  className={cn(
                    'cursor-pointer p-3 transition-colors duration-200',
                    isSelected
                      ? 'ring-primary bg-primary/5 border-primary/30 ring-2'
                      : 'hover:border-primary/20 bg-muted/30'
                  )}
                  onClick={() => handleModeToggle(mode.id)}
                >
                  <div className="space-y-2">
                    {/* Mode Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white',
                            getModeColor(mode.id)
                          )}
                        >
                          {mode.id === 'vulnerable-child' && '👶'}
                          {mode.id === 'angry-child' && '😠'}
                          {mode.id === 'punishing-parent' && '🔨'}
                          {mode.id === 'demanding-parent' && '👑'}
                          {mode.id === 'detached-self-soother' && '🌫️'}
                          {mode.id === 'healthy-adult' && '🌟'}
                        </div>
                        <div>
                          <h4 className="text-foreground text-sm font-semibold">{mode.name}</h4>
                          <p className="text-muted-foreground text-sm italic">{mode.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <>
                            <span className="text-primary text-sm font-semibold">
                              {mode.intensity || 5}/10
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModeToggle(mode.id);
                              }}
                              className="hover:bg-destructive/10 hover:text-destructive h-6 w-6 p-0"
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <div className="border-muted-foreground/10 h-6 w-6 rounded-full border" />
                        )}
                      </div>
                    </div>

                    {/* Intensity Slider (only shown when selected) */}
                    {isSelected && (
                      <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                        <TherapySlider
                          type="intensity"
                          label=""
                          value={mode.intensity || 5}
                          onChange={(val) => handleIntensityChange(mode.id, val)}
                          min={1}
                          max={10}
                          className="w-full"
                          labelSize="xs"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Selected Modes Summary */}
          {selectedModes.length > 0 && (
            <div className="bg-primary/5 border-primary/20 rounded-lg border p-3">
              <h4 className="text-primary mb-2 text-sm font-semibold">{t('schema.active')}</h4>
              <div className="space-y-1">
                {selectedModes.map((mode) => (
                  <div key={mode.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{mode.name}</span>
                    <span className="text-muted-foreground">
                      {t('schema.intensity')}: {mode.intensity}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </CBTStepWrapper>
  );
}
