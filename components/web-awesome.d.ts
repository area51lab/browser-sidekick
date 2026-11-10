import 'preact';

type ElementProps = import('preact').JSX.HTMLAttributes<HTMLElement>;

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': ElementProps & { variant?: string; appearance?: string };
    }
  }
}
