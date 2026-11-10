import { describe, expect, it, vi } from 'vitest';
import { registerToolbarAction } from '../../lib/toolbar';

function makeAction() {
  const listeners: Array<() => void> = [];
  return {
    listeners,
    action: { onClicked: { addListener: (fn: () => void) => listeners.push(fn) } },
  };
}

describe('registerToolbarAction', () => {
  it('opens the side panel on action click in Chrome', () => {
    const { action, listeners } = makeAction();
    const setPanelBehavior = vi.fn();
    registerToolbarAction({ action, sidePanel: { setPanelBehavior } });
    expect(setPanelBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true });
    expect(listeners).toHaveLength(0);
  });

  it('toggles the sidebar on action click in Firefox', () => {
    const { action, listeners } = makeAction();
    const toggle = vi.fn();
    registerToolbarAction({ action, sidebarAction: { toggle } });
    expect(listeners).toHaveLength(1);
    listeners[0]?.();
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('does nothing when neither API exists', () => {
    const { action, listeners } = makeAction();
    registerToolbarAction({ action });
    expect(listeners).toHaveLength(0);
  });
});
