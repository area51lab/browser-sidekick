import { useEffect, useState } from 'preact/hooks';
import './sites.css';

export function SiteIcon({ src }: { src?: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken)
    return <span class="site-icon site-icon--empty" data-testid="site-icon-empty" />;
  return <img class="site-icon" src={src} alt="" onError={() => setBroken(true)} />;
}
