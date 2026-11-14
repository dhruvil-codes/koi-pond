# Koi Pond 0.2

Koi Pond is a dependency-free interactive ASCII pond. It can run from the committed standalone HTML page, as a classic browser custom element, or through an ES module canvas controller. It makes no runtime network requests and uses no remote images or fonts.

## 0.2 scope

- Four canonical procedural environments: `zen` (Zen Garden), `moonlight` (Moonlight), `autumn` (Autumn) and `sakura` (Sakura Spring). The legacy ids `midnight`, `rain` and `dusk` remain accepted by configuration but are not shown as additional choices.
- A layered renderer keeps fish and environment responsibilities separate. The renderer paints the environment back layer, fish, then environment foreground. Environment changes do not mutate or reset fish, positions, spine points, speeds, kinds, food or simulation time.
- A responsive playground provides environment selection, live pond settings, Reset to defaults and Randomize controls, copied install/configuration outputs and a share link.
- Classic browser and ESM builds, TypeScript declarations, examples and standalone `index.html` are committed. The classic browser file and standalone page work offline. ESM imports defer browser APIs so server-side module loading is safe.
- The optional T3 adapter remains an isolated experiment pinned to the inspected Windows version 0.1.9. It is not applied by ordinary project checks.

## Settings

`DEFAULT_OPTIONS` and `VARIETIES` are exported. The normalized settings are:

| Key | Default | Accepted values |
| --- | --- | --- |
| `environment` | `zen` | `zen`, `moonlight`, `autumn`, `sakura`; accepted legacy aliases: `midnight`, `rain`, `dusk` |
| `fishCount` | `12` | integer `1`–`30` |
| `speed` | `1.35` | finite number `0.1`–`3` |
| `fishSize` | `1` | finite number `0.5`–`1.8` |
| `varieties` | `kohaku`, `sanke`, `ogon`, `shusui` | nonempty unique array containing only those ids |
| `behavior` | `wander` | `wander`, `school`, `circle` |
| `waterColor` | `null` | `null` for preset water, or `#rrggbb` |
| `lilyDensity` | `0.7` | finite number `0`–`1` |
| `lotusCount` | `2` | integer `0`–`6` |
| `particleDensity` | `0.45` | finite number `0`–`1` |
| `rippleIntensity` | `1` | finite number `0`–`2` |
| `timeOfDay` | `auto` | `auto` or finite hour `0`–`24` |
| `seed` | `2026` | integer `0`–`4294967295` |
| `lilies` | `true` | boolean; v0.1 compatibility |
| `lotus` | `true` | boolean; v0.1 compatibility |
| `detail` | `fine` | `fine`, `balanced` |
| `paused` | `false` | boolean |
| `interactive` | `true` | boolean |

Unknown options and invalid values are rejected atomically. Normalized arrays are cloned and public configuration reads do not expose mutable model state.

## Configuration and controller

The config module exports `validateOptions(partial, current?)`, `serializeConfig(options)`, `parseConfig(json)`, and `randomizeConfig(seed?)`. Serialization is JSON in the envelope `{ "version": 1, "options": { ... } }`. Parsing also accepts a plain options object encoded as JSON. Seeded randomization returns the same normalized settings for the same seed.

The controller adds `getConfig()` for cloned normalized settings, `setConfig(stringOrObject)`, `resetToDefaults()` and `randomize(seed?)`, while preserving the existing controller API. `reset()` restarts motion while retaining current settings. `resetToDefaults()` explicitly restores defaults. `setOptions(partial)` remains an atomic partial update.

The full normalized configuration, including the seed, is serialized into `#pond=encodeURIComponent(serializeConfig(config))`. Opening a share link restores configuration before interaction and starts a fresh simulation. Links do not store screenshots or promise to restore a motion timeline.

Environment-only changes preserve current fish object references and their positions, spines, speeds and varieties, as well as food and simulation time. Count changes preserve surviving fish. Changes to size, varieties or behavior update fish in place and do not reset world time. An explicit seed change may reseed fish layouts for reproducibility.

## Browser and lifecycle behavior

`createKoiPond(canvas, options)` manages a single canvas. `createPond(columns, rows, aspect, options?)`, `configurePond`, `advance`, `resizePond`, `feed`, `disturb`, `renderPond`, `validateOptions`, `ENVIRONMENTS` and `PALETTE` remain core exports. The controller supports `play`, `pause`, `toggle`, `reset`, `setOptions`, `getState`, `feed`, `ripple`, `exportPNG` and `destroy` alongside the new configuration methods.

The pond pauses offscreen and while the document is hidden. Reduced-motion preference starts it paused, with Play available. Destroy releases listeners, observers and animation frames; custom elements can disconnect and reconnect. Pointer taps feed only after pointer-up confirms the action was not a drag. Keyboard interaction is available while the pond has focus. Standalone demo controls remain separate from the library.

## Installation status

The npm registry package has not been published. The documented source install is `npm install git+https://github.com/dhruvil-codes/koi-pond.git#v0.2.0`; create the `v0.2.0` tag when shipping. The import name after installing the repository package is `@dhruvil-codes/koi-pond`. Do not describe it as a registry-published package.

## Release checks

- Validate option ranges, unknown keys, atomicity and configuration roundtrips.
- Verify environment changes preserve fish, food and time; verify fish count/size/variety/behavior effects.
- Verify distinct procedural scenes, density extremes and seeded repeatability.
- Exercise multiple controllers, custom-element reconnect, input filtering and disposal.
- Check playground controls and that generated configuration/install/share output matches the active normalized settings.
- Review all four scenes at desktop and mobile sizes; check responsive controls, accessibility labels, touch targets, reduced motion and offscreen pause.
- Build from a clean checkout and inspect package contents. Keep proprietary app archives, personal files and reference imagery out of Git.

The T3 integration remains an isolated experiment at version 0.1.9 and is not applied as part of release checks.
