# Contributing

Koi Pond's embed is a small browser library. Changes to the playground can use development dependencies, but keep those imports out of `src/` and the published runtime package.

## Before changing code

- Read [the release readiness spec](docs/RELEASE-READINESS-SPEC.md) and the relevant API or behavior docs.
- Describe user-visible changes and how someone can check them.
- Update examples, declarations and docs when a public setting or behavior changes.
- Rebuild generated browser files from source. Do not edit generated output by hand unless the build output itself is the subject of the change.
- The package is not published to the npm registry. Do not document a registry install unless that changes.

## Setup and local checks

Use Node.js 22 or newer, then install the locked dependencies:

```sh
npm ci
```

Run the build and core checks before opening a pull request:

```sh
npm run build:all
npm test
npm run check:types
npm run check:consumer
```

`check:consumer` verifies install and use from a packaged consumer, including the public exports and declarations. Keep its scratch files out of commits.

It installs pinned React and Next.js versions in an isolated fixture and needs network access. Install Playwright's Chromium before running it. Use `npm run pack:release` to rebuild and create a release archive.

The build command is named `build:all` intentionally. npm prepares Git dependencies when a package has a script named `build` or certain installation hooks. Keep those hooks out of the package so a Git install can use the committed bundles without downloading playground development tools.

## Browser checks

Install the Playwright browser engines as needed:

```sh
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

Run each engine explicitly so results and screenshots stay separate:

```sh
npm run check:browser -- --browser=chromium
npm run check:browser -- --browser=firefox
npm run check:browser -- --browser=webkit
```

The browser suite checks the standalone playground offline, its controls and keyboard behavior, reduced motion, resizing and viewport layout. It also checks exact copy/share/import behavior. Browser automation does not verify physical iOS or Android devices, native touch feel, or every host application's layout.

Screenshots and browser results go under `.local/ui-check/<browser>/`. This directory is local evidence and should not be committed. See [docs/TESTING.md](docs/TESTING.md) for the latest recorded runs, what each check covers and known limits. When reporting a browser check, name the engine and link or describe its evidence instead of combining unrelated runs into one claim.

## Playground and generated files

The playground UI is in `demo/App.tsx` and `demo/styles.css`. Rebuild `index.html` after playground changes. Buttons use Cloudflare Kumo; control primitives from ReUI's Radix source include attribution. Keep the corresponding license information in [third-party notices](docs/THIRD-PARTY-NOTICES.md).

Check the working tree after building. Generated files should match the source changes, and temporary archives, credentials, screenshots outside the documented evidence path, private data, machine-specific paths and proprietary app files should stay out of the repository and package.

## Pull requests

Explain what changed, why, and which checks you ran. Include screenshots or a short recording for visible changes when useful. Mention known limits and keep the API docs, declarations, examples and README in sync.

## Scope and license

The optional T3 adapter under `integrations/t3/` is experimental and tied to one inspected Windows app version. It is not a normal project check; read its README before running scripts that interact with the local app.

By contributing, you agree that your contributions are provided under the repository's MIT license.
