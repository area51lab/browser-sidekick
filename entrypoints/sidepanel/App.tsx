import type { Store } from '../../lib/storage';
import { Panel } from './Panel';
import { useActiveTabId } from './useActiveTabId';

export function App({ store }: { store?: Store }) {
  const tabId = useActiveTabId();
  return tabId === undefined ? null : <Panel key={tabId} tabId={tabId} store={store} />;
}
