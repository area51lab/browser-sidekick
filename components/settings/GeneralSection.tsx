import '@awesome.me/webawesome/dist/components/switch/switch.js';
import './settings.css';
import { useSettings } from '../../lib/storage';
import type { Settings, Store } from '../../lib/storage';
import { PreviewField } from './PreviewField';
import { NavigationPreview, TopBarPreview } from './Previews';
import { RadioField } from './RadioField';
import {
  NAVIGATION_CHOICES,
  PERSISTENCE_CHOICES,
  TOP_BAR_CHOICES,
  showsTopBarDisplay,
} from './options';

export interface GeneralSectionProps {
  store?: Store;
}

export function GeneralSection({ store }: GeneralSectionProps) {
  const { value: settings, ready, update } = useSettings(store);
  const patch = (change: Partial<Settings>) =>
    void update((current: Settings) => ({ ...current, ...change }));

  return (
    <section class="settings-section" aria-labelledby="general-heading" aria-busy={!ready}>
      <h2 id="general-heading">General</h2>
      <PreviewField
        label="Navigation"
        name="navigationMode"
        value={settings.navigationMode}
        choices={NAVIGATION_CHOICES}
        preview={(mode) => <NavigationPreview mode={mode} />}
        onChange={(navigationMode) => patch({ navigationMode })}
      />
      {showsTopBarDisplay(settings) && (
        <PreviewField
          label="Top bar shows"
          name="topBarDisplay"
          value={settings.topBarDisplay}
          choices={TOP_BAR_CHOICES}
          preview={(display) => <TopBarPreview display={display} />}
          onChange={(topBarDisplay) => patch({ topBarDisplay })}
        />
      )}
      <RadioField
        label="When opening a site"
        name="persistence"
        value={settings.persistence}
        choices={PERSISTENCE_CHOICES}
        onChange={(persistence) => patch({ persistence })}
      />
      <div class="field field--row">
        <wa-switch
          name="useBrowserThemeColors"
          checked={settings.useBrowserThemeColors !== false}
          onChange={(event: Event) =>
            patch({ useBrowserThemeColors: (event.currentTarget as HTMLInputElement).checked })
          }
        >
          Use browser theme colors
        </wa-switch>
      </div>
    </section>
  );
}
