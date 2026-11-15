# Koi Pond

A dependency-free ASCII koi pond with five procedural environments. Use the standalone playground, embed the classic browser build, or mount a canvas from an application. The library makes no network requests and uses no remote images or runtime dependencies.

## Try the playground

Visit the [live playground](https://koi-pond.bydhruvil.in/) to customize and share a pond.

Open `index.html` directly in a modern browser. The committed page and classic build work offline. The pond fills the screen; its bottom dock opens scene selection, live controls and copyable integration code. Switch between Zen, Moonlight, Autumn, Sakura and sunny Daylight, tune the pond, reset or randomize settings, and share a reproducible configuration.

Koi swim at individual depths, cast submerged shadows and rise toward food. Moving light patterns, a textured pond bed, translucent fins and surface ripples add depth without external assets. Tune water clarity and light patterns under Water; choose Quiet view in More to hide the dock, then press Escape to restore it.

To serve it locally instead, run `npm start`. This starts a development server; it does not publish or deploy the site.

For Vercel hosting and a custom subdomain, follow the [deployment guide](docs/DEPLOYMENT.md). The repository includes the required static build configuration.

## Install from GitHub

The npm registry package has not been published. Install the versioned source package with npm:

```sh
npm install git+https://github.com/dhruvil-codes/koi-pond.git#v0.4.0
```

The installed package name is `@dhruvil-codes/koi-pond`. The classic browser files are also committed in `dist/` for a direct download or local embed.

## Embed in HTML

Load the classic build and add a pond element. Give it a height in your layout:

```html
<script src="./dist/koi-pond.iife.js"></script>
<koi-pond environment="zen" fish-count="12" style="display:block;height:480px"></koi-pond>
```

The browser build registers `<koi-pond>` automatically. See [API](docs/API.md) for settings and methods, [Integrations](docs/INTEGRATIONS.md) for React, Next.js and background examples, and [Architecture](docs/ARCHITECTURE.md) for the source map.

## Configuration and sharing

The public `serializeConfig(options)` function returns versioned JSON with normalized settings. The playground's share URL stores that JSON in the `#pond=` hash, so opening the link restores the settings and seed. Loading a shared pond starts a fresh simulation; the link does not store a screenshot or motion timeline.

## Development

Use Node.js 22 or newer to rebuild or run project checks:

```sh
npm ci
npm run build
npm test
```

The embeddable library has no runtime dependencies. The playground uses React, Cloudflare Kumo buttons and ReUI controls, bundled into the standalone page at build time. These packages are development dependencies and are not imported by the library. See [Contributing](CONTRIBUTING.md) for browser checks and [third-party notices](docs/THIRD-PARTY-NOTICES.md) for UI licenses.

The optional T3 adapter remains an isolated experiment for the inspected Windows app version; it is not part of the pond runtime.

## License

MIT. See [LICENSE](LICENSE).
