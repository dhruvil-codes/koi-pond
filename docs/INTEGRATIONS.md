# Integrations

Koi Pond can be used in plain HTML or mounted by a framework. The classic browser build registers the custom element automatically. The ESM build exports `createKoiPond` for applications that own a canvas lifecycle. In either case, the host application owns layout, stacking order and readable content surfaces.

## Plain HTML

```html
<script src="./dist/koi-pond.iife.js"></script>
<koi-pond environment="midnight" interactive="true" style="display:block;height:480px"></koi-pond>
```

## ESM and bundlers

Import `dist/koi-pond.js` and create a pond on a canvas after the canvas has a rendered size. Destroy the controller when removing that canvas. Importing the source module in Node is safe; DOM access is deferred until browser-only APIs are used.

Use an HTTP server or bundler for browser ESM imports. For a page opened directly from disk, use the classic script build instead.

```js
import { createKoiPond } from './dist/koi-pond.js';

const pond = createKoiPond(canvas, { environment: 'rain' });
// Later, when removing the canvas:
pond.destroy();
```

## React lifecycle example

The custom element needs no framework wrapper. For a controller-managed canvas, create it after mount and destroy it during cleanup:

```jsx
import { useEffect, useRef } from 'react';
import { createKoiPond } from './dist/koi-pond.js';

export function Pond({ environment = 'midnight' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const pond = createKoiPond(canvasRef.current, { environment });
    return () => pond.destroy();
  }, [environment]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 480 }} />;
}
```

Set the canvas dimensions through CSS or the parent layout. The controller observes size changes. If the pond should persist across environment changes, call `setOptions({ environment })` instead of recreating it.

## Decorative background

Set `interactive="false"` when the pond is decorative. Place it in a host-controlled background layer and keep foreground text on a readable surface. Koi Pond does not inject global styles or choose your stacking order. If using a manually managed canvas, configure `interactive: false` and provide the same host layout and contrast treatment.

## Optional T3 integration

An experimental adapter is kept in [`integrations/t3/`](https://github.com/dhruvil-codes/koi-pond/tree/main/integrations/t3). It is pinned to the inspected Windows T3 version 0.1.9. It is not a general integration layer; other operating systems and app versions have not been verified. No proprietary app archive is distributed with this project.
