import { NavTabList } from './NavTabList';
import type { NavProps } from './types';

export const IconSidebar = (props: NavProps) => (
  <nav class="nav nav-icon-sidebar" aria-label="Sites">
    <NavTabList {...props} orientation="vertical" showNames={false} />
  </nav>
);
