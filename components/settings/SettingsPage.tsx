import { SitesSection } from '../SitesSection';
import type { SitesSectionProps } from '../SitesSection';
import { AboutSection } from './AboutSection';
import { GeneralSection } from './GeneralSection';
import './settings.css';

export type SettingsPageProps = Partial<SitesSectionProps>;

export function SettingsPage(props: SettingsPageProps) {
  return (
    <main class="settings-page">
      <h1>sidekick</h1>
      <GeneralSection store={props.store} />
      <SitesSection {...props} />
      <AboutSection />
    </main>
  );
}
