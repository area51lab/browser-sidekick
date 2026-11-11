import { useState } from 'preact/hooks';
import './sites.css';
import type { Site } from '../lib/storage';
import type { SiteFormProps } from './SiteForm';
import { SiteForm } from './SiteForm';
import { SiteList } from './SiteList';

export type SitesSectionProps = Pick<SiteFormProps, 'store' | 'requestOrigin' | 'fetchMetadata'>;

export function SitesSection(props: SitesSectionProps) {
  const [editing, setEditing] = useState<Site | null>(null);

  return (
    <section class="sites" aria-labelledby="sites-heading">
      <h2 id="sites-heading">Sites</h2>
      <div class="sites__card">
        <SiteList
          store={props.store}
          onEdit={setEditing}
          onRemove={(site) => site.id === editing?.id && setEditing(null)}
          editingId={editing?.id}
          renderEditor={(site) => (
            <SiteForm {...props} key={site.id} site={site} onDone={() => setEditing(null)} />
          )}
        />
        <div class="sites__add">
          <SiteForm {...props} key="new" />
        </div>
      </div>
    </section>
  );
}
