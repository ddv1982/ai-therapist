export type BuilderMode = 'closed' | 'add' | 'edit';
export type BuilderStep = 'obsession' | 'compulsion';

export interface BuilderState {
  mode: BuilderMode;
  step: BuilderStep;
  editingIndex: number | null;
}

export interface ObsessionFormState {
  obsession: string;
  intensity: number;
  triggers: string;
}

export interface CompulsionFormState {
  compulsion: string;
  frequency: number;
  duration: number;
  reliefLevel: number;
}

export interface FlowTexts {
  validation: Record<string, string>;
  labels: Record<string, string>;
}
