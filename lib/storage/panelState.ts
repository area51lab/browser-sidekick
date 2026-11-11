import type { PanelState } from './types';

export const withActiveItem = (state: PanelState, activeItemId: string): PanelState =>
  state.activeItemId === activeItemId ? state : { ...state, activeItemId };

export const withSiteUrl = (state: PanelState, siteId: string, url: string): PanelState =>
  state.urlBySiteId[siteId] === url
    ? state
    : { ...state, urlBySiteId: { ...state.urlBySiteId, [siteId]: url } };
