# Roadmap

The current release includes environment separation, a configurable playground and reproducible settings. npm registry publication remains pending. This list distinguishes shipped work from possible later work.

## v0.4 — pond depth

- Individual koi depth, smooth surfacing toward food, depth-sorted bodies and submerged shadows.
- Translucent fin rays, responsive tail effort, water wakes and brief feeding bubbles.
- Procedural pond-bed stones and plants, animated caustics, water clarity and light controls.
- Engine-rendered scene previews and a quiet view with keyboard recovery.

The 0.4.1 visual refinement smooths the water field, limits caustics to irregular patches, softens plant/bank shadows and replaces scattered glare with connected reflection bands. A cached background raster provides correct translucent compositing and restoration during movement.

## v0.4.2: installation and compatibility

- Git installs consume the committed library builds without installing playground development dependencies.
- Resize notifications share one deferred update; unchanged dimensions retain the cached canvas.
- Switching between keyboard and pointer input no longer replays an open panel's entrance animation or disrupts dropdown positioning in WebKit.
- CI checks Chromium, Firefox and WebKit, plus installed HTML, React Strict Mode and Next.js static-export consumers.
- README, contributor instructions and testing notes document the installation path, cleanup, reproducibility and coverage limits.

## v0.2 — implementation scope

- Five procedural environments: Zen Garden, Moonlight, Autumn, Sakura Spring and sunny Daylight.
- Separate fish behavior, environment painting, configuration and browser lifecycle modules.
- Normalized settings, versioned JSON serialization, validation and seeded randomization.
- Controller methods for reading/replacing settings, resetting to defaults and randomizing.
- Playground controls, copyable configuration/install instructions and seeded share links.
- Plain HTML, React/Next.js lifecycle and decorative portfolio background examples.
- Classic and ESM distribution paths with no runtime dependencies; standalone HTML remains usable offline.

The npm registry package is not published. Install the versioned GitHub source from the `v0.4.2` tag. The public playground is hosted at https://koi-pond.bydhruvil.in/.

## Future work

### Custom palette and editor

Consider an optional palette API and a compact editor for user-selected colors.

**Acceptance:** palette values are validated, labels remain accessible, serialized configurations round-trip, and no external assets are required.

### More fish varieties and behavior

Explore additional koi markings, varieties or movement patterns if they add clear visual variety while keeping the koi readable.

**Acceptance:** additions stay reproducible with seeded settings and do not reset unrelated state when settings change.

### Rendering performance

Consider worker rendering or other acceleration only if profiling shows the current canvas path misses practical performance targets.

**Acceptance:** a measured workload demonstrates a useful improvement; resize, reduced motion and lifecycle cleanup continue to work.

### npm publication and release automation

Publish `@dhruvil-codes/koi-pond` to the npm registry and automate reproducible release artifacts when release setup is ready.

**Acceptance:** a clean checkout builds and packages the committed outputs, package contents are reviewed, and version/install instructions match the published release.

### Additional host integrations

Consider other integrations based on concrete demand and available verification environments. The T3 adapter remains experimental meanwhile.

**Acceptance:** each integration has an isolated implementation, clear platform/version scope, cleanup instructions and no proprietary archives or machine-specific files in Git.
