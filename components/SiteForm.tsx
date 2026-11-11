import { useRef, useState } from 'preact/hooks';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import './sites.css';
import { ensureSitePermission } from '../lib/embedding/permissions';
import { isEmbeddingUnsupported } from '../lib/embedding/unsupported';
import { fetchSiteMetadata, normalizeUrl } from '../lib/siteMetadata';
import type { SiteMetadata } from '../lib/siteMetadata';
import { addSite, createSite, updateSite, useSites } from '../lib/storage';
import type { Site, Store } from '../lib/storage';
import { SiteIcon } from './SiteIcon';

export type RequestOrigin = (url: string) => Promise<boolean>;

export interface SiteFormProps {
  site?: Site;
  store?: Store;
  requestOrigin?: RequestOrigin;
  fetchMetadata?: (url: string) => Promise<SiteMetadata>;
  onDone?: () => void;
}

type Status = 'idle' | 'loading' | 'error';
type Details = { url: string; title: string; faviconUrl: string };

const MESSAGES = {
  invalid: 'Enter a valid http(s) address.',
  denied: 'Access to this site was not granted, so its name and icon could not be loaded.',
  unsupported:
    'This site is known to block embedding in ways Sidekick cannot bypass. You can still add it and use "Open in tab" if it does not load.',
  failed: 'Could not load the site details. You can still save it with your own name.',
};

const hostnameOf = (url: string): string => new URL(url).hostname;
const valueOf = (event: Event): string => (event.currentTarget as HTMLInputElement).value;

export function SiteForm({
  site,
  store,
  requestOrigin = ensureSitePermission,
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
  const loaded = useRef<Details | null>(
    site ? { url: site.url, title: site.title, faviconUrl: site.faviconUrl ?? '' } : null,
  );
  const pending = useRef<{ url: string; promise: Promise<Details | null> } | null>(null);
  const latest = useRef(0);

  const fail = (text: string) => {
    setStatus('error');
    setMessage(text);
  };

  function load(): Promise<Details | null> {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      fail(MESSAGES.invalid);
      return Promise.resolve(null);
    }
    if (loaded.current?.url === normalized) return Promise.resolve(loaded.current);
    if (pending.current?.url === normalized) return pending.current.promise;
    const promise = fetchDetails(normalized);
    pending.current = { url: normalized, promise };
    void promise.finally(() => {
      if (pending.current?.promise === promise) pending.current = null;
    });
    return promise;
  }

  async function fetchDetails(normalized: string): Promise<Details | null> {
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
    else if (isEmbeddingUnsupported(normalized)) fail(MESSAGES.unsupported);
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
      <div class="site-form__fields">
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
      </div>
      {status === 'error' && (
        <wa-callout variant="warning" role="alert">
          {message}
        </wa-callout>
      )}
      <div class="site-form__footer">
        <div class="site-form__preview">
          {status === 'loading' && <wa-spinner aria-label="Loading site details" />}
          {status === 'loading' && <span>Loading site details…</span>}
          {status !== 'loading' && faviconUrl && <SiteIcon src={faviconUrl} />}
        </div>
        <div class="site-form__actions">
          {site && (
            <wa-button type="button" onClick={onDone}>
              Cancel
            </wa-button>
          )}
          <wa-button type="submit" variant="brand">
            {site ? 'Save' : 'Add site'}
          </wa-button>
        </div>
      </div>
    </form>
  );
}
