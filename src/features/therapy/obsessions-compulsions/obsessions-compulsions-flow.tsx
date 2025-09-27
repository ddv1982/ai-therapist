'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Save,
  AlertCircle,
  List,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ObsessionData,
  CompulsionData,
  ObsessionsCompulsionsData,
} from '@/types/therapy';
import { v4 as uuidv4 } from 'uuid';

interface ObsessionsCompulsionsFlowProps {
  onComplete: (data: ObsessionsCompulsionsData) => void;
  initialData?: ObsessionsCompulsionsData;
  className?: string;
}

type BuilderMode = 'closed' | 'add' | 'edit';
type BuilderStep = 'obsession' | 'compulsion';

const DEFAULT_OBSESSION_FORM = {
  obsession: '',
  intensity: 5,
  triggers: '',
};

const DEFAULT_COMPULSION_FORM = {
  compulsion: '',
  frequency: 5,
  duration: 10,
  reliefLevel: 5,
};

export function ObsessionsCompulsionsFlow({
  onComplete,
  initialData,
  className,
}: ObsessionsCompulsionsFlowProps) {
  const t = useTranslations('obsessions');
  const hasInitialEntries = Boolean(
    initialData && (initialData.obsessions.length > 0 || initialData.compulsions.length > 0),
  );

  const [data, setData] = useState<ObsessionsCompulsionsData>(() =>
    initialData || {
      obsessions: [],
      compulsions: [],
      lastModified: new Date().toISOString(),
    },
  );

  const [builderState, setBuilderState] = useState<{
    mode: BuilderMode;
    step: BuilderStep;
    editingIndex: number | null;
  }>(() => ({
    mode: hasInitialEntries ? 'closed' : 'add',
    step: 'obsession',
    editingIndex: null,
  }));

  const [obsessionForm, setObsessionForm] = useState(DEFAULT_OBSESSION_FORM);
  const [compulsionForm, setCompulsionForm] = useState(DEFAULT_COMPULSION_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const resetForms = useCallback(() => {
    setObsessionForm(DEFAULT_OBSESSION_FORM);
    setCompulsionForm(DEFAULT_COMPULSION_FORM);
  }, []);

  React.useEffect(() => {
    if (!initialData) return;
    setData(initialData);
    const hasEntries = initialData.obsessions.length > 0 || initialData.compulsions.length > 0;
    setBuilderState({ mode: hasEntries ? 'closed' : 'add', step: 'obsession', editingIndex: null });
    resetForms();
    setErrors({});
  }, [initialData, resetForms]);

  const validateObsession = useCallback(
    (form: typeof DEFAULT_OBSESSION_FORM) => {
      const newErrors: Record<string, string> = {};

      if (!form.obsession.trim()) {
        newErrors.obsession = t('validation.obsessionRequired');
      }
      if (form.intensity < 1 || form.intensity > 10) {
        newErrors.intensity = t('validation.intensityRequired');
      }

      return newErrors;
    },
    [t],
  );

  const validateCompulsion = useCallback(
    (form: typeof DEFAULT_COMPULSION_FORM) => {
      const newErrors: Record<string, string> = {};

      if (!form.compulsion.trim()) {
        newErrors.compulsion = t('validation.compulsionRequired');
      }
      if (form.frequency < 1 || form.frequency > 10) {
        newErrors.frequency = t('validation.frequencyRequired');
      }
      if (form.duration < 1) {
        newErrors.duration = t('validation.durationMin');
      }
      if (form.duration > 999) {
        newErrors.duration = t('validation.durationMax');
      }
      if (form.reliefLevel < 1 || form.reliefLevel > 10) {
        newErrors.reliefLevel = t('validation.reliefRequired');
      }

      return newErrors;
    },
    [t],
  );

  const handleBeginAdd = useCallback(() => {
    resetForms();
    setErrors({});
    setBuilderState({ mode: 'add', step: 'obsession', editingIndex: null });
  }, [resetForms]);

  const handleObsessionNext = useCallback(() => {
    const validationErrors = validateObsession(obsessionForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setBuilderState((prev) => ({ ...prev, step: 'compulsion' }));
  }, [obsessionForm, validateObsession]);

  const handleSavePair = useCallback(async () => {
    const validationErrors = validateCompulsion(compulsionForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const trimmedObsession = obsessionForm.obsession.trim();
    const trimmedCompulsion = compulsionForm.compulsion.trim();
    const triggers = obsessionForm.triggers
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    // Build updated data from current state
    const now = new Date().toISOString();
    const index = builderState.mode === 'edit' ? builderState.editingIndex ?? 0 : data.obsessions.length;
    const existingObsession = data.obsessions[index];
    const existingCompulsion = data.compulsions[index];

    const obsessionRecord: ObsessionData = {
      id: existingObsession?.id ?? uuidv4(),
      obsession: trimmedObsession,
      intensity: obsessionForm.intensity,
      triggers,
      createdAt: existingObsession?.createdAt ?? now,
    };

    const compulsionRecord: CompulsionData = {
      id: existingCompulsion?.id ?? uuidv4(),
      compulsion: trimmedCompulsion,
      frequency: compulsionForm.frequency,
      duration: compulsionForm.duration,
      reliefLevel: compulsionForm.reliefLevel,
      createdAt: existingCompulsion?.createdAt ?? now,
    };

    const nextObsessions = [...data.obsessions];
    const nextCompulsions = [...data.compulsions];

    if (builderState.mode === 'edit' && builderState.editingIndex !== null) {
      nextObsessions[builderState.editingIndex] = obsessionRecord;
      nextCompulsions[builderState.editingIndex] = compulsionRecord;
    } else {
      nextObsessions.push(obsessionRecord);
      nextCompulsions.push(compulsionRecord);
    }

    const updated: ObsessionsCompulsionsData = {
      obsessions: nextObsessions,
      compulsions: nextCompulsions,
      lastModified: now,
    };

    setData(updated);

    // Close and reset UI immediately
    resetForms();
    setBuilderState({ mode: 'closed', step: 'obsession', editingIndex: null });

    // Send to chat through onComplete
    try {
      setIsSaving(true);
      const maybePromise = onComplete(updated) as unknown as Promise<void> | void;
      if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
        await (maybePromise as Promise<void>);
      }
    } finally {
      setIsSaving(false);
    }
  }, [builderState.mode, builderState.editingIndex, compulsionForm, obsessionForm, resetForms, validateCompulsion, data, onComplete]);

  const handleEditPair = useCallback(
    (index: number) => {
      const existingObsession = data.obsessions[index];
      if (!existingObsession) return;

      const existingCompulsion = data.compulsions[index];

      setObsessionForm({
        obsession: existingObsession.obsession,
        intensity: existingObsession.intensity,
        triggers: existingObsession.triggers.join(', '),
      });

      setCompulsionForm({
        compulsion: existingCompulsion?.compulsion ?? '',
        frequency: existingCompulsion?.frequency ?? 5,
        duration: existingCompulsion?.duration ?? 10,
        reliefLevel: existingCompulsion?.reliefLevel ?? 5,
      });

      setErrors({});
      setBuilderState({ mode: 'edit', step: 'obsession', editingIndex: index });
    },
    [data],
  );

  const handleDeletePair = useCallback(
    (index: number) => {
      setData((prev) => {
        const nextObsessions = prev.obsessions.filter((_, i) => i !== index);
        const nextCompulsions = prev.compulsions.filter((_, i) => i !== index);
        return {
          obsessions: nextObsessions,
          compulsions: nextCompulsions,
          lastModified: new Date().toISOString(),
        };
      });

      if (builderState.mode === 'edit' && builderState.editingIndex === index) {
        resetForms();
        setBuilderState({ mode: 'closed', step: 'obsession', editingIndex: null });
      }
    },
    [builderState.mode, builderState.editingIndex, resetForms],
  );

  // Removed separate complete action; Save also sends to chat

  const renderObsessionFields = () => (
    <div className="space-y-4">
      <div>
        <Textarea
          value={obsessionForm.obsession}
          onChange={(e) => setObsessionForm((prev) => ({ ...prev, obsession: e.target.value }))}
          placeholder={t('obsessionPlaceholder')}
          className={cn('min-h-[100px]', errors.obsession && 'border-destructive')}
        />
        {errors.obsession && (
          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            {errors.obsession}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">
            {t('intensityLabel')}: {obsessionForm.intensity}/10
          </Label>
          <Slider
            value={[obsessionForm.intensity]}
            onValueChange={([value]) => setObsessionForm((prev) => ({ ...prev, intensity: value }))}
            min={1}
            max={10}
            step={1}
            className="w-full mt-1"
          />
        </div>
        <div className="flex-1">
          <Input
            value={obsessionForm.triggers}
            onChange={(e) => setObsessionForm((prev) => ({ ...prev, triggers: e.target.value }))}
            placeholder={t('triggersPlaceholder')}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderCompulsionFields = () => (
    <div className="space-y-4">
      <div>
        <Textarea
          value={compulsionForm.compulsion}
          onChange={(e) => setCompulsionForm((prev) => ({ ...prev, compulsion: e.target.value }))}
          placeholder={t('compulsionPlaceholder')}
          className={cn('min-h-[100px]', errors.compulsion && 'border-destructive')}
        />
        {errors.compulsion && (
          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            {errors.compulsion}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">
            {t('frequencyLabel')}: {compulsionForm.frequency}/10
          </Label>
          <Slider
            value={[compulsionForm.frequency]}
            onValueChange={([value]) => setCompulsionForm((prev) => ({ ...prev, frequency: value }))}
            min={1}
            max={10}
            step={1}
            className="w-full mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">
            {t('durationLabel')}: {compulsionForm.duration} {t('minutes')}
          </Label>
          <Input
            type="number"
            value={compulsionForm.duration}
            onChange={(e) =>
              setCompulsionForm((prev) => ({ ...prev, duration: Number(e.target.value) || 0 }))
            }
            className={cn('text-sm', errors.duration && 'border-destructive')}
          />
          {errors.duration && (
            <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              {errors.duration}
            </div>
          )}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">
            {t('reliefLabel')}: {compulsionForm.reliefLevel}/10
          </Label>
          <Slider
            value={[compulsionForm.reliefLevel]}
            onValueChange={([value]) => setCompulsionForm((prev) => ({ ...prev, reliefLevel: value }))}
            min={1}
            max={10}
            step={1}
            className="w-full mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderBuilder = () => (
    <Card className="p-5 border-primary/20 bg-card">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {builderState.step === 'obsession' ? t('step1Title') : t('step2Title')}
            </h2>
            {builderState.mode === 'edit' && (
              <Badge variant="outline" className="text-xs">
                {t('editLabel')}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {builderState.step === 'obsession' ? t('step1Subtitle') : t('step2Subtitle')}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {builderState.step === 'obsession' ? renderObsessionFields() : renderCompulsionFields()}

        <div className="flex items-center justify-between">
          {builderState.step === 'compulsion' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBuilderState((prev) => ({ ...prev, step: 'obsession' }))}
              disabled={isSaving}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('back')}
            </Button>
          ) : (
            <div />
          )}
          <Button
            size="sm"
            onClick={builderState.step === 'obsession' ? handleObsessionNext : handleSavePair}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {builderState.step === 'obsession' ? (
              <>
                <span>{t('continueLabel')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>
                  {builderState.mode === 'edit' ? t('updatePair') : t('savePair')}
                </span>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderPairsList = () => {
    if (!data.obsessions.length) {
      return builderState.mode === 'closed' ? (
        <Card className="p-6 text-center border-dashed border-muted/60 bg-card/40">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <List className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold mb-1">{t('emptyState.title')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('emptyState.subtitle')}</p>
          <Button onClick={handleBeginAdd} size="sm" className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            {t('start')}
          </Button>
        </Card>
      ) : null;
    }

    return (
      <div className="space-y-4">
        {data.obsessions.map((obsession, index) => {
          const compulsion = data.compulsions[index];
          return (
            <Card key={obsession.id} className="p-4 border border-muted bg-card/60">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {t('pair')} {index + 1}
                    </h3>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        🧠 {t('obsessionLabel')}
                      </p>
                      <p className="text-sm leading-relaxed">{obsession.obsession}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('intensityLabel')}: {obsession.intensity}/10
                      </p>
                      {obsession.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {obsession.triggers.map((trigger, triggerIndex) => (
                            <Badge key={triggerIndex} variant="outline" className="text-xs px-1.5 py-0.5">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t('recorded')}: {new Date(obsession.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {compulsion && (
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        🔁 {t('compulsionLabel')}
                      </p>
                      <p className="text-sm leading-relaxed">{compulsion.compulsion}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground mt-1">
                        <span>{t('frequencyLabel')}: {compulsion.frequency}/10</span>
                        <span>{t('durationLabel')}: {compulsion.duration} {t('minutes')}</span>
                        <span>{t('reliefLabel')}: {compulsion.reliefLevel}/10</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('recorded')}: {new Date(compulsion.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleEditPair(index)}
                  >
                    <Pencil className="w-4 h-4" />
                    {t('editPair')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-destructive"
                    onClick={() => handleDeletePair(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('deletePair')}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">{t('title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        {builderState.mode === 'closed' && (
          <Button size="sm" className="flex items-center gap-2" onClick={handleBeginAdd}>
            <Plus className="w-4 h-4" />
            {t('addPairButton')}
          </Button>
        )}
      </div>

      {builderState.mode !== 'closed' && renderBuilder()}
      {renderPairsList()}
    </div>
  );
}
