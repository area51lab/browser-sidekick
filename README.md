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
components/           shared Preact components
lib/                  shared helpers (theme, mounting)
lib/storage/          typed, versioned storage layer, site helpers and Preact hooks
lib/siteMetadata.ts   title and favicon fetching, URL normalization
lib/requestOrigin.ts  host permission request for a site origin
assets/base.css       base stylesheet and Web Awesome theme
tests/helpers/        test utilities (fake storage adapter)
tests/unit/           unit tests
tests/integration/    integration tests
```

## TODO

- Add `declarativeNetRequest` and host permissions once embedding sites in iframes is implemented
- Add a Firefox gecko extension id before publishing
- Declare `optional_host_permissions` (http(s) origins) so `requestOrigin` can prompt in Chrome
- Navigation modes: dropdown, icon sidebar, top bar
- Per-tab state with "remember last URL" or "always reset"
- Notes tab with markdown (marked + DOMPurify)
- Follow browser theme colors where possible
- Playwright smoke test
