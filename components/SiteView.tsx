import { displayName } from '../lib/storage';
import type { Site } from '../lib/storage';
import { SiteFrame } from './SiteFrame';

export const SiteView = ({ site, url }: { site: Site; url: string }) => (
  <SiteFrame url={url} title={displayName(site)} />
);
