export const NOTES_ID = 'notes';

export type NavItemKind = 'site' | 'notes';

export interface NavItem {
  id: string;
  kind: NavItemKind;
  label: string;
  iconUrl?: string;
}

export interface NavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}
