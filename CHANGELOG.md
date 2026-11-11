# Changelog

## [0.2.0](https://github.com/area51lab/browser-sidekick/compare/sidekick-v0.1.0...sidekick-v0.2.0) (2026-11-11)


### Features

* add icons, firefox manifest settings, packaging scripts, e2e smoke test and docs ([3bf1870](https://github.com/area51lab/browser-sidekick/commit/3bf18705d0e8acf4f41a1c9085fcd324a93d8aea))
* **embedding:** embed sites in iframes via declarativeNetRequest rules ([2575d8f](https://github.com/area51lab/browser-sidekick/commit/2575d8f7155025eb975c0dd6ad2b2b69b5128085))
* **notes:** add markdown notes tab with lazy sanitized preview and autosave ([d1a0fbf](https://github.com/area51lab/browser-sidekick/commit/d1a0fbf49fff7497e802768569e05f4c39e5c4f9))
* **options:** add settings page with general, sites and about sections ([4f312e9](https://github.com/area51lab/browser-sidekick/commit/4f312e977c356e507497a700bc877a0a45100935))
* **panel:** decouple panel from browser tabs and polish settings UI ([a774c4e](https://github.com/area51lab/browser-sidekick/commit/a774c4ee9166fe66e8ca10def699cb71baa87117))
* scaffold sidekick extension with WXT, Preact and Web Awesome ([a00f726](https://github.com/area51lab/browser-sidekick/commit/a00f7264ba806b6e22d6889a4e7720ec2bc8e03a))
* **settings:** visual previews for navigation options ([bc1548d](https://github.com/area51lab/browser-sidekick/commit/bc1548d42846f89ec8163ccc173e3102ba7051d3))
* **sidepanel:** add panel shell with dropdown, icon sidebar and top bar navigation ([4988a69](https://github.com/area51lab/browser-sidekick/commit/4988a69cdb2ed5da93149c43c644cca8a5ed169f))
* **sidepanel:** persist active item and site urls per browser tab ([6339336](https://github.com/area51lab/browser-sidekick/commit/6339336950ccb2c328a62c93e5570bce2645e0f0))
* **sites:** add site form, list and metadata fetching on the options page ([284dcf0](https://github.com/area51lab/browser-sidekick/commit/284dcf07ebf292f0eafa56a7a67a0635d1e684f9))
* **storage:** add typed, versioned storage layer with Preact hooks ([2d8fc89](https://github.com/area51lab/browser-sidekick/commit/2d8fc89aab2679696fba3a810ee75065c5c0f102))
* **theme:** follow browser color scheme and theme colors ([e6eccc0](https://github.com/area51lab/browser-sidekick/commit/e6eccc0d4ecdd91a3073afb5bc9aa4ef7f766af4))
* **ui:** settings cog with in-panel settings, drag-to-reorder sites, compact navigation, SideKick 🦾 branding ([9443225](https://github.com/area51lab/browser-sidekick/commit/944322542684976ab0a5fd3df175e57e23a5bbe5))


### Bug Fixes

* **embedding:** scope rules and permissions to the parent domain ([2e88d75](https://github.com/area51lab/browser-sidekick/commit/2e88d753bfab2ece94b679c1ae772de2596214da))
* **nav:** use native title for icon tabs so they keep an accessible name; test(e2e): side panel modes and notes persistence ([efdd583](https://github.com/area51lab/browser-sidekick/commit/efdd5838b406d99f9292fbd60fdf7e6cfa54b487))
* **permissions:** declare &lt;all_urls&gt; as optional host permission and surface denied grants ([8c3679e](https://github.com/area51lab/browser-sidekick/commit/8c3679e0c2e80ea7a6f1e9b32af212d90f64c79b))
* **site-form:** keep submit enabled and reuse the in-flight metadata load ([ebcafa3](https://github.com/area51lab/browser-sidekick/commit/ebcafa3e1d8b74bcb205e565cb7b1b31c55f0434))
