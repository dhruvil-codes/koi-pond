# Environment Playground 0.2

Build the supplied four-scene reference as procedural ASCII/pixel elements, not image backdrops. Preserve the existing articulated fish, feeding, input filtering, responsive rendering and lightweight distribution. No runtime dependencies or remote assets.

## Independent layers and ownership

- `src/config.js`: validated options, defaults, versioned serialization, parsing and seeded randomization. Parent owns this file.
- `src/fish.js`: fish creation, articulated steering/advance/resize and fish-only painting. `src/palette.js` holds the original 83 fish/plant colors plus Shusui blue at 83–90; `src/math.js` has shared clamp/wrap/hash/ramp. Fish agent owns these and `src/core.js` orchestration, plus fish/core/motion tests.
- `src/environment.js`: procedural water, lighting, rocks, vegetation, branches/blossoms, lilies/lotuses, particles and atmosphere. Environment agent owns this and `src/environments.js`, environment/render tests. No fish mutation or behavior code here.
- `src/pond.js` browser lifecycle composes frames and input; `demo/` owns controls and outputs. Parent owns these, element/index/build/types/runtime tests.
- Docs/examples agent owns README, API/integration/architecture/roadmap/contribution docs and examples only.

Core compatibility: keep `createPond(columns,rows,aspect,options?)`, `configurePond`, `advance`, `resizePond`, `feed`, `disturb`, `renderPond`, `validateOptions`, `ENVIRONMENTS`, `PALETTE`. Store settings at `pond.options`. Environment-only configuration MUST preserve the existing fish object references, positions, spine points, speeds, kinds, food and simulation time. Count changes preserve survivors. Size/varieties/behavior update existing fish in place, never reset world time. Explicit seed changes may reseed fish layouts for reproducibility.

Environment contract: `ENVIRONMENTS` is five frozen metadata entries with canonical ids `zen`, `moonlight`, `autumn`, `sakura`, `daylight` and exact labels Zen Garden, Moonlight, Autumn, Sakura Spring, Daylight. Accept legacy `midnight`, `rain`, `dusk` in config; resolve them in environment code without showing them as new preset choices. `paletteForEnvironment(id,basePalette,options?)` returns <=256 hex colors, preserving fish colors 15–44 and 83–90. Append scenery colors from index91 onward. `paintEnvironmentBack(pond,frame,put)` and `paintEnvironmentFront(pond,frame,put)` receive frame `{columns,rows,chars,colors,coverage,palette}` and `put(x,y,glyph,color,coverage=0)`. Paint back, then fish, then front. They must be deterministic and never alter pond/fish state. Cache static vegetation/rocks/water as useful, with cache invalidation on size/scene/seed/settings. Respect all environment options. For the no-dependency bundler: use single-line imports, named exports, shared math imports; prefix environment-internal symbols with `env` to avoid flattened-bundle identifier collisions.

## Full normalized options

| Key | Default | Accepted values |
|---|---|---|
| environment | zen | zen, moonlight, autumn, sakura, daylight; legacy ids accepted |
| fishCount | 12 | integer 1–30 |
| speed | 1.35 | finite 0.1–3 |
| fishSize | 1 | finite 0.5–1.8 |
| varieties | kohaku,sanke,ogon,shusui | nonempty unique array of those ids |
| behavior | wander | wander, school, circle |
| waterColor | null | null for preset water, or #rrggbb |
| waterClarity | 0.8 | finite 0–1 |
| causticIntensity | 0.65 | finite 0–1 |
| lilyDensity | 0.7 | finite 0–1 |
| lotusCount | 2 | integer 0–6 |
| particleDensity | 0.45 | finite 0–1 |
| rippleIntensity | 1 | finite 0–2 |
| timeOfDay | auto | auto or a finite hour 0–24 |
| seed | 2026 | integer 0–4294967295 |
| lilies,lotus | true,true | booleans retained for v0.1 compatibility |
| detail | fine | fine, balanced |
| paused,interactive | false,true | booleans |

Reject unknown/invalid values atomically. Clone arrays; never leak mutable model state through public options. `DEFAULT_OPTIONS`, `validateOptions(partial,current?)`, `serializeConfig(options)` (JSON envelope `{version:1,options}`), `parseConfig(string)` (envelope or plain options), and `randomizeConfig(seed?)` are public. Public controller adds `getConfig()`, `setConfig(string|object)`, `resetToDefaults()`, `randomize(seed?)`, while preserving old methods. `reset()` keeps options and resets motion; Reset to defaults explicitly restores settings. Share encodes exact normalized options in URL hash and restores before interaction. Seeded initial layouts/behaviors and serialized roundtrips must be reproducible.

## Reference direction

Zen: layered jade water, mossy granite bank, reeds, blossom branch, pink lotuses. Moonlight: deep blue water, bright broken moon reflection from upper center, cool granite, dim vegetation and fireflies. Autumn: charcoal/amber water, golden reflection, branching orange maple canopy, drifting lobed leaves, tawny grasses. Sakura: indigo/violet water, blush reflection, flowering cherry branch, scattered pink petals, purple-gray rocks. Keep the koi readable and foreground center open. Place rocks at left edge and lower-right bank, branching foliage top-left, two plant/lotus clusters. Render individual shaded pieces with the existing character/material grid.

## Playground and integration

Art-first pond with five visually identifiable preset selectors; a compact inspector for fish/water/atmosphere; live values and all requested controls; Reset to defaults and Randomize. Clear separate Install and Configuration outputs, copy buttons, static/React/Next.js examples, background recipe, config import and share link. Responsive mobile layout, accessible labels/status, touch targets, reduced motion and offscreen pause. No generic analytics/dashboard cards.

The npm registry package is not published. Provide the real command `npm install git+https://github.com/dhruvil-codes/koi-pond.git#v0.4.0`, with clear GitHub-source label, and create the tag when shipping. Do not claim registry publication. Imported npm package name remains `@dhruvil-codes/koi-pond`. The embedded library has no playground dependency. Keep standalone index.html, classic and ESM builds, SSR-safe exports and lifecycle cleanup. Add a public GitHub Pages deployment when shipping if repository permissions permit.

## Verification

Test all ranges and atomicity, exact configuration roundtrips/share restoration, meaningful fish variety/size/behavior effects, environment-switch invariants, procedural visual differences and density extremes, multiple instances/reconnects, input filtering, browser controls/output equality, bounds and performance at 30 fish on mobile/desktop. Review the four original presets against the supplied reference and check the sunny Daylight preset on desktop and mobile. Benchmark and use cached scenery/dirty canvas updates to keep work bounded. Build and package from a clean checkout; no reference image or personal files in Git. T3 stays open and unmodified.
