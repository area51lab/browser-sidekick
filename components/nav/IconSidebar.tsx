import { NavTabList } from './NavTabList';
import { SettingsButton } from './SettingsButton';
import type { NavProps } from './types';

export const IconSidebar = ({ onOpenSettings, ...props }: NavProps) => (
  <nav class="nav nav-icon-sidebar" aria-label="Sites">
    <NavTabList {...props} orientation="vertical" showNames={false} />
    <SettingsButton onClick={onOpenSettings} />
  </nav>
);
