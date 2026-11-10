import { Panel } from './Panel';
import { useActiveTabId } from './useActiveTabId';

export function App() {
  const tabId = useActiveTabId();
  return tabId === undefined ? null : <Panel key={tabId} tabId={tabId} />;
}
