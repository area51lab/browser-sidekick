import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import { browser } from 'wxt/browser';
import { ensureSitePermission, hasSitePermission } from '../lib/embedding/permissions';

export const FRAME_LOAD_TIMEOUT_MS = 10_000;

type FrameStatus = 'loading' | 'ready' | 'refused' | 'no-access';

interface SiteFrameProps {
  url: string;
  title?: string;
  timeoutMs?: number;
}

export function isBlankFrame(frame: HTMLIFrameElement): boolean {
  try {
    const location = frame.contentDocument?.location.href;
    return location === 'about:blank';
  } catch {
    return false;
  }
}

export function SiteFrame(props: SiteFrameProps) {
  return <SiteFrameView key={props.url} {...props} />;
}

function SiteFrameView({ url, title, timeoutMs = FRAME_LOAD_TIMEOUT_MS }: SiteFrameProps) {
  const [status, setStatus] = useState<FrameStatus>('loading');
  const [attempt, setAttempt] = useState(0);
  const [denied, setDenied] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let active = true;
    void hasSitePermission(url).then((granted) => {
      if (active && !granted) setStatus('no-access');
    });
    return () => {
      active = false;
    };
  }, [url, attempt]);

  useEffect(() => {
    const timer = setTimeout(() => setStatus((s) => (s === 'loading' ? 'refused' : s)), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs, attempt]);

  const handleLoad = () => {
    setStatus(frame.current && isBlankFrame(frame.current) ? 'refused' : 'ready');
  };

  const openInTab = () => {
    void browser.tabs.create({ url });
  };

  const grantAccess = async () => {
    const granted = await ensureSitePermission(url).catch(() => false);
    if (!granted) {
      setDenied(true);
      return;
    }
    setDenied(false);
    setStatus('loading');
    setAttempt((n) => n + 1);
  };

  return (
    <div class="site-frame" data-status={status}>
      {status === 'loading' && <wa-spinner class="site-frame-spinner" />}
      {status === 'no-access' || status === 'refused' ? (
        <div class="site-frame-refused" role="alert">
          {status === 'no-access' ? (
            <>
              <p>Sidekick does not have access to this site, so it cannot be embedded.</p>
              <wa-button variant="brand" onClick={() => void grantAccess()}>
                Grant access
              </wa-button>
              {denied && <p>Access was not granted. Try again or use "Open in tab".</p>}
            </>
          ) : (
            <p>This site refuses to be embedded.</p>
          )}
          <wa-button variant={status === 'refused' ? 'brand' : 'neutral'} onClick={openInTab}>
            Open in tab
          </wa-button>
        </div>
      ) : (
        <iframe
          key={attempt}
          ref={frame}
          src={url}
          title={title ?? url}
          onLoad={handleLoad}
          onError={() => setStatus('refused')}
        />
      )}
    </div>
  );
}
