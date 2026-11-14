# Roadmap

The 0.2 implementation adds environment separation, a configurable playground and reproducible settings. Release packaging and npm registry publication remain pending. This list distinguishes the current release scope from possible later work.

## v0.2 — implementation scope

- Four canonical procedural environments: Zen Garden, Moonlight, Autumn and Sakura Spring.
- Separate fish behavior, environment painting, configuration and browser lifecycle modules.
- Normalized settings, versioned JSON serialization, validation and seeded randomization.
- Controller methods for reading/replacing settings, resetting to defaults and randomizing.
- Playground controls, copyable configuration/install instructions and seeded share links.
- Plain HTML, React/Next.js lifecycle and decorative portfolio background examples.
- Classic and ESM distribution paths with no runtime dependencies; standalone HTML remains usable offline.

The npm registry package is not published. A GitHub-source installation command is documented for the `v0.2.0` tag to be created when shipping. A hosted deployment URL is not part of these docs.

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
