# Contributing

Thanks for helping improve Koi Pond. Keep changes focused and preserve the project's small, dependency-free browser footprint.

## Before a change

- Check [SPEC.md](docs/SPEC.md) for the release behavior and public API.
- For user-visible changes, describe the expected behavior and how it can be checked.
- Keep generated output reproducible from the source. Do not hand-edit generated files unless the change is specifically about the build output.

## Local checks

With Node.js installed, run:

```sh
npm install
npm run build
npm test
```

Open `index.html` directly to check the offline demo. Test keyboard and pointer behavior where relevant, including touch scrolling and reduced-motion behavior. Keep tests deterministic and avoid adding dependencies without a clear need.

After building, run `npm run check:browser` and open `test/browser-check.html`. Its browser-console success message confirms actual custom-element controls, pointer filtering, PNG export, reconnects and layout. Test real touch gestures on hardware as well; synthetic events cover the filtering logic but cannot verify a browser's native scrolling feel.

## Pull requests

Explain what changed, why it is useful, and the checks you ran. Include screenshots or a short recording for visible changes when practical. Mention any known limitations. Keep documentation, examples and public API descriptions in sync with behavior.

## Scope and safety

Do not commit credentials, private user data, machine-specific paths, backups, or proprietary app archives. The optional T3 adapter is experimental and isolated under `integrations/t3/`; its scripts can modify a locally installed app and should not be run as part of ordinary project checks. See its README before using it.

By contributing, you agree that your contributions are provided under the repository's MIT license.
