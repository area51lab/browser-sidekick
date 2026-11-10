import '@awesome.me/webawesome/dist/components/button/button.js';

interface HelloProps {
  surface: string;
}

export function Hello({ surface }: HelloProps) {
  return (
    <main class="surface">
      <h1>Hello sidekick</h1>
      <p>Running in the {surface}.</p>
      <wa-button variant="brand">Web Awesome works</wa-button>
    </main>
  );
}
