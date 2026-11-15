# Testing and compatibility

Koi Pond has separate checks for the simulation, browser playground and installed package. The checks exercise real rendering and installed code. They do not establish support for every device or every host application.

## Run the checks

Use Node.js 22 or newer and Git. From a source checkout:

```sh
npm ci
npm run build:all
npm test
npm run check:types
npx playwright install chromium firefox webkit
npm run check:browser -- --browser=chromium
npm run check:browser -- --browser=firefox
npm run check:browser -- --browser=webkit
npm run check:consumer
```

On Linux, `npx playwright install --with-deps chromium firefox webkit` also installs the browser system libraries. CI uses this command. `check:consumer` needs network access to install pinned framework packages in an isolated fixture. These are test dependencies, not library runtime dependencies.

`npm run pack:release` rebuilds the committed outputs and produces an npm archive. Ordinary Git installations use those committed outputs without preparing the playground. Avoid adding `build`, `prepare`, `prepack` or installation lifecycle hooks to the package, because npm would then install its development dependencies while preparing a Git dependency.

## Requirements and evidence

| Area | What the checks verify | Location |
| --- | --- | --- |
| Configuration | Invalid values fail atomically; arrays are cloned; JSON and shared URLs reproduce normalized options | `test/config.test.mjs`, browser suite |
| Fish and feeding | Seeded geometry, connected spines, distinct varieties and behaviors, arrival, mouth contact, pellet visibility and expiry | `test/fish.test.mjs`, `test/feeding.test.mjs` |
| Motion | Bounded turning, equivalent 30/60 Hz progression, resizing and pausing | `test/motion.test.mjs`, `test/core.test.mjs` |
| Environment | Five distinct scenes, independent fish state, repeatable art, lighting/clarity controls and smooth open water | `test/environment.test.mjs`, `test/depth.test.mjs` |
| Rendering | Printable ASCII, valid palette references, portrait/desktop bounds and actual canvas pixels | `test/render.test.mjs`, browser suite |
| Cleanup and caching | Destroyed controllers release listeners/observers and backing rasters; changed cells restore the background; unchanged frames do no canvas work | `test/runtime.test.mjs` |
| Build | Committed output reproduces; classic and ESM exports load without browser globals; installation does not require a build hook | `test/build.test.mjs` |
| Playground | All settings, keyboard focus/Escape, copy fallbacks, imports, shared links, feeding and exact background restoration | `scripts/browser-check.mjs` |
| Responsive behavior | No document scrolling or clipped controls at six viewport sizes; emulated taps feed fish and operate scene controls | `scripts/browser-check.mjs` |
| Accessibility behavior | Reduced motion starts paused, keyboard controls work, decorative embeds avoid focus/pointer capture | Browser and consumer suites |
| Package consumption | Installed tarball and Git-source package, public exports, SSR import, TypeScript declarations, classic HTML and portfolio example | `scripts/check-consumer.mjs` |
| Frameworks | Packaged React example in Strict Mode, prop updates, unmount/remount; Next.js static production build and client hydration | `scripts/check-consumer.mjs` |

The Node tests use controlled clocks and seeded state where applicable. The browser tests run the standalone page offline, so they also catch accidental dependencies on remote scripts, fonts or images. Framework tests serve an isolated production export on a temporary localhost port and close it after the run.

## Browser evidence

Each engine writes its own `results.json` and screenshots under `.local/ui-check/<browser>/`. Results include the browser version, assertion messages and any failure. Consumer evidence is stored in `.local/consumer-check/results.json`; its isolated fixtures remain beneath that directory for inspection. These files are ignored by Git.

CI checks Node.js 22 and 24 on Linux. Separate Chromium, Firefox and WebKit jobs run the complete browser suite; the Chromium job also runs the packaged consumer checks. GitHub Actions uploads the browser evidence for seven days, including failed runs.

The six viewport sizes are 1440 × 900, 1280 × 720, 390 × 844, 320 × 568, 568 × 320 and 768 × 1024.

### v0.4.2 verification

The release was checked locally on Windows with Node.js 24.19.0. All browser runs completed without runtime errors.

| Check | Version | Result |
| --- | --- | --- |
| Core, build and adapter fixture tests | Node.js 24.19.0 | 20 passed |
| Playground TypeScript | Project's locked compiler | Passed |
| Chromium | 159.0.8154.6 | 201 checks passed |
| Firefox | 159.0 | 201 checks passed |
| Playwright WebKit | 27.2 | 201 checks passed |
| Installed package and Git fixture | Koi Pond 0.4.2 | 39 checks passed |

The consumer run used React and React DOM 19.3.1 and Next.js 16.4.6. It built a static production export, hydrated it in Chromium, changed props and checked for browser errors. Its React development fixture also exercised Strict Mode and unmount/remount cleanup.

## Coverage limits

- Playwright WebKit tests a browser engine. It does not replace testing Safari on macOS or iOS hardware.
- Mobile viewport and touch-tap tests do not measure physical touch scrolling, battery use, thermal behavior or assistive technology on a phone.
- Keyboard and reduced-motion checks are not a complete screen-reader or WCAG audit.
- Canvas performance depends on viewport size, device pixel ratio, fish count, fish size and hardware. Use `detail: 'balanced'` for a smaller rendering budget; no fixed frame rate is guaranteed.
- Framework verification covers the included example and pinned fixture versions, not every application router, theme, CSP or bundler configuration.
- The experimental T3 adapter is outside the portable embed's support scope. Its Node checks use fixtures and do not patch a running app.
- Historical browsers without the required Canvas 2D, Custom Elements or ResizeObserver APIs are not supported by these checks.
