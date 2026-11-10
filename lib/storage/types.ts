export type NavigationMode = 'dropdown' | 'icon-sidebar' | 'top-bar';
export type TopBarDisplay = 'icons' | 'names';
export type Persistence = 'last-url' | 'configured-url';

export interface Site {
  id: string;
  url: string;
  title: string;
  customName?: string;
  faviconUrl?: string;
  createdAt: number;
}

export interface Settings {
  navigationMode: NavigationMode;
  topBarDisplay: TopBarDisplay;
  persistence: Persistence;
  useBrowserThemeColors?: boolean;
}

export interface TabState {
  tabId: number;
  activeItemId: string;
  urlBySiteId: Record<string, string>;
}

export interface Notes {
  markdown: string;
  updatedAt: number;
}

export const NAVIGATION_MODES: readonly NavigationMode[] = ['dropdown', 'icon-sidebar', 'top-bar'];
export const TOP_BAR_DISPLAYS: readonly TopBarDisplay[] = ['icons', 'names'];
export const PERSISTENCE_MODES: readonly Persistence[] = ['last-url', 'configured-url'];

export const DEFAULT_SETTINGS: Settings = {
  navigationMode: 'dropdown',
  topBarDisplay: 'icons',
  persistence: 'last-url',
  useBrowserThemeColors: true,
};

export const DEFAULT_NOTES: Notes = { markdown: '', updatedAt: 0 };

export const defaultTabState = (tabId: number): TabState => ({
  tabId,
  activeItemId: '',
  urlBySiteId: {},
});
