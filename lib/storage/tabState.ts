import type { TabState } from './types';

export const withActiveItem = (state: TabState, activeItemId: string): TabState =>
  state.activeItemId === activeItemId ? state : { ...state, activeItemId };

export const withSiteUrl = (state: TabState, siteId: string, url: string): TabState =>
  state.urlBySiteId[siteId] === url
    ? state
    : { ...state, urlBySiteId: { ...state.urlBySiteId, [siteId]: url } };
