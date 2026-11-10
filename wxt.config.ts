import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

export default defineConfig({
  vite: () => ({ plugins: [preact()] }),
  manifest: ({ browser }) => ({
    name: 'sidekick',
    description: 'Side panel with your favorite websites and notes',
    action: { default_title: 'sidekick' },
    permissions: ['storage', 'declarativeNetRequest', 'webNavigation'],
    optional_host_permissions: ['https://*/*', 'http://*/*'],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'sidekick@sidekick.extension',
          strict_min_version: '128.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
