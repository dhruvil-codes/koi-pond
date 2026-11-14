# API

Koi Pond provides a custom element for markup-first use and a controller for canvases managed by your application. The committed browser files work without a package install. The npm package `@dhruvil-codes/koi-pond` is not published yet.

## Custom element

Load the classic browser build to register `<koi-pond>`:

```html
<script src="./dist/koi-pond.iife.js"></script>
<koi-pond environment="rain" speed="1.2" fish-count="6" style="display:block;height:420px"></koi-pond>
```

The element fills its host, so set a height (and, if needed, width) in your own layout. It exposes its controller as the `.pond` property after connection. Removing the element releases its resources; reconnecting it creates a working pond again.

### Attributes

| Attribute | Values | Default | Meaning |
| --- | --- | --- | --- |
| `environment` | `midnight`, `rain`, `dusk` | `midnight` | Water and ambient effect preset. |
| `speed` | number from `0.25` to `2.5` | `1.35` | Swimming speed. |
| `fish-count` | integer from `1` to `16` | `7` | Number of koi. |
| `lilies` | `true`, `false` | `true` | Show lily pads. |
| `lotus` | `true`, `false` | `true` | Show the lotus. |
| `detail` | `fine`, `balanced` | `fine` | Rendering detail setting. |
| `paused` | `true`, `false` | `false` | Start or keep the animation paused. |
| `interactive` | `true`, `false` | `true` | Enable pointer and keyboard pond interaction. |

Boolean attributes are explicit string values: use `lilies="false"` to turn lilies off. Omitting an attribute uses its default. Invalid settings are rejected rather than partially applied.

The pond pauses when hidden or offscreen. If the operating system requests reduced motion, it starts paused; the user can still choose to play it.

## Canvas controller

Use the ESM build with a canvas you create and size yourself:

```js
import { createKoiPond } from './dist/koi-pond.js';

const canvas = document.querySelector('#pond');
const pond = createKoiPond(canvas, { environment: 'dusk', fishCount: 5 });

pond.feed(0.5, 0.5);
// When the host no longer needs this canvas:
pond.destroy();
```

The canvas must already have a CSS size; the controller observes it and scales the drawing surface. Coordinates passed to `feed` and `ripple` are normalized from `0` to `1` across the canvas. Out-of-range finite coordinates are clamped; nonfinite coordinates throw.

### Controller methods

- `play()` and `pause()` control animation; `toggle()` switches between them.
- `reset()` resets the pond scene.
- `setOptions(partial)` updates supported settings. Invalid options are rejected without applying only part of the update.
- `feed(x, y)` adds food at normalized coordinates.
- `ripple(x, y, strength?)` adds a ripple at normalized coordinates.
- `getState()` returns a snapshot of current options and `paused`, `foodCount`, `eaten` and `destroyed` state. It is not a live mutable model.
- `exportPNG()` returns a PNG data URL for the current pond image.
- `destroy()` stops animation and releases listeners and observers. Call it when disposing of a manually managed canvas.

## Events

User-visible pond changes emit `pondchange` from the canvas. It bubbles and is composed, so a listener can observe changes across component boundaries:

```js
document.querySelector('koi-pond').addEventListener('pondchange', (event) => {
  console.log(event.detail);
});
```

Invalid attributes leave the active controller unchanged and emit a `ponderror` event whose detail contains a `message`. Fixing invalid initial attributes allows the element to start.

The event detail contains a state snapshot. Use `getState()` when you need the current snapshot at another time.
