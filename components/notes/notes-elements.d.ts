import 'preact';

type ElementProps = import('preact').JSX.HTMLAttributes<HTMLElement>;

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
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
