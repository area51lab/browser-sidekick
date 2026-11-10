import { browser } from 'wxt/browser';
import { originPattern } from './rules';

/**
 * Must be called from a user gesture (for example the add-site submit
 * handler). Resolves true when the extension may access the site origin.
 */
export async function ensureSitePermission(url: string): Promise<boolean> {
  const pattern = originPattern(url);
  if (!pattern) return false;
  const permissions = { origins: [pattern] };
  if (await browser.permissions.contains(permissions)) return true;
  return browser.permissions.request(permissions);
}
