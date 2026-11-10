interface ToolbarApi {
  sidePanel?: {
    setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void> | void;
  };
  sidebarAction?: { toggle(): Promise<void> | void };
  action: { onClicked: { addListener(listener: () => void): void } };
}

export function registerToolbarAction(api: ToolbarApi): void {
  if (api.sidePanel) {
    void api.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    return;
  }
  const sidebar = api.sidebarAction;
  if (sidebar) api.action.onClicked.addListener(() => void sidebar.toggle());
}
