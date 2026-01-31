'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { List, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ObsessionsCompulsionsData } from '@/types';
import { useObsessionsFlow } from './components/use-obsessions-flow';
import { ObsessionBuilder } from './components/obsession-builder';
import { FeedList } from './components/feed-list';

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
        Object.entries(errors).map(([field, key]) => [field, t(key as Parameters<typeof t>[0])])
      ),
    [errors, t]
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
    [t]
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
    [t]
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
      <FlowHeader
        title={t('title')}
        subtitle={t('subtitle')}
        showAdd={builderState.mode === 'closed' && hasPairs}
        onAdd={beginAdd}
        addLabel={t('addPairButton')}
        showRemove={Boolean(onDismiss)}
        onRemove={handleDismiss}
        removeLabel={t('removeBlock')}
      />

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
        <EmptyStateCard
          title={t('emptyState.title')}
          subtitle={t('emptyState.subtitle')}
          startLabel={t('start')}
          onStart={beginAdd}
        />
      )}

      {hasPairs && (
        <FeedList data={data} onEdit={editPair} onDelete={handleDeletePair} texts={feedText} />
      )}
    </div>
  );
}

interface FlowHeaderProps {
  title: string;
  subtitle: string;
  showAdd: boolean;
  onAdd: () => void;
  addLabel: string;
  showRemove: boolean;
  onRemove: () => void;
  removeLabel: string;
}

function FlowHeader({
  title,
  subtitle,
  showAdd,
  onAdd,
  addLabel,
  showRemove,
  onRemove,
  removeLabel,
}: FlowHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <List className="text-primary h-5 w-5" />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl text-sm">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {showAdd && (
          <Button size="sm" className="flex items-center gap-2" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        )}
        {showRemove && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive flex items-center gap-1"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
            {removeLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateCardProps {
  title: string;
  subtitle: string;
  startLabel: string;
  onStart: () => void;
}

function EmptyStateCard({ title, subtitle, startLabel, onStart }: EmptyStateCardProps) {
  return (
    <Card className="border-muted/60 bg-card/40 border-dashed p-6 text-center">
      <div className="bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
        <List className="text-primary h-6 w-6" />
      </div>
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{subtitle}</p>
      <Button onClick={onStart} size="sm" className="mx-auto flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {startLabel}
      </Button>
    </Card>
  );
}
