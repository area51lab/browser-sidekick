import '@awesome.me/webawesome/dist/components/details/details.js';
import './settings.css';
import { browser } from 'wxt/browser';
import { DISPLAY_NAME } from '../../lib/brand';

export const SOURCE_URL = 'https://github.com/area51lab/browser-sidekick';

export interface AboutSectionProps {
  version?: string;
}

export function AboutSection({
  version = browser.runtime.getManifest().version,
}: AboutSectionProps) {
  return (
    <section class="settings-section" aria-labelledby="about-heading">
      <h2 id="about-heading">About</h2>
      <p>
        {DISPLAY_NAME} version {version}
      </p>
      <wa-details summary="Documentation and source">
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          README and source code
        </a>
      </wa-details>
    </section>
  );
}
