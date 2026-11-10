# sidekick

A browser side panel for your favorite websites and notes. Built with WXT, Preact, TypeScript and Web Awesome for Chrome and Firefox (Manifest V3).

This scaffold renders a "Hello sidekick" view with one Web Awesome component in the side panel and options page, following the system light/dark theme.

## Requirements

- Node.js 20+
- pnpm 10+

## Setup

```sh
pnpm install
```

## Scripts

| Script                              | Purpose                                |
| ----------------------------------- | -------------------------------------- |
| `pnpm dev` / `pnpm dev:firefox`     | Dev mode with hot reload               |
| `pnpm build` / `pnpm build:firefox` | Production build into `.output/`       |
| `pnpm zip`                          | Zip both browser builds for publishing |
| `pnpm test`                         | Unit and integration tests (Vitest)    |
| `pnpm lint`                         | ESLint and Prettier check              |
| `pnpm typecheck`                    | TypeScript strict check                |

## Load unpacked

Chrome: run `pnpm build`, open `chrome://extensions`, enable Developer mode, click "Load unpacked" and select `.output/chrome-mv3`. Click the toolbar icon to open the side panel.

Firefox: run `pnpm build:firefox`, open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and select `.output/firefox-mv3/manifest.json`. Open the sidebar from View > Sidebar > sidekick.

## Layout

```
entrypoints/
  background.ts       service worker (Chrome) / background script (Firefox)
  sidepanel/          Chrome side_panel and Firefox sidebar_action (one WXT entrypoint)
  options/            options page
components/           shared Preact components (SiteFrame: iframe with refusal fallback)
components/settings/  options page sections (General, About) and SettingsPage
lib/                  shared helpers (theme, mounting)
lib/storage/          typed, versioned storage layer, site helpers and Preact hooks
lib/embedding/       DNR rule builder, rule sync and site permission helper
lib/siteMetadata.ts   title and favicon fetching, URL normalization
assets/base.css       base stylesheet and Web Awesome theme
tests/helpers/        test utilities (fake storage adapter)
tests/unit/           unit tests
tests/integration/    integration tests
```

## Site embedding

Sites are shown in an iframe, and most sites forbid that with `X-Frame-Options` or a CSP `frame-ancestors` directive. `lib/embedding/` builds `declarativeNetRequest` dynamic rules that remove those response headers.

- One rule per unique site host (subdomains included, ports ignored), only for `sub_frame` requests initiated by the extension itself (`initiatorDomains`), never global. Rule ids are derived from the host, so they are stable.
- `syncEmbeddingRules(sites)` replaces all dynamic rules. `startEmbeddingSync()` (called from the background) syncs on start and whenever the raw `sites` key of `storage.local` changes. The only coupling with the storage layer is that key holding an array of objects with a string `url`.
- Only `storage` and `declarativeNetRequest` are required. Host access is requested per site with `ensureSitePermission(url)`, which calls `permissions.request` for the site origin and must run in a user gesture (the add-site submit). Origins are declared as `optional_host_permissions` (`http://*/*`, `https://*/*`), so nothing is granted at install.
- `SiteFrame` shows a spinner while loading and, if the frame errors, loads blank or does not load within 10 seconds, a "This site refuses to be embedded" message with an "Open in tab" button.

### Known limits

- DNR cannot edit a header value, so the whole `Content-Security-Policy` header is removed for the embedded site frame, not only `frame-ancestors`. Page-level CSP of those sites is therefore not enforced inside the panel. `Content-Security-Policy-Report-Only` is left untouched.
- Firefox supports `modifyHeaders` in MV3 since Firefox 128; older versions are not supported and no `webRequest` blocking fallback is shipped. Firefox also grants optional host permissions only after a user gesture, same as Chrome.
- Sites that detect framing in JavaScript (frame busters, `top !== self` checks) still refuse or break.
- Third-party cookies: embedded sites are third-party in the extension page, so `SameSite=Lax/Strict` cookies are not sent and logins may not persist; browsers that block third-party cookies break them entirely.
- A refused frame cannot be told apart from a slow site, so the fallback relies on a load timeout.

## Per-tab state

Each browser tab has its own state in `storage.session` (`useTabState(tabId)`): the active item and the current URL of each site. The panel remounts when the active browser tab changes and keeps iframes of the viewed tab only, so nothing is kept alive for other tabs. A tab that has no state starts from defaults (first item, configured URLs). State is removed when the tab closes.

- `settings.persistence = 'last-url'` loads the tracked URL when a site iframe is first mounted; `'configured-url'` always loads the configured URL. The URL is resolved once per mount, so navigation inside a frame never reloads it.
- Tracking: a cross-origin iframe does not expose its location, so `useSiteUrlTracking` listens to `webNavigation.onCommitted` and `onHistoryStateUpdated` for sub frames and keeps only frames whose parent frame is an extension page (`getFrame` on the parent, compared with `runtime.getURL('/')`). A frame is attributed to a site by host on its first event and stays bound to it, so redirects to another host keep being tracked.
- The `webNavigation` permission is required because there is no other way to read the location of a cross-origin frame. It grants no host access and no page content.

### Known limits

- Events carry a frame id and URL only, so two sites sharing a host (or one a subdomain of the other) are ambiguous; the first one in the list wins.
- Firefox may not report side panel (sidebar) frames to `webNavigation`; when no events arrive the last URL falls back to the configured one.
- Only http(s) URLs are tracked.

## Coverage

`pnpm test:coverage` runs the tests with V8 coverage (text report and `coverage/coverage-summary.json`).

## TODO

- Add a Firefox gecko extension id before publishing
- Navigation modes: dropdown, icon sidebar, top bar
- Notes tab with markdown (marked + DOMPurify)
- Follow browser theme colors where possible
- Playwright smoke test

## Options page

`entrypoints/options` renders `SettingsPage`: General, Sites and About. General edits `settings` through `useSettings`, so there is no save button and an open side panel updates live. Navigation mode is a single radio group, so only one mode is active; the top bar display choice appears only when the top bar is selected. The browser theme colors switch is disabled until `settings.useBrowserThemeColors` exists.
