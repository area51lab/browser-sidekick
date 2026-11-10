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
      <SiteForm
        {...props}
        key={editing?.id ?? 'new'}
        site={editing ?? undefined}
        onDone={() => setEditing(null)}
      />
      <SiteList
        store={props.store}
        onEdit={setEditing}
        onRemove={(site) => site.id === editing?.id && setEditing(null)}
      />
    </section>
  );
}
