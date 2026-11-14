# Koi Pond

A small, dependency-free interactive ASCII koi pond for a page, prototype or app. Open the standalone `index.html` offline, or embed the browser build as a custom element. It uses canvas and character art; it makes no network requests and loads no external fonts, images or runtime packages.

The default scene has four adult koi, three young koi, lily pads and a lotus. Hover or drag to stir the water, then click or tap to feed. Use the keyboard when the pond has focus: arrow keys move the cursor, Enter feeds, Space pauses and R resets.

## Try it

Download or clone the repository and open `index.html` in a modern browser. It works directly from disk.

```sh
git clone https://github.com/dhruvil-codes/koi-pond.git
cd koi-pond
```

The demo includes Midnight, Rain and Dusk environments, speed and fish-count controls, plant toggles, pause/reset, PNG export and an embed snippet that follows your settings. To serve the demo locally, explicitly run:

```sh
npm start
```

This starts a local development server; it does not deploy the site. To regenerate the browser builds or run the project checks, install Node.js 22 or newer and run:

```sh
npm install
npm run build
npm test
```

There are no runtime dependencies. The package name `@dhruvil-codes/koi-pond` is planned, but has not been published to npm. For now, clone or download the repository and use its committed files.

## Embed

Include the classic build and add the element where you want the pond. Give its host a size:

```html
<script src="./dist/koi-pond.iife.js"></script>

<koi-pond
  environment="midnight"
  speed="1.35"
  fish-count="7"
  style="display:block; height:480px"
></koi-pond>
```

The browser build registers `<koi-pond>` automatically. See [API](docs/API.md) for attributes and controller methods, [Integrations](docs/INTEGRATIONS.md) for framework examples, [Architecture](docs/ARCHITECTURE.md) for the project map, and [Roadmap](docs/ROADMAP.md) for planned work.

The pond pauses offscreen and when its tab is hidden. Reduced motion starts it paused, with Play available. There are no global page styles, so multiple ponds and existing apps can coexist. The optional, version-specific T3 adapter is documented separately and remains experimental.

## License

MIT. See [LICENSE](LICENSE).
