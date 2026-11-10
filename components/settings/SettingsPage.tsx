import { DISPLAY_NAME } from '../../lib/brand';
import { SitesSection } from '../SitesSection';
import type { SitesSectionProps } from '../SitesSection';
import { AboutSection } from './AboutSection';
import { GeneralSection } from './GeneralSection';
import './settings.css';

export interface SettingsPageProps extends Partial<SitesSectionProps> {
  /** When set (in-panel view), shows a way back to the sites. */
  onBack?: () => void;
}

export function SettingsPage({ onBack, ...props }: SettingsPageProps) {
  return (
    <main class="settings-page">
      {onBack && (
        <button type="button" class="settings-back" onClick={onBack}>
          ← Back to sites
        </button>
      )}
      <h1>{DISPLAY_NAME}</h1>
      <GeneralSection store={props.store} />
      <SitesSection {...props} />
      <AboutSection />
    </main>
  );
}
