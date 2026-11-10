import type { NavigationMode, Persistence, Settings, TopBarDisplay } from '../../lib/storage';

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint: string;
}

export type SettingsWithTheme = Settings & { useBrowserThemeColors?: boolean };

export const NAVIGATION_CHOICES: readonly Choice<NavigationMode>[] = [
  { value: 'dropdown', label: 'Dropdown', hint: 'Pick a site from a menu at the top.' },
  { value: 'icon-sidebar', label: 'Icon sidebar', hint: 'A slim column of site icons.' },
  { value: 'top-bar', label: 'Top bar', hint: 'A row of tabs at the top.' },
];

export const TOP_BAR_CHOICES: readonly Choice<TopBarDisplay>[] = [
  { value: 'icons', label: 'Icons', hint: 'Show only site icons.' },
  { value: 'names', label: 'Names', hint: 'Show site names.' },
];

export const PERSISTENCE_CHOICES: readonly Choice<Persistence>[] = [
  { value: 'last-url', label: 'Remember last URL', hint: 'Reopen each site where you left it.' },
  {
    value: 'configured-url',
    label: 'Always return to configured URL',
    hint: 'Every site starts from its saved address.',
  },
];

export const showsTopBarDisplay = (settings: Settings): boolean =>
  settings.navigationMode === 'top-bar';

export const supportsThemeColors = (settings: SettingsWithTheme): boolean =>
  typeof settings.useBrowserThemeColors === 'boolean';
