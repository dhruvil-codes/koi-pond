# Contributing

Thanks for helping improve Koi Pond. Keep changes focused and preserve the project's small, dependency-free browser footprint.

## Before a change

- Check [SPEC.md](docs/SPEC.md) for the 0.2 behavior and public API.
- For user-visible changes, describe the expected behavior and how it can be checked.
- Keep generated browser output reproducible from source. Do not hand-edit generated files unless the change is specifically about the build output.
- Keep examples aligned with the documented installation status and supported APIs. Do not claim an npm registry release unless it has actually been published.

## Local checks

With Node.js 22 or newer, install development dependencies if needed, then run:

```sh
npm install
npm run build
npm test
```

Open `index.html` directly to check the offline playground. Test keyboard and pointer behavior where relevant, including touch scrolling and reduced-motion behavior. Keep checks deterministic and avoid adding dependencies without a clear need.

For the browser fixture, run `npm run check:browser` and open `test/browser-check.html`. Its browser-console success message confirms custom-element controls, pointer filtering, PNG export, reconnects and layout. Test real touch gestures on hardware as well; synthetic events cannot verify the browser's native scrolling feel.

## Pull requests

Explain what changed, why it is useful, and which checks you ran. Include screenshots or a short recording for visible changes when practical. Mention known limitations. Keep documentation, examples, declarations and public API descriptions in sync.

## Scope and safety

Do not commit credentials, private user data, machine-specific paths, backups, reference imagery or proprietary app archives. The optional T3 adapter is experimental and isolated under `integrations/t3/`; see its README before using it. Its scripts can modify a locally installed app and are not ordinary project checks.

By contributing, you agree that your contributions are provided under the repository's MIT license.
