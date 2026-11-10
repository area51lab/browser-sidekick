import { useRef } from 'preact/hooks';
import { browser } from 'wxt/browser';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { Navigation } from '../../components/nav/Navigation';
import { buildNavItems, resolveActiveId } from '../../components/nav/items';
import { NOTES_ID } from '../../components/nav/types';
import { NotesTab } from '../../components/notes/NotesTab';
import { SiteView } from '../../components/SiteView';
import { resolveInitialUrl, useSettings, useSites, useTabState } from '../../lib/storage';
import type { Store } from '../../lib/storage';
import { useVisited } from './useVisited';
import '../../components/nav/nav.css';
import './panel.css';

export interface PanelProps {
  tabId: number;
  store?: Store;
}

export function Panel({ tabId, store }: PanelProps) {
  const sites = useSites(store);
  const settings = useSettings(store);
  const tabState = useTabState(tabId, store);
  const frozenUrls = useRef<Record<string, string>>({});

  const items = buildNavItems(sites.value);
  const activeId = resolveActiveId(items, tabState.value.activeItemId);
  const visited = useVisited(
    activeId,
    items.map((item) => item.id),
  );

  if (!sites.ready || !settings.ready || !tabState.ready) return null;

  const select = (id: string) => void tabState.update((state) => ({ ...state, activeItemId: id }));

  return (
    <div class={`panel panel-${settings.value.navigationMode}`}>
      <Navigation
        mode={settings.value.navigationMode}
        topBarDisplay={settings.value.topBarDisplay}
        items={items}
        activeId={activeId ?? ''}
        onSelect={select}
      />
      <main class="panel-content">
        {activeId === null && (
          <div class="panel-empty">
            <p>No sites yet. Add your favorite websites in the options page.</p>
            <wa-button variant="brand" onClick={() => void browser.runtime.openOptionsPage()}>
              Open options
            </wa-button>
          </div>
        )}
        {sites.value
          .filter((site) => visited.includes(site.id))
          .map((site) => {
            const url = (frozenUrls.current[site.id] ??= resolveInitialUrl(
              site,
              settings.value,
              tabState.value,
            ));
            return (
              <div class="panel-item" key={site.id} hidden={site.id !== activeId}>
                <SiteView site={site} url={url} />
              </div>
            );
          })}
        {visited.includes(NOTES_ID) && (
          <div class="panel-item" hidden={activeId !== NOTES_ID}>
            <NotesTab />
          </div>
        )}
      </main>
    </div>
  );
}
