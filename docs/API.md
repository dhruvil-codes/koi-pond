# API

Koi Pond can run as a custom element or as a controller on a canvas. The library and generated browser builds have no runtime dependencies. The package name is `@dhruvil-codes/koi-pond`; the npm registry package is not published. See [installation](../README.md#install-from-github) for the GitHub source command.

## Custom element

Load the classic browser build to register `<koi-pond>`:

```html
<script src="./dist/koi-pond.iife.js"></script>
<koi-pond environment="moonlight" fish-count="8" style="display:block;height:420px"></koi-pond>
```

The element fills its host, so set a height in your layout. Its `.pond` property exposes the controller after connection. Removing the element releases its resources; reconnecting creates a fresh pond.

### Settings

The public configuration keys and defaults are:

| Key | Default | Accepted values |
| --- | --- | --- |
| `environment` | `zen` | `zen`, `moonlight`, `autumn`, `sakura`, `daylight`; legacy ids `midnight`, `rain`, `dusk` are accepted |
| `fishCount` | `12` | integer from `1` to `30` |
| `speed` | `1.35` | finite number from `0.1` to `3` |
| `fishSize` | `1` | finite number from `0.5` to `1.8` |
| `varieties` | `['kohaku', 'sanke', 'ogon', 'shusui']` | nonempty unique list from those four ids |
| `behavior` | `wander` | `wander`, `school`, `circle` |
| `waterColor` | `null` | `null` for preset water, or a six-digit hex color such as `#174b55` |
| `waterClarity` | `0.8` | finite number from `0` (murky) to `1` (clear); affects submerged detail and fish shading |
| `causticIntensity` | `0.65` | finite number from `0` to `1`; strength of moving underwater light |
| `lilyDensity` | `0.7` | finite number from `0` to `1` |
| `lotusCount` | `2` | integer from `0` to `6` |
| `particleDensity` | `0.45` | finite number from `0` to `1` |
| `rippleIntensity` | `1` | finite number from `0` to `2` |
| `timeOfDay` | `auto` | `auto` or a finite hour from `0` to `24` |
| `seed` | `2026` | integer from `0` to `4294967295` |
| `lilies` | `true` | boolean; retained for v0.1 compatibility |
| `lotus` | `true` | boolean; retained for v0.1 compatibility |
| `detail` | `fine` | `fine`, `balanced` |
| `paused` | `false` | boolean |
| `interactive` | `true` | boolean |

Custom-element attributes use kebab case for multiword names (`fish-count`, `fish-size`, `water-color`, `water-clarity`, `caustic-intensity`, `lily-density`, `lotus-count`, `particle-density`, `ripple-intensity`, `time-of-day`). Boolean values are written explicitly, for example `interactive="false"`. Use the controller for array-valued `varieties`. Invalid settings are rejected atomically.

The canonical scene choices are Zen Garden (`zen`), Moonlight (`moonlight`), Autumn (`autumn`), Sakura Spring (`sakura`) and sunny Daylight (`daylight`). The older ids remain accepted for configuration compatibility and are not additional preset choices.

The default touch policy allows vertical page scrolling in embeds. A full-screen canvas host can set `canvas.style.touchAction = 'none'` before mounting to support stirring in every direction. The playground uses this policy; the original inline style is restored on destruction.

## Canvas controller

Use the ESM build with a canvas that your application creates and sizes:

```js
import { createKoiPond } from '@dhruvil-codes/koi-pond';

const canvas = document.querySelector('#pond');
const pond = createKoiPond(canvas, { environment: 'sakura', fishCount: 8 });

pond.feed(0.5, 0.5);
// Dispose when the canvas leaves the page:
pond.destroy();
```

The canvas must already have a CSS size. The controller observes its size and scales the drawing surface. Coordinates passed to `feed` and `ripple` are normalized from `0` to `1`; finite out-of-range coordinates are clamped.

### Controller methods

- `play()`, `pause()` and `toggle()` control animation.
- `reset()` restarts motion while keeping the current settings.
- `setOptions(partial)` validates and applies a partial settings update atomically.
- `getConfig()` returns a cloned, normalized settings object.
- `setConfig(stringOrObject)` replaces settings from an options object, serialized JSON string, or versioned configuration envelope.
- `resetToDefaults()` restores `DEFAULT_OPTIONS`.
- `randomize(seed?)` generates a reproducible settings set; passing the same seed produces the same settings.
- `serialize()` returns the current options in the versioned JSON format.
- `feed(x, y)` adds food at normalized coordinates.
- `ripple(x, y, strength?)` adds a ripple at normalized coordinates.
- `getState()` returns a snapshot of current options and `paused`, `foodCount`, `eaten` and `destroyed` state. It is not a live mutable model.
- `exportPNG()` returns a PNG data URL of the current pond image.
- `destroy()` stops animation and releases listeners and observers. Call it when disposing a manually managed canvas.

Environment-only setting changes preserve existing fish objects and their positions, spine points, speeds and kinds, as well as food and simulation time. Population changes retain surviving fish. `reset()` keeps settings; use `resetToDefaults()` to restore defaults.

### Configuration helpers

```js
import {
  DEFAULT_OPTIONS,
  VARIETIES,
  serializeConfig,
  parseConfig,
  randomizeConfig,
} from '@dhruvil-codes/koi-pond';

const json = serializeConfig({ environment: 'autumn', seed: 42 });
const config = parseConfig(json);
const repeatable = randomizeConfig(42);
```

`serializeConfig(options)` returns JSON in the versioned form `{ "version": 1, "options": { ... } }`. `parseConfig(string)` accepts that envelope or a plain options object encoded as JSON, validates it, and returns normalized options. Unknown keys and invalid values are rejected; arrays are cloned. `DEFAULT_OPTIONS` and `VARIETIES` are exported constants.

## Events and lifecycle

User-visible pond changes emit `pondchange` from the canvas. The event bubbles and is composed, so it can be observed across component boundaries. Invalid custom-element attributes emit `ponderror` with a `message`; the active controller is left unchanged.

The pond pauses when hidden or offscreen. Reduced-motion preference starts it paused, with Play available. Browser-only APIs are deferred so importing the ESM entry in a server environment is safe; create the pond only in a browser lifecycle.

Randomizing preserves the current pause/interaction mode. Reset to defaults respects the operating system's reduced-motion setting. Fine and balanced are requested quality levels; the renderer also bounds its column budget by fish count and size, and can reduce its refresh rate on slow hardware without changing simulation speed.
