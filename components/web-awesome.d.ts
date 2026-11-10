import 'preact';

type ElementProps = import('preact').JSX.HTMLAttributes<HTMLElement>;

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': ElementProps & { variant?: string; appearance?: string };
      'wa-callout': ElementProps & { variant?: string };
      'wa-input': ElementProps & {
        label?: string;
        hint?: string;
        type?: string;
        placeholder?: string;
        value?: string;
        required?: boolean;
        name?: string;
      };
      'wa-spinner': ElementProps;
      'wa-textarea': ElementProps & {
        value?: string;
        placeholder?: string;
        resize?: string;
        rows?: number;
        label?: string;
        'aria-label'?: string;
      };
    }
  }
}
