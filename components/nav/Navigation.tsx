import type { NavigationMode, TopBarDisplay } from '../../lib/storage';
import { Dropdown } from './Dropdown';
import { IconSidebar } from './IconSidebar';
import { TopBar } from './TopBar';
import type { NavProps } from './types';

export interface NavigationProps extends NavProps {
  mode: NavigationMode;
  topBarDisplay: TopBarDisplay;
}

export function Navigation({ mode, topBarDisplay, ...props }: NavigationProps) {
  if (mode === 'icon-sidebar') return <IconSidebar {...props} />;
  if (mode === 'top-bar') return <TopBar {...props} display={topBarDisplay} />;
  return <Dropdown {...props} />;
}
