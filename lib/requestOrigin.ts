import { browser } from 'wxt/browser';

export type RequestOrigin = (url: string) => Promise<boolean>;

export const originPattern = (url: string): string => `${new URL(url).origin}/*`;

export const requestOrigin: RequestOrigin = async (url) => {
  try {
    return await browser.permissions.request({ origins: [originPattern(url)] });
  } catch {
    return false;
  }
};
