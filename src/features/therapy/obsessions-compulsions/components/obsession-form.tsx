import type { ObsessionFormState } from './types';
import { ObsessionsFormSection } from './obsessions-form-section';

interface ObsessionFormProps {
  form: ObsessionFormState;
  errors: Record<string, string>;
  onChange: (updater: (prev: ObsessionFormState) => ObsessionFormState) => void;
  intensityLabel: string;
  triggersPlaceholder: string;
  descriptionPlaceholder: string;
}

export function ObsessionForm({
  form,
  errors,
  onChange,
  intensityLabel,
  triggersPlaceholder,
  descriptionPlaceholder,
}: ObsessionFormProps) {
  const update = (partial: Partial<ObsessionFormState>) =>
    onChange((prev) => ({ ...prev, ...partial }));

  return (
    <ObsessionsFormSection
      textarea={{
        value: form.obsession,
        onChange: (value) => update({ obsession: value }),
        placeholder: descriptionPlaceholder,
        error: errors.obsession,
      }}
      fieldsClassName="flex flex-col gap-4 sm:flex-row"
      fields={[
        {
          kind: 'slider',
          label: `${intensityLabel}: ${form.intensity}/10`,
          value: form.intensity,
          onChange: (value) => update({ intensity: value }),
          min: 1,
          max: 10,
          step: 1,
          showError: false,
        },
        {
          kind: 'input',
          value: form.triggers,
          onChange: (value) => update({ triggers: value }),
          placeholder: triggersPlaceholder,
          className: 'text-sm',
          showError: false,
        },
      ]}
    />
  );
}
