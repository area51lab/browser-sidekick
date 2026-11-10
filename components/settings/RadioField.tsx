import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import type { Choice } from './options';

export interface RadioFieldProps<T extends string> {
  label: string;
  name: string;
  value: T;
  choices: readonly Choice<T>[];
  onChange(value: T): void;
}

export function RadioField<T extends string>({
  label,
  name,
  value,
  choices,
  onChange,
}: RadioFieldProps<T>) {
  return (
    <wa-radio-group
      class="field"
      label={label}
      name={name}
      value={value}
      onChange={(event: Event) => {
        const next = (event.currentTarget as HTMLElement & { value: T }).value;
        if (next !== value) onChange(next);
      }}
    >
      {choices.map((choice) => (
        <wa-radio value={choice.value}>
          {choice.label}
          <span class="field__hint">{choice.hint}</span>
        </wa-radio>
      ))}
    </wa-radio-group>
  );
}
