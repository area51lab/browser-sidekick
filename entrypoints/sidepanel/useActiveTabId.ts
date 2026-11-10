import { useEffect, useState } from 'preact/hooks';
import { browser } from 'wxt/browser';

export function useActiveTabId(): number | undefined {
  const [tabId, setTabId] = useState<number>();

  useEffect(() => {
    let windowId: number | undefined;
    const onActivated = (info: { tabId: number; windowId: number }) => {
      if (windowId === undefined || info.windowId === windowId) setTabId(info.tabId);
    };
    void browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id === undefined) return;
      windowId = tab.windowId;
      setTabId((current) => current ?? tab.id);
    });
    browser.tabs.onActivated.addListener(onActivated);
    return () => browser.tabs.onActivated.removeListener(onActivated);
  }, []);

  return tabId;
}
