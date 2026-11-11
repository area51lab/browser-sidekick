import { useEffect, useRef } from 'preact/hooks';
import { browser } from 'wxt/browser';
import { createFrameAttribution } from '../../lib/navigation/attribution';
import { isExtensionChildFrame } from '../../lib/navigation/frames';
import type { FrameDetails } from '../../lib/navigation/frames';
import { withSiteUrl } from '../../lib/storage';
import type { PanelState, Site } from '../../lib/storage';

type NavigationDetails = FrameDetails;

export { isExtensionChildFrame };

/**
 * Records the current URL of each embedded site into the panel state, using sub frame navigation
 * events limited to frames whose parent is an extension page.
 */
export function useSiteUrlTracking(
  sites: Site[],
  update: (change: (state: PanelState) => PanelState) => Promise<void>,
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
