import { browser } from 'wxt/browser';

export interface FrameDetails {
  tabId: number;
  frameId: number;
  parentFrameId: number;
  url: string;
}

/** True when the frame is a sub frame whose parent is an extension page (our site iframes). */
export async function isExtensionChildFrame(details: FrameDetails): Promise<boolean> {
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

const BLOCKED_ERROR = /BLOCKED_BY_RESPONSE|XFO|X_FRAME|CSP_VIOLATION|FRAME_ANCESTORS/i;

/** Whether a webNavigation error means the site refused to be framed (header based). */
export const isFramingRefusal = (error: string): boolean => BLOCKED_ERROR.test(error);
