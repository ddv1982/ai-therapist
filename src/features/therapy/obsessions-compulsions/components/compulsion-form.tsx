import type { CompulsionFormState } from '@/features/therapy/obsessions-compulsions/components/types';
import { ObsessionsFormSection } from '@/features/therapy/obsessions-compulsions/components/obsessions-form-section';

interface CompulsionFormProps {
  form: CompulsionFormState;
  errors: Record<string, string>;
  onChange: (updater: (prev: CompulsionFormState) => CompulsionFormState) => void;
  frequencyLabel: string;
  durationLabel: string;
  reliefLabel: string;
  durationUnit: string;
  descriptionPlaceholder: string;
}

export function CompulsionForm({
  form,
  errors,
  onChange,
  frequencyLabel,
  durationLabel,
  reliefLabel,
  durationUnit,
  descriptionPlaceholder,
}: CompulsionFormProps) {
  const update = (partial: Partial<CompulsionFormState>) =>
    onChange((prev) => ({ ...prev, ...partial }));

  return (
    <ObsessionsFormSection
      textarea={{
        value: form.compulsion,
        onChange: (value) => update({ compulsion: value }),
        placeholder: descriptionPlaceholder,
        error: errors.compulsion,
      }}
      fieldsClassName="grid gap-4 sm:grid-cols-3"
      fields={[
        {
          kind: 'slider',
          label: `${frequencyLabel}: ${form.frequency}/10`,
          value: form.frequency,
          onChange: (value) => update({ frequency: value }),
          min: 1,
          max: 10,
          step: 1,
          error: errors.frequency,
        },
        {
          kind: 'input',
          label: `${durationLabel}: ${form.duration} ${durationUnit}`,
          value: form.duration,
          onChange: (value) => update({ duration: Number(value) || 0 }),
          type: 'number',
          className: 'text-sm',
          error: errors.duration,
        },
        {
          kind: 'slider',
          label: `${reliefLabel}: ${form.reliefLevel}/10`,
          value: form.reliefLevel,
          onChange: (value) => update({ reliefLevel: value }),
          min: 1,
          max: 10,
          step: 1,
          error: errors.reliefLevel,
        },
      ]}
    />
  );
}
