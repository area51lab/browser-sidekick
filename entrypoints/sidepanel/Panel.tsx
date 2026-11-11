import { useRef, useState } from 'preact/hooks';
import { browser } from 'wxt/browser';
import '@awesome.me/webawesome/dist/components/button/button.js';
import { Navigation } from '../../components/nav/Navigation';
import { buildNavItems, resolveActiveId } from '../../components/nav/items';
import { NOTES_ID } from '../../components/nav/types';
import { NotesTab } from '../../components/notes/NotesTab';
import { SettingsPage } from '../../components/settings/SettingsPage';
import { SiteView } from '../../components/SiteView';
import {
  resolveInitialUrl,
  useSettings,
  useSites,
  usePanelState,
  withActiveItem,
} from '../../lib/storage';
import type { Store } from '../../lib/storage';
import { useSiteUrlTracking } from './useSiteUrlTracking';
import { useVisited } from './useVisited';
import '../../components/nav/nav.css';
import './panel.css';

export interface PanelProps {
  store?: Store;
}

export function Panel({ store }: PanelProps) {
  const sites = useSites(store);
  const settings = useSettings(store);
  const panelState = usePanelState(store);
  useSiteUrlTracking(sites.value, panelState.update);
  const [showSettings, setShowSettings] = useState(false);
  const frozenUrls = useRef<Record<string, string>>({});

  const items = buildNavItems(sites.value);
  const activeId = resolveActiveId(items, panelState.value.activeItemId);
  const visited = useVisited(
    activeId,
    items.map((item) => item.id),
  );

  if (!sites.ready || !settings.ready || !panelState.ready) return null;

  const select = (id: string) => void panelState.update((state) => withActiveItem(state, id));

  return (
    <div class="panel">
      {showSettings && (
        <div class="panel-settings">
          <SettingsPage store={store} onBack={() => setShowSettings(false)} />
        </div>
      )}
      <div class={`panel-sites panel-${settings.value.navigationMode}`} hidden={showSettings}>
        <Navigation
          mode={settings.value.navigationMode}
          topBarDisplay={settings.value.topBarDisplay}
          items={items}
          activeId={activeId ?? ''}
          onSelect={select}
          onOpenSettings={() => setShowSettings(true)}
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
                panelState.value,
              ));
              return (
                <div class="panel-item" key={site.id} hidden={site.id !== activeId}>
                  <SiteView site={site} url={url} />
                </div>
              );
            })}
          {visited.includes(NOTES_ID) && (
            <div class="panel-item" hidden={activeId !== NOTES_ID}>
              <NotesTab store={store} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
