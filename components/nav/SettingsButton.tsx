export interface SettingsButtonProps {
  onClick: () => void;
}

export const SETTINGS_LABEL = 'Settings';

export const SettingsButton = ({ onClick }: SettingsButtonProps) => (
  <button
    type="button"
    class="nav-settings"
    aria-label={SETTINGS_LABEL}
    title={SETTINGS_LABEL}
    onClick={onClick}
  >
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <g
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="6.5" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
      </g>
    </svg>
  </button>
);
