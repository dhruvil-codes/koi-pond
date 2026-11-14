# Integrations

Koi Pond works in plain HTML or in an application that owns a canvas. The classic browser build registers the custom element. The ESM build exports `createKoiPond` for frameworks and apps that manage canvas lifecycle. The host controls layout, stacking order and text contrast.

## Plain HTML

```html
<script src="./dist/koi-pond.iife.js"></script>
<koi-pond environment="zen" interactive="true" style="display:block;height:480px"></koi-pond>
```

`examples/embed.html` is a complete local embed page. The standalone browser build works without a package manager or network connection.

## ESM applications

After installing the package from its GitHub source, import the controller from `@dhruvil-codes/koi-pond`. Create it when the canvas is mounted, and destroy it when the canvas is removed:

```js
import { createKoiPond } from '@dhruvil-codes/koi-pond';

const pond = createKoiPond(canvas, { environment: 'autumn' });
// Later, when removing the canvas:
pond.destroy();
```

Importing the ESM package does not access browser globals immediately, so server-side module loading is safe. Call `createKoiPond` only on the client, after the canvas has a rendered size. For a page opened directly from disk, use the classic script build instead of a browser ESM import.

## React and Next.js

`examples/ReactPond.jsx` mounts the canvas controller in one effect and updates settings through another. Its cleanup destroys the controller. This also handles React Strict Mode's development setup/cleanup cycle without keeping an old instance. The effect pattern follows React's [`useEffect` reference](https://react.dev/reference/react/useEffect).

For a Next.js App Router project, the example file is a client component and starts with `'use client'`. That directive establishes the browser component boundary required for effects and browser interaction. See the [Next.js `use client` reference](https://nextjs.org/docs/app/api-reference/directives/use-client). The example passed an optimized production build and static prerender in a minimal Next.js 16.4.6 / React 19.3.1 app. Canvas interactions are additionally exercised by the standalone browser fixture; this does not substitute for testing your app's full layout and routing.

The package import assumes the GitHub source install described in the [README](../README.md#install-from-github); it does not imply that the package is published to the npm registry.

## Decorative portfolio background

[`examples/portfolio.html`](../examples/portfolio.html) demonstrates a fixed background canvas behind page content. It sets `interactive: false`, disables pointer events, and marks its wrapper `aria-hidden="true"`. Keep foreground text on an opaque or sufficiently contrasted surface. For an app-managed canvas, apply the same host layout and accessibility treatment.

## Reproducible configuration links

Configuration links encode the complete normalized settings in the URL hash. Load and validate them before the user interacts with the pond:

```js
import { createKoiPond, parseConfig } from '@dhruvil-codes/koi-pond';

const match = location.hash.match(/^#pond=(.*)$/);
const options = match ? parseConfig(decodeURIComponent(match[1])) : undefined;
const pond = createKoiPond(canvas, options);
```

To create a link, serialize the settings with `serializeConfig(config)` and use `#pond=${encodeURIComponent(json)}`. The seed makes settings and initial layout reproducible. A shared link starts a fresh simulation when opened; it does not capture a screenshot or promise to restore a motion timeline.

## Optional T3 integration

An experimental adapter is kept under [`integrations/t3/`](https://github.com/dhruvil-codes/koi-pond/tree/main/integrations/t3). It is pinned to the inspected Windows T3 version 0.1.9 and is not a general integration layer. Other operating systems and app versions have not been verified. The repository does not distribute proprietary app archives or reference images.
