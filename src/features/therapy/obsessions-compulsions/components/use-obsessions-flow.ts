import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ObsessionData, CompulsionData, ObsessionsCompulsionsData } from '@/types';
import { DEFAULT_COMPULSION_FORM, DEFAULT_OBSESSION_FORM } from './defaults';
import type { BuilderState, ObsessionFormState, CompulsionFormState, BuilderStep } from './types';

interface UseObsessionsFlowOptions {
  initialData?: ObsessionsCompulsionsData;
  onChange?: (data: ObsessionsCompulsionsData) => Promise<void> | void;
}

const EMPTY_DATA: ObsessionsCompulsionsData = {
  obsessions: [],
  compulsions: [],
  lastModified: new Date(0).toISOString(),
};

const createInitialBuilderState = (hasEntries: boolean): BuilderState => ({
  mode: hasEntries ? 'closed' : 'add',
  step: 'obsession',
  editingIndex: null,
});

export function useObsessionsFlow({ initialData, onChange }: UseObsessionsFlowOptions) {
  const [data, setData] = useState<ObsessionsCompulsionsData>(initialData ?? EMPTY_DATA);
  const [builderState, setBuilderState] = useState<BuilderState>(() =>
    createInitialBuilderState(
      Boolean(initialData?.obsessions.length || initialData?.compulsions.length)
    )
  );
  const [obsessionForm, setObsessionForm] = useState<ObsessionFormState>(DEFAULT_OBSESSION_FORM);
  const [compulsionForm, setCompulsionForm] =
    useState<CompulsionFormState>(DEFAULT_COMPULSION_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;
    setData(initialData);
    setBuilderState(
      createInitialBuilderState(
        Boolean(initialData.obsessions.length || initialData.compulsions.length)
      )
    );
    setObsessionForm(DEFAULT_OBSESSION_FORM);
    setCompulsionForm(DEFAULT_COMPULSION_FORM);
    setErrors({});
  }, [initialData]);

  const resetForms = useCallback(() => {
    setObsessionForm(DEFAULT_OBSESSION_FORM);
    setCompulsionForm(DEFAULT_COMPULSION_FORM);
  }, []);

  const setStep = useCallback((step: BuilderStep) => {
    setBuilderState((prev) => ({ ...prev, step }));
  }, []);

  const handleChange = useCallback(
    async (nextData: ObsessionsCompulsionsData) => {
      setData(nextData);
      if (!onChange) return;
      try {
        setIsSaving(true);
        await onChange(nextData);
      } finally {
        setIsSaving(false);
      }
    },
    [onChange]
  );

  const validateObsession = useCallback((form: ObsessionFormState) => {
    const issues: Record<string, string> = {};
    if (!form.obsession.trim()) issues.obsession = 'validation.obsessionRequired';
    if (form.intensity < 1 || form.intensity > 10)
      issues.intensity = 'validation.intensityRequired';
    return issues;
  }, []);

  const validateCompulsion = useCallback((form: CompulsionFormState) => {
    const issues: Record<string, string> = {};
    if (!form.compulsion.trim()) issues.compulsion = 'validation.compulsionRequired';
    if (form.frequency < 1 || form.frequency > 10)
      issues.frequency = 'validation.frequencyRequired';
    if (form.duration < 1) issues.duration = 'validation.durationMin';
    if (form.duration > 999) issues.duration = 'validation.durationMax';
    if (form.reliefLevel < 1 || form.reliefLevel > 10)
      issues.reliefLevel = 'validation.reliefRequired';
    return issues;
  }, []);

  const setFieldErrors = useCallback((next: Record<string, string>) => {
    setErrors(next);
  }, []);

  const updateBuilderState = useCallback((next: BuilderState) => {
    setBuilderState(next);
    setErrors({});
  }, []);

  const beginAdd = useCallback(() => {
    resetForms();
    updateBuilderState({ mode: 'add', step: 'obsession', editingIndex: null });
  }, [resetForms, updateBuilderState]);

  const editPair = useCallback(
    (index: number) => {
      const obsession = data.obsessions[index];
      const compulsion = data.compulsions[index];
      if (!obsession) return;

      setObsessionForm({
        obsession: obsession.obsession,
        intensity: obsession.intensity,
        triggers: obsession.triggers.join(', '),
      });

      setCompulsionForm({
        compulsion: compulsion?.compulsion ?? '',
        frequency: compulsion?.frequency ?? 5,
        duration: compulsion?.duration ?? 10,
        reliefLevel: compulsion?.reliefLevel ?? 5,
      });

      setFieldErrors({});
      updateBuilderState({ mode: 'edit', step: 'obsession', editingIndex: index });
    },
    [data, updateBuilderState, setFieldErrors]
  );

  const deletePair = useCallback(
    async (index: number) => {
      const nextObsessions = data.obsessions.filter((_, i) => i !== index);
      const nextCompulsions = data.compulsions.filter((_, i) => i !== index);
      const updated: ObsessionsCompulsionsData = {
        obsessions: nextObsessions,
        compulsions: nextCompulsions,
        lastModified: new Date().toISOString(),
      };

      setData(updated);

      const isEditingTarget = builderState.mode === 'edit' && builderState.editingIndex === index;
      const noPairsRemain = updated.obsessions.length === 0;

      if (noPairsRemain) {
        resetForms();
        updateBuilderState({ mode: 'add', step: 'obsession', editingIndex: null });
      } else if (isEditingTarget) {
        resetForms();
        updateBuilderState({ mode: 'closed', step: 'obsession', editingIndex: null });
      } else if (
        builderState.mode === 'edit' &&
        builderState.editingIndex !== null &&
        builderState.editingIndex > index
      ) {
        updateBuilderState({
          mode: 'edit',
          step: builderState.step,
          editingIndex: builderState.editingIndex - 1,
        });
      }

      await handleChange(updated);
    },
    [builderState, data, handleChange, resetForms, updateBuilderState]
  );

  const savePair = useCallback(async () => {
    const compulsionErrors = validateCompulsion(compulsionForm);
    if (Object.keys(compulsionErrors).length > 0) {
      setFieldErrors(compulsionErrors);
      return;
    }

    const now = new Date().toISOString();
    const index =
      builderState.mode === 'edit' ? (builderState.editingIndex ?? 0) : data.obsessions.length;
    const existingObsession = data.obsessions[index];
    const existingCompulsion = data.compulsions[index];

    const obsessionRecord: ObsessionData = {
      id: existingObsession?.id ?? uuidv4(),
      obsession: obsessionForm.obsession.trim(),
      intensity: obsessionForm.intensity,
      triggers: obsessionForm.triggers
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      createdAt: existingObsession?.createdAt ?? now,
    };

    const compulsionRecord: CompulsionData = {
      id: existingCompulsion?.id ?? uuidv4(),
      compulsion: compulsionForm.compulsion.trim(),
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

    resetForms();
    updateBuilderState({ mode: 'closed', step: 'obsession', editingIndex: null });
    await handleChange(updated);
  }, [
    builderState,
    compulsionForm,
    data,
    handleChange,
    obsessionForm,
    resetForms,
    updateBuilderState,
    validateCompulsion,
    setFieldErrors,
  ]);

  const goToCompulsionStep = useCallback(() => setStep('compulsion'), [setStep]);

  const handleObsessionNext = useCallback(() => {
    const issues = validateObsession(obsessionForm);
    if (Object.keys(issues).length > 0) {
      setFieldErrors(issues);
      return;
    }
    setFieldErrors({});
    goToCompulsionStep();
  }, [goToCompulsionStep, obsessionForm, validateObsession, setFieldErrors]);

  const dismiss = useCallback(() => {
    resetForms();
    updateBuilderState({ mode: 'closed', step: 'obsession', editingIndex: null });
  }, [resetForms, updateBuilderState]);

  const derived = useMemo(
    () => ({
      hasPairs: data.obsessions.length > 0,
      emptyStateVisible: !data.obsessions.length && builderState.mode === 'closed',
      isSaving,
    }),
    [builderState.mode, data.obsessions.length, isSaving]
  );

  return {
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
  };
}
