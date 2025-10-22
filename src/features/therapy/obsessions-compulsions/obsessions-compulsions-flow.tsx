'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { List, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ObsessionsCompulsionsData } from '@/types/therapy';
import { useObsessionsFlow } from './components/useObsessionsFlow';
import { ObsessionBuilder } from './components/ObsessionBuilder';
import { FeedList } from './components/FeedList';

interface ObsessionsCompulsionsFlowProps {
  onComplete: (data: ObsessionsCompulsionsData) => void;
  onDismiss?: () => void;
  initialData?: ObsessionsCompulsionsData;
  className?: string;
}

export function ObsessionsCompulsionsFlow({
  onComplete,
  onDismiss,
  initialData,
  className,
}: ObsessionsCompulsionsFlowProps) {
  const t = useTranslations('obsessions');

  const {
    data,
    builderState,
    obsessionForm,
    compulsionForm,
    errors,
    derived,
    beginAdd,
    editPair,
    deletePair,
    handleObsessionNext,
    savePair,
    dismiss,
    setObsessionForm,
    setCompulsionForm,
    setStep,
  } = useObsessionsFlow({
    initialData,
    onChange: onComplete,
  });

  const { hasPairs, emptyStateVisible, isSaving } = derived;

  const translatedErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(errors).map(([field, key]) => [field, t(key as Parameters<typeof t>[0])]),
      ),
    [errors, t],
  );

  const builderText = useMemo(
    () => ({
      obsessionStepTitle: t('step1Title'),
      obsessionStepSubtitle: t('step1Subtitle'),
      compulsionStepTitle: t('step2Title'),
      compulsionStepSubtitle: t('step2Subtitle'),
      continueLabel: t('continueLabel'),
      backLabel: t('back'),
      cancelLabel: t('cancelAction'),
      savePair: t('savePair'),
      updatePair: t('updatePair'),
      intensityLabel: t('intensityLabel'),
      triggersPlaceholder: t('triggersPlaceholder'),
      obsessionPlaceholder: t('obsessionPlaceholder'),
      frequencyLabel: t('frequencyLabel'),
      durationLabel: t('durationLabel'),
      reliefLabel: t('reliefLabel'),
      durationUnit: t('minutes'),
      compulsionPlaceholder: t('compulsionPlaceholder'),
    }),
    [t],
  );

  const feedText = useMemo(
    () => ({
      pairLabel: t('pair'),
      obsessionLabel: t('obsessionLabel'),
      compulsionLabel: t('compulsionLabel'),
      recordedLabel: t('recorded'),
      intensityLabel: t('intensityLabel'),
      frequencyLabel: t('frequencyLabel'),
      durationLabel: t('durationLabel'),
      durationUnit: t('minutes'),
      reliefLabel: t('reliefLabel'),
      triggersLabel: t('triggersLabel', { defaultMessage: 'Triggers' }),
      editAction: t('editPair'),
      deleteAction: t('deletePair'),
    }),
    [t],
  );

  const isBuilderOpen = builderState.mode !== 'closed';

  const handleDeletePair = (index: number) => {
    void deletePair(index);
  };

  const handleDismiss = () => {
    dismiss();
    onDismiss?.();
  };

  return (
    <div className={cn('mx-auto max-w-5xl space-y-8', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <List className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {builderState.mode === 'closed' && hasPairs && (
            <Button size="sm" className="flex items-center gap-2" onClick={beginAdd}>
              <Plus className="w-4 h-4" />
              {t('addPairButton')}
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
              onClick={handleDismiss}
            >
              <Trash2 className="w-4 h-4" />
              {t('removeBlock')}
            </Button>
          )}
        </div>
      </div>

      {isBuilderOpen && (
        <ObsessionBuilder
          builderState={builderState}
          obsessionForm={obsessionForm}
          compulsionForm={compulsionForm}
          errors={translatedErrors}
          isSaving={isSaving}
          onObsessionChange={setObsessionForm}
          onCompulsionChange={setCompulsionForm}
          onSetStep={setStep}
          onCancel={dismiss}
          onSavePair={savePair}
          onNext={handleObsessionNext}
          text={builderText}
        />
      )}

      {emptyStateVisible && (
        <Card className="p-6 text-center border-dashed border-muted/60 bg-card/40">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <List className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold mb-1">{t('emptyState.title')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('emptyState.subtitle')}</p>
          <Button onClick={beginAdd} size="sm" className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            {t('start')}
          </Button>
        </Card>
      )}

      {hasPairs && (
        <FeedList data={data} onEdit={editPair} onDelete={handleDeletePair} texts={feedText} />
      )}
    </div>
  );
}
