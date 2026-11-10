import 'preact';

type ElementProps = import('preact').JSX.HTMLAttributes<HTMLElement>;

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
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
      'wa-callout': ElementProps & { variant?: string };
    }
  }
}
