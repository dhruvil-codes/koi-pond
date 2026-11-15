# Pond depth and interaction upgrade

Keep the full-screen procedural ASCII pond, Inter UI, Kumo primary buttons, ReUI controls and the dependency-free embed. The pond stays the focal point; no headings, page scroll, audio or new rendering framework.

Research: Evan Wallace's [WebGL Water](https://madebyevan.com/webgl-water/) demonstrates the value of separate shadows, caustics and surface ripples. Craig Reynolds' [arrival steering](https://red3d.com/cwr/steer/Arrival.html) explains smooth approach to targets. These are visual and motion references; implement original lightweight cell rendering rather than copying their code or assets.

## Visual direction

Jade #063b35, submerged teal #072b2d, warm ivory #fffbed, koi red #f76d54, graphite #242725 and sage #c5d8b4. Environment palettes retain their identities. Inter is the UI face; the pond retains its monospace character texture. One quiet bottom dock and small anchored panels. Spend the detail on koi anatomy and water layers, with open swimming space between plants.

## Required work

- Koi: deterministic individual depth with smooth surfacing toward food, slower coasting and stronger tail effort during acceleration, refined scales/fins/eyes, visible depth-separated shadows. Preserve the articulated spine, fish variety colors, feeding arrival and environment-independent fish state.
- Water: subtle submerged pebbles and plants near banks, moving caustic filaments, less mechanical ambient rings, brighter decaying visitor ripples above fish and below floating plants. Add bounded `waterClarity` (default .8) and `causticIntensity` (default .65), both 0–1 and independently configurable. These affect rendering only.
- Interaction: clear tap ripple and short bite/bubble feedback at consumed pellets; food remains visible and edible. Pointer trails should feel fluid and stay bounded.
- Playground: actual engine-rendered static scene thumbnails inside the primary scene buttons, accurate labels and selected states. Add the two water controls. Add a quiet view that hides the dock with an accessible restore control and Escape recovery. Keep every control within mobile and landscape viewports.
- Integration: new settings work in JSON, share links, snippets, custom-element attributes and public TypeScript types. Older configs retain defaults. Publish version 0.4.0 and its matching install tag.

## Acceptance

Deterministic frames and motion; rendering does not mutate fish; environment changes preserve fish and food; depth and acceleration remain smooth at 30/60 Hz; feeding regression checks pass. Clarity/light controls visibly alter frames without altering simulation. No external runtime assets or dependencies. Keep bounded grids and cached scenery, and measure representative render costs before/after. Verify the offline browser controls and scene previews at desktop, mobile and short landscape sizes, then verify the public deployment.
