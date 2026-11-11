import type { NavigationMode, TopBarDisplay } from '../../lib/storage';

const Content = () => <span class="mini__content" />;

/** Miniature of the panel for each navigation mode. */
export function NavigationPreview({ mode }: { mode: NavigationMode }) {
  if (mode === 'icon-sidebar') {
    return (
      <span class="mini mini--row">
        <span class="mini__side">
          <span class="mini__dot mini__dot--active" />
          <span class="mini__dot" />
          <span class="mini__dot" />
        </span>
        <Content />
      </span>
    );
  }
  if (mode === 'top-bar') {
    return (
      <span class="mini">
        <span class="mini__bar">
          <span class="mini__pill mini__pill--active" />
          <span class="mini__pill" />
          <span class="mini__pill" />
        </span>
        <Content />
      </span>
    );
  }
  return (
    <span class="mini">
      <span class="mini__bar">
        <span class="mini__select" />
      </span>
      <Content />
    </span>
  );
}

/** Miniature of the top bar showing only icons or names. */
export function TopBarPreview({ display }: { display: TopBarDisplay }) {
  return (
    <span class="mini">
      <span class="mini__bar">
        {display === 'icons' ? (
          <>
            <span class="mini__dot mini__dot--active" />
            <span class="mini__dot" />
            <span class="mini__dot" />
            <span class="mini__dot" />
          </>
        ) : (
          <>
            <span class="mini__pill mini__pill--wide mini__pill--active" />
            <span class="mini__pill mini__pill--wide" />
            <span class="mini__pill mini__pill--wide" />
          </>
        )}
      </span>
      <Content />
    </span>
  );
}
