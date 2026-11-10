import { NavIcon } from './NavIcon';
import { nextIndex } from './roving';
import type { Orientation } from './roving';
import type { NavProps } from './types';

export interface NavTabListProps extends NavProps {
  orientation: Orientation;
  showNames: boolean;
}

export function NavTabList({ items, activeId, onSelect, orientation, showNames }: NavTabListProps) {
  const onKeyDown = (event: KeyboardEvent) => {
    const tabs = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]'),
    );
    const current = tabs.indexOf(event.target as HTMLElement);
    const target = nextIndex(event.key, current, tabs.length);
    if (current === -1 || target === null) return;
    event.preventDefault();
    tabs[target]?.focus();
    const next = items[target];
    if (next) onSelect(next.id);
  };

  return (
    <div
      class={`nav-tabs nav-tabs-${orientation}`}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <>
            <button
              type="button"
              role="tab"
              id={`nav-tab-${item.id}`}
              class={`nav-tab nav-tab-${item.kind}`}
              aria-selected={active}
              aria-label={item.label}
              title={showNames ? undefined : item.label}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(item.id)}
            >
              <NavIcon item={item} />
              {showNames && <span class="nav-label">{item.label}</span>}
            </button>
          </>
        );
      })}
    </div>
  );
}
