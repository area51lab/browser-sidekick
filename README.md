# SideKick 🦾

A browser side panel for your favorite websites and notes, for Chrome and Firefox (Manifest V3). Built with WXT, Preact, TypeScript and Web Awesome.

## Install

From a release archive built with `pnpm zip` / `pnpm zip:firefox`, or load unpacked (see [Load unpacked](#load-unpacked)). Store listings are not published yet.

## Using sidekick

- **Open the panel**: click the SideKick toolbar icon. Chrome opens the side panel; Firefox toggles the sidebar.
- **Add a site**: open the options page, type an address under Sites and press "Add site". The browser asks for access to that one site only; sidekick uses it to read the site's name and icon and to let it be shown in the panel. If the details cannot be loaded, the site is still saved with its hostname and `/favicon.ico`. You can rename, edit and delete sites later, and reorder them by dragging a row.
- **Settings in the panel**: the cog button (right end of the top bar and dropdown, bottom of the icon sidebar) opens the same settings as the options page inside the panel, with a "Back to sites" button. The options page also works standalone.
- **Navigation mode**: in the options General section choose a dropdown, an icon sidebar or a top bar (icons or names). An open panel updates live.
- **Persistence**: with "Remember last URL" a site reopens where you left it; with "Always return to configured URL" it always starts from its saved address.
- **Notes**: the Notes item holds markdown notes that autosave, with an edit and preview toggle. Previews are sanitized.
- **Theme**: the panel follows the browser light/dark preference. "Use browser theme colors" (on by default) also applies Firefox theme colors, or system colors on Chrome.
- Some sites refuse to be embedded; the panel then offers "Open in tab". See the known limits below.

## Branding

The display name is "SideKick 🦾" (`DISPLAY_NAME` in `lib/brand.ts`, the single source of truth). It is used for the panel and options titles, the options heading, the About section and the toolbar tooltip. The manifest `name` stays the plain `APP_NAME` ("SideKick") because emoji in the manifest name risk store review rejection. The two HTML `<title>` tags repeat the display name as static text; a unit test keeps them in sync.

## Privacy

- All data (sites, notes, settings) stays in your browser's extension storage on your device. Nothing is sent to any server run by sidekick.
- No analytics, telemetry or tracking.
- No host access is granted at install. Access to a site is requested only when you add it, and only for that site's parent domain and its subdomains (for example `*.proton.me` and `proton.me` for `mail.proton.me`).
- The only network requests are the ones your browser makes to load the sites you added (including fetching their title and icon).
- The `webNavigation` permission is used to remember the last URL of each site and grants no page content access. The `declarativeNetRequest` permission is used to remove framing-blocking headers for your sites inside the panel only.

## Development

Requirements: Node.js 20+ and pnpm 10+.

```sh
pnpm install
pnpm dev            # Chrome with hot reload
pnpm dev:firefox    # Firefox with hot reload
pnpm check          # lint, typecheck, coverage and both builds
pnpm test:e2e       # Playwright (needs pnpm build and `pnpm exec playwright install chromium` once)
```

| Script                              | Purpose                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev` / `pnpm dev:firefox`     | Dev mode with hot reload                                             |
| `pnpm build` / `pnpm build:firefox` | Production build into `.output/`                                     |
| `pnpm zip` / `pnpm zip:firefox`     | Store-ready archives in `.output/` (Firefox also gets a sources zip) |
| `pnpm check`                        | Lint, typecheck, coverage and both builds                            |
| `pnpm lint` / `pnpm typecheck`      | ESLint + Prettier check / strict TypeScript                          |
| `pnpm lint:firefox`                 | `web-ext lint` on the Firefox build (run `pnpm build:firefox` first) |
| `pnpm test` / `pnpm test:coverage`  | Unit and integration tests (Vitest), optionally with V8 coverage     |
| `pnpm test:e2e`                     | Playwright tests in Chromium (run `pnpm build` first)                |
| `pnpm icons`                        | Regenerate `public/icon/*.png` from `assets/icon.svg`                |

Layout:

```
entrypoints/
  background.ts       service worker (Chrome) / background script (Firefox)
  sidepanel/          Chrome side_panel and Firefox sidebar_action (one WXT entrypoint)
  options/            options page
components/           Preact components (SiteForm, SiteFrame, SiteList, notes, nav, settings)
lib/                  mounting, site metadata, markdown, toolbar action
lib/theme/            color scheme, browser theme mapping and `useTheme()`
lib/storage/          typed, versioned storage layer, site helpers and Preact hooks
lib/embedding/        DNR rule builder, rule sync and site permission helper
lib/navigation/       frame attribution for URL tracking
assets/               base stylesheet, icon source
scripts/              icon generation
tests/unit/           unit tests
tests/integration/    integration tests
tests/e2e/            Playwright tests (excluded from `pnpm test`)
tests/helpers/        test utilities (fake storage adapter, theme fakes)
```

Coverage: `pnpm test:coverage` prints a V8 report (`coverage/coverage-summary.json`). Entrypoint `main.tsx` files and `background.ts` are excluded; they are covered by the e2e tests and the manual checklist.

E2E: `tests/e2e/` loads the built Chrome extension in Chromium, adds a site on the options page, switches the three navigation modes from the options setting while the side panel page is open, and checks notes survive a reload. The side panel is opened as a regular extension page, because Playwright cannot open the real side panel. The permission prompt cannot be automated, so `chrome.permissions.request` is stubbed to grant. Firefox is not covered by Playwright.

## Load unpacked

Chrome: run `pnpm build`, open `chrome://extensions`, enable Developer mode, click "Load unpacked" and select `.output/chrome-mv3`. Click the toolbar icon to open the side panel.

Firefox: run `pnpm build:firefox`, open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on" and select `.output/firefox-mv3/manifest.json`. Open the sidebar from the toolbar button or View > Sidebar > sidekick.

## Manual QA checklist (5 minutes)

Run once in Chrome and once in Firefox after loading the build.

1. Click the toolbar icon: the panel (Chrome) or sidebar (Firefox) opens; click again on Firefox: it closes.
2. Open the options page (Chrome: extension details > Extension options; Firefox: about:addons > sidekick > Preferences). Add `example.com`: the permission prompt appears, accept it, the name and icon fill in, the site appears in the list.
3. Type an address and click "Add site" immediately, without tabbing out first: the site is saved.
4. Add a second site, then rename, reorder and delete one; the panel updates without reopening.
5. Switch Navigation between Dropdown, Icon sidebar and Top bar (icons and names) with the panel open: it changes live and clicking an item shows that site.
6. Open Notes, type markdown, wait for "Saved", toggle Preview (headings and lists render, a `<script>` stays inert), close and reopen the panel: the text is still there.
7. Navigate inside a site, close and reopen the panel: with "Remember last URL" the site reopens at the last page; with "Always return to configured URL" it starts from the saved address (Firefox may always use the configured URL, a known limit).
8. Switch the OS or browser to dark mode: the panel and options follow. Toggle "Use browser theme colors" off and on; on Firefox with a custom theme the colors change.
9. Add a site that still refuses embedding (one that detects framing in JavaScript): after up to 10 seconds the "refuses to be embedded" message appears with "Open in tab".
10. Deny the permission prompt when adding a site: a warning appears and the site can still be saved with its hostname.

## Site embedding

Sites are shown in an iframe, and most sites forbid that with `X-Frame-Options` or a CSP `frame-ancestors` directive. `lib/embedding/` builds `declarativeNetRequest` dynamic rules that remove those response headers.

- One rule per unique parent domain (subdomains included, ports ignored), so a redirect such as `mail.proton.me` to `account.proton.me` keeps the headers stripped. The parent domain is a heuristic without a public suffix list: the last two labels, or three for a short list of common two-level suffixes (`co.uk`, `com.br`, `com.au`...). IPs and `localhost` stay exact. Rules apply only for `sub_frame` requests initiated by the extension itself (`initiatorDomains`), never global. Rule ids are derived from the host, so they are stable.
- `syncEmbeddingRules(sites)` replaces all dynamic rules. `startEmbeddingSync()` (called from the background) syncs on start and whenever the raw `sites` key of `storage.local` changes. The only coupling with the storage layer is that key holding an array of objects with a string `url`.
- Only `storage` and `declarativeNetRequest` are required. Host access is requested per site with `ensureSitePermission(url)`, which calls `permissions.request` for `*://*.parent/*` plus `*://parent/*` and must run in a user gesture (the add-site submit or the "Grant access" button). Origins are declared as `optional_host_permissions` (`http://*/*`, `https://*/*`), so nothing is granted at install.
- `SiteFrame` shows a spinner while loading and, if the frame errors, loads blank or does not load within 10 seconds, a "This site refuses to be embedded" message with an "Open in tab" button. When access to the site's parent domain is missing (for example sites saved before the parent-domain scope), it instead shows "Sidekick does not have access to this site" with a "Grant access" button that requests the permission and reloads the frame, plus "Open in tab".

### Embedding limits

- DNR cannot edit a header value, so the whole `Content-Security-Policy` header is removed for the embedded site frame, not only `frame-ancestors`. Page-level CSP of those sites is therefore not enforced inside the panel. `Content-Security-Policy-Report-Only` is left untouched.
- Firefox supports `modifyHeaders` in MV3 since Firefox 128; older versions are not supported and no `webRequest` blocking fallback is shipped. Firefox also grants optional host permissions only after a user gesture, same as Chrome.
- Sites that detect framing in JavaScript (frame busters, `top !== self` checks) still refuse or break.
- Third-party cookies: embedded sites are third-party in the extension page, so `SameSite=Lax/Strict` cookies are not sent and logins may not persist; browsers that block third-party cookies break them entirely.
- Redirects across different registrable domains (for example a login on another domain) are not covered, since the permission and rules stop at the parent domain of the saved site.
- Proton-like apps: besides framing headers, they may rely on third-party cookies (the account host sets cookies in an extension-origin frame, so `SameSite=Lax/Strict` cookies are dropped and Chrome's third-party cookie blocking can break sign-in), on JavaScript framing checks, and on `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` headers. Only `X-Frame-Options` and CSP are stripped; if login still fails after access is granted, use "Open in tab". This was reasoned from the code and headers, not verified against Proton itself.
- No Chromium e2e covers the cross-host redirect: `modifyHeaders` needs a real host permission and `permissions.request` cannot be accepted in a headless run, so the redirect scope is covered by unit and integration tests.
- `SiteFrame` also listens to `webNavigation.onErrorOccurred`: when the browser blocks a site frame by response (`ERR_BLOCKED_BY_RESPONSE` and similar) the fallback shows immediately instead of after the timeout. Refusals done in JavaScript are invisible to the browser, so for those the fallback still relies on the load timeout. Firefox error names were not verified.
- Adding a site known to block embedding (`lib/embedding/unsupported.ts`) shows a warning but is allowed.

## Panel state

The panel is decoupled from browser navigation: switching browser tabs does not touch it, so the open sites, the active item and scroll positions stay as they are. Its state lives in a single `storage.session` entry (`usePanelState()`): the active item and the current URL of each site. It survives closing and reopening the panel and is cleared when the browser closes.

- `settings.persistence = 'last-url'` loads the tracked URL when a site iframe is first mounted; `'configured-url'` always loads the configured URL. The URL is resolved once per mount, so navigation inside a frame never reloads it.
- Tracking: a cross-origin iframe does not expose its location, so `useSiteUrlTracking` listens to `webNavigation.onCommitted` and `onHistoryStateUpdated` for sub frames and keeps only frames whose parent frame is an extension page (`getFrame` on the parent, compared with `runtime.getURL('/')`). A frame is attributed to a site by host on its first event and stays bound to it, so redirects to another host keep being tracked.
- The `webNavigation` permission is required because there is no other way to read the location of a cross-origin frame. It grants no host access and no page content.

### Panel state limits

- Events carry a frame id and URL only, so two sites sharing a host (or one a subdomain of the other) are ambiguous; the first one in the list wins.
- Firefox may not report side panel (sidebar) frames to `webNavigation`; when no events arrive the last URL falls back to the configured one.
- Only http(s) URLs are tracked.

## Theme

`mount()` applies the Web Awesome `wa-dark` class from `prefers-color-scheme` before rendering (no flash) and `useTheme()` keeps it in sync live, so the side panel and the options page follow the browser light/dark preference.

- Firefox: `lib/theme/` reads `browser.theme.getCurrent()` and subscribes to `browser.theme.onUpdated`. `mapBrowserTheme` maps popup, toolbar and frame colors (plus `popup_border`/`sidebar_border` and an accent from `icons_attention`, `tab_line` or `button_background_active`) to Web Awesome surface, text, border and brand tokens, set as inline custom properties on `<html>`. The last mapping is cached in `localStorage` so the first paint already matches.
- Contrast safety: text and surface come from the first of popup, toolbar or frame whose pair meets WCAG AA (4.5:1). If none does, or a color is translucent or unparsable, the default Web Awesome tokens apply. Derived brand and muted-text tokens are skipped individually when they would fail AA.
- Chrome has no theme color API, so the `sk-system-colors` class maps the tokens to CSS system colors (`Canvas`, `CanvasText`, `AccentColor`) with `color-scheme: light dark`.
- `settings.useBrowserThemeColors` (optional boolean, default `true`): when `false`, neither Firefox colors nor system colors are applied and only the light/dark Web Awesome theme is used.
- API: `useTheme({ root?, store?, api? })` returns `{ scheme, source: 'default' | 'system' | 'browser', tokens }`. Pure helpers (`parseColor`, `contrastRatio`, `meetsAA`, `mapBrowserTheme`) are exported from `lib/theme`.
- Notes preview HTML (sanitized by DOMPurify) is styled only with Web Awesome tokens, so code, quotes and tables stay readable in dark mode and with browser colors.

## Options page

`entrypoints/options` renders `SettingsPage`: General, Sites and About. General edits `settings` through `useSettings`, so there is no save button and an open side panel updates live. Navigation mode is a single radio group, so only one mode is active; the top bar display choice appears only when the top bar is selected. The browser theme colors switch edits `settings.useBrowserThemeColors`.

## Known limits

- **CSP header removal**: to allow framing, the whole `Content-Security-Policy` response header of embedded site frames is removed (DNR cannot edit a value), so those sites' own CSP is not enforced inside the panel. `Content-Security-Policy-Report-Only` is untouched. Rules apply only to sub frames started by the extension.
- **webNavigation on Firefox**: sidebar frames may not be reported, so "Remember last URL" can fall back to the configured URL. Only http(s) URLs are tracked.
- **Shared-host ambiguity**: frame events carry only a URL, so two sites on the same host (or a site on a subdomain of another) cannot be told apart; the first one in the list wins.
- Frame busters, third-party cookie blocking and slow-site detection by timeout are covered in the embedding limits above. Firefox needs 128 or newer.

## Firefox parity

Built manifest (`pnpm build:firefox`, MV3) was checked for: `sidebar_action` pointing at `sidepanel.html`, `browser_specific_settings.gecko.id` (`sidekick@sidekick.extension`, keep it stable once published), `strict_min_version` 128.0 (first release with DNR `modifyHeaders` in MV3), `optional_host_permissions` for http(s), `data_collection_permissions` set to none, and DNR rules limited to extension-initiated sub frames.

`pnpm lint:firefox` reports 0 errors. Remaining warnings:

- `KEY_FIREFOX_UNSUPPORTED_BY_MIN_VERSION` and `KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION` for `data_collection_permissions`: the key is required by AMO for new extensions but only understood from Firefox 140 (Android 142); older versions ignore it.
- `UNSAFE_VAR_ASSIGNMENT` (5 findings, `innerHTML`) in bundled library code (Preact, Web Awesome, DOMPurify, marked). Markdown output goes through DOMPurify before it is rendered.

Firefox-specific limits: see also the embedding and panel state sections above.

- Sidebar frames may not emit `webNavigation` events, so "last URL" can fall back to the configured URL.
- DNR removes the whole `Content-Security-Policy` header of embedded site frames; `modifyHeaders` needs Firefox 128+.
- Firefox has no `openPanelOnActionClick`; the toolbar button toggles the sidebar through `sidebarAction.toggle()`.

## Packaging and bundle size

`pnpm zip` builds `.output/sidekick-<version>-chrome.zip`; `pnpm zip:firefox` builds `sidekick-<version>-firefox.zip` and `sidekick-<version>-sources.zip` (required by AMO).

| Browser | Unpacked | Gzip (all files) | Zip      |
| ------- | -------- | ---------------- | -------- |
| Chrome  | 484.6 kB | 128.7 kB         | 132.3 kB |
| Firefox | 484.8 kB | 128.8 kB         | 132.3 kB |
