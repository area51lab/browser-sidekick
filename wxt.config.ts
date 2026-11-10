import { defineConfig } from 'wxt';
import { APP_NAME, DISPLAY_NAME } from './lib/brand';
import preact from '@preact/preset-vite';

export default defineConfig({
  vite: () => ({ plugins: [preact()] }),
  manifest: ({ browser }) => ({
    name: APP_NAME,
    description: 'Side panel with your favorite websites and notes',
    action: { default_title: DISPLAY_NAME },
    permissions: ['storage', 'declarativeNetRequest', 'webNavigation'],
    optional_host_permissions: ['<all_urls>'],
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
