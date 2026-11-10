import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import { browser } from 'wxt/browser';

export const FRAME_LOAD_TIMEOUT_MS = 10_000;

type FrameStatus = 'loading' | 'ready' | 'refused';

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
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setStatus((s) => (s === 'loading' ? 'refused' : s)), timeoutMs);
    return () => clearTimeout(timer);
  }, [timeoutMs]);

  const handleLoad = () => {
    setStatus(frame.current && isBlankFrame(frame.current) ? 'refused' : 'ready');
  };

  const openInTab = () => {
    void browser.tabs.create({ url });
  };

  return (
    <div class="site-frame" data-status={status}>
      {status === 'loading' && <wa-spinner class="site-frame-spinner" />}
      {status === 'refused' ? (
        <div class="site-frame-refused" role="alert">
          <p>This site refuses to be embedded.</p>
          <wa-button variant="brand" onClick={openInTab}>
            Open in tab
          </wa-button>
        </div>
      ) : (
        <iframe
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
