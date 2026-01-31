import type {
  ObsessionFormState,
  CompulsionFormState,
} from '@/features/therapy/obsessions-compulsions/components/types';

export const DEFAULT_OBSESSION_FORM: ObsessionFormState = {
  obsession: '',
  intensity: 5,
  triggers: '',
};

export const DEFAULT_COMPULSION_FORM: CompulsionFormState = {
  compulsion: '',
  frequency: 5,
  duration: 10,
  reliefLevel: 5,
};
