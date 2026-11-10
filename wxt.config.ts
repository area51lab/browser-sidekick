import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  vite: () => ({ plugins: [preact()] }),
  manifest: {
    name: 'sidekick',
    description: 'Side panel with your favorite websites and notes',
    action: { default_title: 'sidekick' },
    permissions: ['storage'],
  },
});
