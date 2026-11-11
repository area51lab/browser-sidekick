import type { ComponentChildren } from 'preact';
import type { Choice } from './options';

export interface PreviewFieldProps<T extends string> {
  label: string;
  name: string;
  value: T;
  choices: readonly Choice<T>[];
  preview(value: T): ComponentChildren;
  onChange(value: T): void;
}

/** A radio group where each option shows a small preview of how it looks. */
export function PreviewField<T extends string>({
  label,
  name,
  value,
  choices,
  preview,
  onChange,
}: PreviewFieldProps<T>) {
  return (
    <fieldset class="preview-field" data-name={name}>
      <legend>{label}</legend>
      <div class="preview-field__grid">
        {choices.map((choice) => (
          <label class="preview-card" key={choice.value}>
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={choice.value === value}
              onChange={() => choice.value !== value && onChange(choice.value)}
            />
            <span class="preview-card__frame" aria-hidden="true">
              {preview(choice.value)}
            </span>
            <span class="preview-card__label">{choice.label}</span>
            <span class="field__hint">{choice.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
