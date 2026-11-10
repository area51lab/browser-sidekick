import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'entrypoints/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.css', 'entrypoints/**/main.tsx', 'entrypoints/background.ts'],
      reporter: ['text', 'json-summary'],
    },
  },
});
