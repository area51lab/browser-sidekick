import { browser } from 'wxt/browser';
import { permissionPatterns } from './rules';

/** True when the extension already has access to the site's parent domain. */
export async function hasSitePermission(url: string): Promise<boolean> {
  const origins = permissionPatterns(url);
  if (!origins) return false;
  return browser.permissions.contains({ origins });
}

/**
 * Must be called from a user gesture (for example the add-site submit
 * handler or the "Grant access" button). Resolves true when the extension
 * may access the site's parent domain and its subdomains.
 */
export async function ensureSitePermission(url: string): Promise<boolean> {
  const origins = permissionPatterns(url);
  if (!origins) return false;
  if (await browser.permissions.contains({ origins })) return true;
  return browser.permissions.request({ origins });
}
