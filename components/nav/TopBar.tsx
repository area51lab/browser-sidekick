import { NavTabList } from './NavTabList';
import { SettingsButton } from './SettingsButton';
import type { NavProps } from './types';
import type { TopBarDisplay } from '../../lib/storage';

export interface TopBarProps extends NavProps {
  display: TopBarDisplay;
}

export const TopBar = ({ display, onOpenSettings, ...props }: TopBarProps) => (
  <nav class="nav nav-top-bar" aria-label="Sites">
    <NavTabList {...props} orientation="horizontal" showNames={display === 'names'} />
    <SettingsButton onClick={onOpenSettings} />
  </nav>
);
