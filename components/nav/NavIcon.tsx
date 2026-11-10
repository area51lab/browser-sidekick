import type { NavItem } from './types';

export function NavIcon({ item }: { item: NavItem }) {
  if (item.iconUrl) return <img class="nav-icon" src={item.iconUrl} alt="" />;
  return (
    <span class="nav-icon nav-icon-fallback" aria-hidden="true">
      {item.kind === 'notes' ? '✎' : item.label.charAt(0).toUpperCase()}
    </span>
  );
}
