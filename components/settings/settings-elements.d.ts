import 'preact';

type ElementProps = import('preact').JSX.HTMLAttributes<HTMLElement>;

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'wa-radio-group': ElementProps & {
        label?: string;
        hint?: string;
        value?: string;
        orientation?: string;
      };
      'wa-radio': ElementProps & { value?: string; disabled?: boolean };
      'wa-switch': ElementProps & { checked?: boolean; disabled?: boolean };
      'wa-details': ElementProps & { summary?: string; open?: boolean };
    }
  }
}
