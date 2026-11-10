import { useRef, useState } from 'preact/hooks';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import './sites.css';
import { requestOrigin as defaultRequestOrigin } from '../lib/requestOrigin';
import type { RequestOrigin } from '../lib/requestOrigin';
import { fetchSiteMetadata, normalizeUrl } from '../lib/siteMetadata';
import type { SiteMetadata } from '../lib/siteMetadata';
import { addSite, createSite, updateSite, useSites } from '../lib/storage';
import type { Site, Store } from '../lib/storage';
import { SiteIcon } from './SiteIcon';

export interface SiteFormProps {
  site?: Site;
  store?: Store;
  requestOrigin?: RequestOrigin;
  fetchMetadata?: (url: string) => Promise<SiteMetadata>;
  onDone?: () => void;
}

type Status = 'idle' | 'loading' | 'error';

const MESSAGES = {
  invalid: 'Enter a valid http(s) address.',
  denied: 'Access to this site was not granted, so its name and icon could not be loaded.',
  failed: 'Could not load the site details. You can still save it with your own name.',
};

const hostnameOf = (url: string): string => new URL(url).hostname;
const valueOf = (event: Event): string => (event.currentTarget as HTMLInputElement).value;

export function SiteForm({
  site,
  store,
  requestOrigin = defaultRequestOrigin,
  fetchMetadata = fetchSiteMetadata,
  onDone,
}: SiteFormProps) {
  const sites = useSites(store);
  const [url, setUrl] = useState(site?.url ?? '');
  const [name, setName] = useState(site?.customName ?? site?.title ?? '');
  const [nameEdited, setNameEdited] = useState(Boolean(site?.customName));
  const [title, setTitle] = useState(site?.title ?? '');
  const [faviconUrl, setFaviconUrl] = useState(site?.faviconUrl ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const loaded = useRef<{ url: string; title: string; faviconUrl: string } | null>(
    site ? { url: site.url, title: site.title, faviconUrl: site.faviconUrl ?? '' } : null,
  );
  const latest = useRef(0);

  const fail = (text: string) => {
    setStatus('error');
    setMessage(text);
  };

  async function load(): Promise<{ url: string; title: string; faviconUrl: string } | null> {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      fail(MESSAGES.invalid);
      return null;
    }
    if (loaded.current?.url === normalized) return loaded.current;

    const request = ++latest.current;
    setStatus('loading');
    setMessage('');
    const granted = await requestOrigin(normalized);
    const metadata: SiteMetadata = granted
      ? await fetchMetadata(normalized)
      : { title: hostnameOf(normalized), faviconUrl: '', error: 'network' };
    if (request !== latest.current) return null;

    const result = { url: normalized, title: metadata.title, faviconUrl: metadata.faviconUrl };
    loaded.current = result;
    setUrl(normalized);
    setTitle(result.title);
    setFaviconUrl(result.faviconUrl);
    if (!nameEdited) setName(result.title);
    if (!granted) fail(MESSAGES.denied);
    else if (metadata.error) fail(MESSAGES.failed);
    else setStatus('idle');
    return result;
  }

  async function submit(event: Event) {
    event.preventDefault();
    const details = await load();
    if (!details) return;
    const trimmed = name.trim();
    const fields = {
      url: details.url,
      title: details.title,
      faviconUrl: details.faviconUrl || undefined,
      customName: trimmed && trimmed !== details.title ? trimmed : undefined,
    };
    if (site) await sites.update((current) => updateSite(current, site.id, fields));
    else await sites.update((current) => addSite(current, createSite(fields)));
    if (!site) reset();
    onDone?.();
  }

  function reset() {
    loaded.current = null;
    setUrl('');
    setName('');
    setNameEdited(false);
    setTitle('');
    setFaviconUrl('');
    setStatus('idle');
    setMessage('');
  }

  return (
    <form class="site-form" onSubmit={submit} aria-label={site ? 'Edit site' : 'Add site'}>
      <wa-input
        label="Address"
        name="url"
        type="text"
        placeholder="example.com"
        required
        value={url}
        onInput={(event: Event) => setUrl(valueOf(event))}
        onBlur={() => url.trim() && void load()}
      />
      <wa-input
        label="Name"
        name="name"
        type="text"
        placeholder={title || 'Taken from the site'}
        value={name}
        onInput={(event: Event) => {
          setName(valueOf(event));
          setNameEdited(true);
        }}
      />
      <div class="site-form__preview">
        <SiteIcon src={faviconUrl} />
        {status === 'loading' && <wa-spinner aria-label="Loading site details" />}
        {status === 'loading' && <span>Loading site details…</span>}
      </div>
      {status === 'error' && (
        <wa-callout variant="warning" role="alert">
          {message}
        </wa-callout>
      )}
      <div class="site-form__actions">
        <wa-button type="submit" variant="brand" disabled={status === 'loading'}>
          {site ? 'Save' : 'Add site'}
        </wa-button>
        {site && (
          <wa-button type="button" onClick={onDone}>
            Cancel
          </wa-button>
        )}
      </div>
    </form>
  );
}
