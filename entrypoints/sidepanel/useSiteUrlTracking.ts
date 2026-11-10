import { useEffect, useRef } from 'preact/hooks';
import { browser } from 'wxt/browser';
import { createFrameAttribution } from '../../lib/navigation/attribution';
import { withSiteUrl } from '../../lib/storage';
import type { Site, TabState } from '../../lib/storage';

interface NavigationDetails {
  tabId: number;
  frameId: number;
  parentFrameId: number;
  url: string;
}

export async function isExtensionChildFrame(details: NavigationDetails): Promise<boolean> {
  if (details.frameId === 0) return false;
  try {
    const parent = await browser.webNavigation.getFrame({
      tabId: details.tabId,
      frameId: details.parentFrameId,
    });
    return parent?.url?.startsWith(browser.runtime.getURL('/')) ?? false;
  } catch {
    return false;
  }
}

/**
 * Records the current URL of each embedded site into the tab state, using sub frame navigation
 * events limited to frames whose parent is an extension page.
 */
export function useSiteUrlTracking(
  sites: Site[],
  update: (change: (state: TabState) => TabState) => Promise<void>,
): void {
  const latest = useRef({ sites, update });
  latest.current = { sites, update };

  useEffect(() => {
    const attribute = createFrameAttribution();
    const handle = async (details: NavigationDetails) => {
      if (!(await isExtensionChildFrame(details))) return;
      const siteId = attribute(latest.current.sites, details);
      if (siteId) void latest.current.update((state) => withSiteUrl(state, siteId, details.url));
    };
    const { onCommitted, onHistoryStateUpdated } = browser.webNavigation;
    onCommitted.addListener(handle);
    onHistoryStateUpdated.addListener(handle);
    return () => {
      onCommitted.removeListener(handle);
      onHistoryStateUpdated.removeListener(handle);
    };
  }, []);
}
