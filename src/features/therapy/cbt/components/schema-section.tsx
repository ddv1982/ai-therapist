'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Target } from 'lucide-react';
import { useDraftSaver, CBT_DRAFT_KEYS } from '@/lib/utils/cbt-draft-utils';
import { EmotionScale } from './emotion-scale';

import { CBTDiaryFormData } from '@/types/therapy';

interface SchemaSectionProps {
  formData: CBTDiaryFormData;
  updateField: <K extends keyof CBTDiaryFormData>(field: K, value: CBTDiaryFormData[K]) => void;
  updateSchemaMode: (modeId: string, selected: boolean) => void;
  errors: Record<string, string>;
}

export const SchemaSection: React.FC<SchemaSectionProps> = ({
  formData,
  updateField,
  updateSchemaMode,
  errors
}) => {
  // Auto-save draft with visual indicator
  const { isDraftSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.CORE_BELIEF, 
    { 
      coreBeliefText: formData.coreBeliefText, 
      coreBeliefCredibility: formData.coreBeliefCredibility,
      confirmingBehaviors: formData.confirmingBehaviors,
      avoidantBehaviors: formData.avoidantBehaviors,
      overridingBehaviors: formData.overridingBehaviors
    }
  );

  // Auto-save schema modes draft
  const { isDraftSaved: isSchemaModesServerSaved } = useDraftSaver(
    CBT_DRAFT_KEYS.SCHEMA_MODES, 
    formData.schemaModes
  );

  return (
    <Card className="p-6 space-y-8 min-h-[600px] cbt-modal-card">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Core Belief & Schema Analysis
          {/* Draft saved indicator */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-all duration-300 ml-auto ${
            (isDraftSaved || isSchemaModesServerSaved)
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Saved
          </div>
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
};