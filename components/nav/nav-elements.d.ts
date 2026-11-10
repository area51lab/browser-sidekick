import 'preact';

type ElementProps = import('preact').JSX.HTMLAttributes<HTMLElement>;

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'wa-select': ElementProps & { value?: string };
      'wa-option': ElementProps & { value?: string };
      'wa-tooltip': ElementProps & { for?: string; placement?: string };
    }
  }
}
