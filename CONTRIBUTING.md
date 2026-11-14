# Contributing

Thanks for helping improve Koi Pond. Keep changes focused and preserve the embeddable library's small, dependency-free browser footprint.

## Before a change

- Check [SPEC.md](docs/SPEC.md) for the 0.2 behavior and public API.
- For user-visible changes, describe the expected behavior and how it can be checked.
- Keep generated browser output reproducible from source. Do not hand-edit generated files unless the change is specifically about the build output.
- Keep examples aligned with the documented installation status and supported APIs. Do not claim an npm registry release unless it has actually been published.

## Local checks

With Node.js 22 or newer, install the locked development dependencies, then run:

```sh
npm ci
npm run build
npm test
npx tsc --noEmit
```

Open `index.html` directly to check the offline playground. Test keyboard and pointer behavior where relevant, including touch scrolling and reduced-motion behavior. Keep checks deterministic and avoid adding dependencies without a clear need.

For actual browser checks, install Playwright's Chromium once with `npx playwright install chromium`, then run `npm run check:browser`. To use an existing Chrome installation, set `PLAYWRIGHT_CHANNEL=chrome`. The script opens the standalone file offline, exercises the dock and controls, checks exact snippets and shared configurations, tests keyboard access and reduced motion, and checks six desktop/mobile viewport sizes for scrolling and clipped controls. Screenshots and results are saved under the ignored `.local/ui-check/` folder. Real touch hardware is still useful for checking native gesture feel.

The playground UI lives in `demo/App.tsx` and `demo/styles.css`. Buttons use Cloudflare Kumo; control primitives are copied from ReUI's official Radix source with attribution. Build dependencies stay in `devDependencies`; do not import them into the `src/` library. Rebuild `index.html` after UI changes and preserve the third-party license notices.

## Pull requests

Explain what changed, why it is useful, and which checks you ran. Include screenshots or a short recording for visible changes when practical. Mention known limitations. Keep documentation, examples, declarations and public API descriptions in sync.

## Scope and safety

Do not commit credentials, private user data, machine-specific paths, backups, reference imagery or proprietary app archives. The optional T3 adapter is experimental and isolated under `integrations/t3/`; see its README before using it. Its scripts can modify a locally installed app and are not ordinary project checks.

By contributing, you agree that your contributions are provided under the repository's MIT license.
