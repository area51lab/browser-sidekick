import { displayName } from '../lib/storage';
import type { Site } from '../lib/storage';

export const SiteView = ({ site, url }: { site: Site; url: string }) => (
  <iframe class="site-view" title={displayName(site)} src={url} />
);
