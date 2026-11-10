import { useState } from 'preact/hooks';
import '@awesome.me/webawesome/dist/components/button/button.js';
import './sites.css';
import { displayName, removeSite, reorderSites, useSites } from '../lib/storage';
import type { Site, Store } from '../lib/storage';
import { SiteIcon } from './SiteIcon';

export interface SiteListProps {
  store?: Store;
  onEdit?: (site: Site) => void;
  onRemove?: (site: Site) => void;
}

export function SiteList({ store, onEdit, onRemove }: SiteListProps) {
  const sites = useSites(store);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (sites.ready && sites.value.length === 0) return <p>No sites yet. Add one above.</p>;

  const move = (site: Site, index: number) =>
    sites.update((current) => reorderSites(current, site.id, index));

  const endDrag = () => {
    setDragId(null);
    setOverIndex(null);
  };

  const drop = (index: number) => {
    const id = dragId;
    endDrag();
    if (id) void sites.update((current) => reorderSites(current, id, index));
  };

  const remove = async (site: Site) => {
    await sites.update((current) => removeSite(current, site.id));
    setConfirmingId(null);
    onRemove?.(site);
  };

  return (
    <ul class="site-list" aria-label="Sites">
      {sites.value.map((site, index) => (
        <li
          class={`site-row${dragId === site.id ? ' site-row--dragging' : ''}${
            dragId && dragId !== site.id && overIndex === index ? ' site-row--over' : ''
          }`}
          key={site.id}
          draggable
          onDragStart={(event) => {
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer?.setData('text/plain', site.id);
            setDragId(site.id);
          }}
          onDragOver={(event) => {
            if (!dragId) return;
            event.preventDefault();
            setOverIndex(index);
          }}
          onDrop={(event) => {
            event.preventDefault();
            drop(index);
          }}
          onDragEnd={endDrag}
        >
          <span class="site-row__handle" aria-hidden="true" title="Drag to reorder">
            ⠿
          </span>
          <SiteIcon src={site.faviconUrl} />
          <div class="site-row__text">
            <strong>{displayName(site)}</strong>
            <span class="site-row__url">{site.url}</span>
          </div>
          {confirmingId === site.id ? (
            <div
              class="site-row__actions"
              role="group"
              aria-label={`Confirm deleting ${displayName(site)}`}
            >
              <span>Delete?</span>
              <wa-button variant="danger" size="small" onClick={() => void remove(site)}>
                Confirm
              </wa-button>
              <wa-button size="small" onClick={() => setConfirmingId(null)}>
                Cancel
              </wa-button>
            </div>
          ) : (
            <div class="site-row__actions">
              <wa-button
                size="small"
                aria-label={`Move ${displayName(site)} up`}
                disabled={index === 0}
                onClick={() => void move(site, index - 1)}
              >
                ↑
              </wa-button>
              <wa-button
                size="small"
                aria-label={`Move ${displayName(site)} down`}
                disabled={index === sites.value.length - 1}
                onClick={() => void move(site, index + 1)}
              >
                ↓
              </wa-button>
              <wa-button size="small" onClick={() => onEdit?.(site)}>
                Edit
              </wa-button>
              <wa-button
                size="small"
                variant="danger"
                appearance="outlined"
                onClick={() => setConfirmingId(site.id)}
              >
                Delete
              </wa-button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
