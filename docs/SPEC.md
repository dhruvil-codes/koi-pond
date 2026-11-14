# Koi Pond 0.1

An open-source, dependency-free interactive ASCII pond, usable by opening one HTML file or embedding one script and one custom element. The existing midnight artwork remains the default: four adult koi, three young koi, seven lily pads and a layered lotus.

## This release

- Framework-independent canvas controller and `<koi-pond>` custom element. Classic script and ES module builds, TypeScript declarations, MIT license. No network requests, tracking, images, fonts, runtime packages, or build dependencies.
- Smooth food attraction, velocity-aware pointer ripples, click/tap feeding, bounded drag stirring, keyboard feeding, pause/reset, PNG snapshot. Scrolling and text selection outside the pond remain normal. Touch scrolling must not feed accidentally; only primary pointer taps feed.
- Presets: `midnight` (original black still water), `rain` (cool teal water and gentle rainfall rings), `dusk` (warm dark water and drifting petals). Switching preserves the fish and food. A short palette fade is decorative; the selected control updates immediately.
- Options: `environment` default `midnight`; `speed` default `1.35`, range 0.25–2.5; `fishCount` default 7, integer range 1–16; `lilies` and `lotus` default true; `detail` `fine` (default) or `balanced`; `paused` default false; `interactive` default true. Reject invalid public options without partially applying them.
- Live demo: pond first, quiet controls for environment, speed, fish count, plants, pause/reset, snapshot and copyable embed. Responsive layout and a proper accessible help/status region. No marketing dashboard.
- Reduced motion pauses initially, with explicit Play available. Pause offscreen/hidden. Handle resizes without resetting, cap DPR at 2 and rendering at 480 columns. Destroy releases every listener, observer and animation frame; multiple ponds stay independent.
- Tests for simulation, artwork, option validation, API lifecycle, multi-instance behavior, custom-element reconnect and build/package contents. Browser fixture verifies actual controls, drag/touch filtering and accessibility. CI runs the Node checks and builds.
- Public source tree: `src/`, `types/`, `demo/`, `examples/`, `scripts/`, `test/`, `docs/`, `dist/`, `.github/`. Generated distributable JS and standalone `index.html` are committed for immediate use.
- T3 integration source is isolated under `integrations/t3/`, experimental and pinned to the inspected app version. Proprietary ASAR archives, backups, machine paths and user attachments never enter Git. Do not apply, stage or restart T3.
- Push the initial complete release to `https://github.com/dhruvil-codes/koi-pond.git`, branch `main`; do not force-push. npm publication and hosted-site deployment are future release work.

## Public API

`createKoiPond(canvas, options)` returns a controller with `play()`, `pause()`, `toggle()`, `reset()`, `setOptions(partial)`, `feed(x,y)`, `ripple(x,y,strength?)`, `getState()`, `exportPNG()`, and `destroy()`. Feed/ripple coordinates are normalized to 0–1. `getState()` returns a read-only snapshot of options plus `paused`, `foodCount`, `eaten` and `destroyed`. User-visible changes emit a bubbling, composed `pondchange` event from the canvas.

`registerKoiPond(tagName = 'koi-pond')` is idempotent. Importing the browser build auto-registers the default element. Attributes use kebab case (`fish-count`) and booleans use `true`/`false` values. The element exposes `.pond` after connecting, disconnects cleanly and can reconnect. Source module imports must be safe in Node without DOM globals.

Core signatures remain compatible: `createPond(columns, rows, aspect, options?)`, `advance`, `renderPond`, `resizePond`, `feed`, `disturb`. Add `configurePond(pond, partial)` and `validateOptions(partial, current?)`; store normalized settings in `pond.options`. `renderPond` returns the existing character/color/coverage arrays plus a `palette` string array for the selected environment. `ENVIRONMENTS` is exported metadata with `id`, `label`, `description`.

## Design

The pond is the focal point. Black water, ivory koi, coral markings, amber young koi, moss-green pads and blush lotus. Quiet system sans controls and monospace embed code; no external fonts. A compact toolbar wraps into clear groups on mobile. Interaction feedback starts immediately, with subtle 140ms button presses. No sound by default. Every shipped feature must be distinguishable from roadmap ideas.

## Done

Opening `index.html` works offline. `npm install` needs no dependencies. `npm run build`, `npm test` and `npm pack --dry-run` succeed. Drop-in examples use actual generated files. A clean clone can reproduce the output. The GitHub repository contains only intended source, documentation, examples and small distributables, with no local artifacts or secrets.
