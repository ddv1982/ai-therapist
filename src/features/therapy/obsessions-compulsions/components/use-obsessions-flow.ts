import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ObsessionData, CompulsionData, ObsessionsCompulsionsData } from '@/types';
import {
  DEFAULT_COMPULSION_FORM,
  DEFAULT_OBSESSION_FORM,
} from '@/features/therapy/obsessions-compulsions/components/defaults';
import type {
  BuilderState,
  ObsessionFormState,
  CompulsionFormState,
  BuilderStep,
} from '@/features/therapy/obsessions-compulsions/components/types';

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

  // Refs to track latest form values (avoids stale closure in callbacks)
  const obsessionFormRef = useRef(obsessionForm);
  const compulsionFormRef = useRef(compulsionForm);

  // Keep refs in sync with state
  obsessionFormRef.current = obsessionForm;
  compulsionFormRef.current = compulsionForm;

  // Track previous lastModified timestamp to detect true external changes
  // Using lastModified instead of reference comparison avoids spurious resets
  // when parent re-renders with new object references containing same data
  const prevLastModifiedRef = useRef<string | undefined>(initialData?.lastModified);

  useEffect(() => {
    if (!initialData) return;

    // Only sync if the data actually changed (compare lastModified timestamp)
    // This prevents resetting local state when parent re-renders with same data
    const dataChanged = prevLastModifiedRef.current !== initialData.lastModified;
    prevLastModifiedRef.current = initialData.lastModified;

    if (!dataChanged) return;

    setData(initialData);

    // Only reset builder state and forms if builder is currently closed
    // This prevents resetting mid-flow when user is adding a new pair
    if (builderState.mode === 'closed') {
      setBuilderState(
        createInitialBuilderState(
          Boolean(initialData.obsessions.length || initialData.compulsions.length)
        )
      );
      setObsessionForm(DEFAULT_OBSESSION_FORM);
      setCompulsionForm(DEFAULT_COMPULSION_FORM);
      setErrors({});
    }
  }, [initialData, builderState.mode]);

  const resetForms = useCallback(() => {
    setObsessionForm(DEFAULT_OBSESSION_FORM);
    setCompulsionForm(DEFAULT_COMPULSION_FORM);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setStep = useCallback((step: BuilderStep) => {
    setBuilderState((prev) => ({ ...prev, step }));
  }, []);

  const buildUpdatedData = useCallback(
    (obsessions: ObsessionData[], compulsions: CompulsionData[]) => ({
      obsessions,
      compulsions,
      lastModified: new Date().toISOString(),
    }),
    []
  );

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

  const applyValidation = useCallback(
    (issues: Record<string, string>) => {
      if (Object.keys(issues).length > 0) {
        setFieldErrors(issues);
        return false;
      }
      clearErrors();
      return true;
    },
    [clearErrors, setFieldErrors]
  );

  const updateBuilderState = useCallback((next: BuilderState) => {
    setBuilderState(next);
    setErrors({});
  }, []);

  const resetBuilderClosed = useCallback(() => {
    resetForms();
    updateBuilderState({ mode: 'closed', step: 'obsession', editingIndex: null });
  }, [resetForms, updateBuilderState]);

  const resetBuilderAdd = useCallback(() => {
    resetForms();
    updateBuilderState({ mode: 'add', step: 'obsession', editingIndex: null });
  }, [resetForms, updateBuilderState]);

  const beginAdd = useCallback(() => {
    resetBuilderAdd();
  }, [resetBuilderAdd]);

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
      const updated = buildUpdatedData(nextObsessions, nextCompulsions);

      setData(updated);

      const isEditingTarget = builderState.mode === 'edit' && builderState.editingIndex === index;
      const noPairsRemain = updated.obsessions.length === 0;

      if (noPairsRemain) {
        resetBuilderAdd();
      } else if (isEditingTarget) {
        resetBuilderClosed();
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
    [
      builderState,
      buildUpdatedData,
      data,
      handleChange,
      resetBuilderAdd,
      resetBuilderClosed,
      updateBuilderState,
    ]
  );

  const savePair = useCallback(async () => {
    // Read from refs to get latest values (avoids stale closure)
    const currentObsessionForm = obsessionFormRef.current;
    const currentCompulsionForm = compulsionFormRef.current;

    const compulsionErrors = validateCompulsion(currentCompulsionForm);
    if (!applyValidation(compulsionErrors)) return;

    const now = new Date().toISOString();
    const index =
      builderState.mode === 'edit' ? (builderState.editingIndex ?? 0) : data.obsessions.length;
    const existingObsession = data.obsessions[index];
    const existingCompulsion = data.compulsions[index];

    const obsessionRecord: ObsessionData = {
      id: existingObsession?.id ?? uuidv4(),
      obsession: currentObsessionForm.obsession.trim(),
      intensity: currentObsessionForm.intensity,
      triggers: currentObsessionForm.triggers
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      createdAt: existingObsession?.createdAt ?? now,
    };

    const compulsionRecord: CompulsionData = {
      id: existingCompulsion?.id ?? uuidv4(),
      compulsion: currentCompulsionForm.compulsion.trim(),
      frequency: currentCompulsionForm.frequency,
      duration: currentCompulsionForm.duration,
      reliefLevel: currentCompulsionForm.reliefLevel,
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

    const updated = buildUpdatedData(nextObsessions, nextCompulsions);

    resetBuilderClosed();
    await handleChange(updated);
  }, [
    applyValidation,
    builderState,
    buildUpdatedData,
    data,
    handleChange,
    validateCompulsion,
    resetBuilderClosed,
  ]);

  const goToCompulsionStep = useCallback(() => setStep('compulsion'), [setStep]);

  const handleObsessionNext = useCallback(() => {
    // Read from ref to get latest value (avoids stale closure)
    const currentObsessionForm = obsessionFormRef.current;
    const issues = validateObsession(currentObsessionForm);
    if (!applyValidation(issues)) return;
    goToCompulsionStep();
  }, [applyValidation, goToCompulsionStep, validateObsession]);

  const dismiss = useCallback(() => {
    resetBuilderClosed();
  }, [resetBuilderClosed]);

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
