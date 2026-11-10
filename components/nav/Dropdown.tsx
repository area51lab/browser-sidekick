import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import { NavIcon } from './NavIcon';
import { SettingsButton } from './SettingsButton';
import type { NavProps } from './types';

export function Dropdown({ items, activeId, onSelect, onOpenSettings }: NavProps) {
  const active = items.find((item) => item.id === activeId);
  return (
    <nav class="nav nav-dropdown">
      <wa-select
        aria-label="Site"
        size="small"
        value={activeId}
        onChange={(event: Event) => {
          const value = (event.currentTarget as HTMLElement & { value: string }).value;
          if (value && value !== activeId) onSelect(value);
        }}
      >
        {active && (
          <span slot="start">
            <NavIcon item={active} />
          </span>
        )}
        {items.map((item) => (
          <wa-option value={item.id}>
            <span slot="start">
              <NavIcon item={item} />
            </span>
            {item.label}
          </wa-option>
        ))}
      </wa-select>
      <SettingsButton onClick={onOpenSettings} />
    </nav>
  );
}
