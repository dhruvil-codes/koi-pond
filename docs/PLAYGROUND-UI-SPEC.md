# Immersive playground interface

The pond fills the viewport. Remove the top-left title, scene label, seed overlay, side inspector and page chrome. Keep one compact dock at the bottom with scene selection, fish settings, atmosphere settings, playback and developer actions. The initial view leaves the pond unobstructed. Controls open above their trigger and close with Escape or outside interaction.

Use real open-source ReUI controls for sliders, selects, tabs and overlays. Use Cloudflare Kumo's `Button` component for actions, as selected by the owner. Keep UI dependencies confined to the playground build.

Design: the pond supplies the color; the dock uses warm charcoal (#242725), raised graphite controls (#343835), soft white (#f3f2ee), muted stone (#b8bdb6), and pale sage (#c5d8b4) for selection and focus. Small, restrained sans-serif labels; no headline or marketing copy. Subtle top-edge lighting and physical press feedback, with 140–180 ms transitions and reduced-motion support.

All existing settings remain accessible: fish count 1–30, speed 0.1–3, size, varieties, behavior, environment, water color, lilies, lotus, particles, ripples, time, seed, quality and interactivity. Preserve independent environment/fish settings and exact share/config snippets. Keep reset, randomize, pause, snapshot, npm command, framework snippets and JSON import/export.

No document scrolling at desktop or mobile sizes. Divide settings into compact panels and tabs so controls fit the viewport; use safe-area spacing and responsive dock composition. Provide accessible labels, visible focus, keyboard-operable controls, proper dismissal/focus restoration, and text feedback for copy/errors. The animation engine and dependency-free embed remain independent of the playground UI. The standalone page remains self-contained and works offline.

Acceptance: complete controls update the existing engine immediately, environment switches preserve fish settings, generated code reproduces current options, shared URLs restore options, all dock panels fit representative desktop/mobile/landscape viewports, the page does not scroll, production build and existing engine tests pass, and the public Vercel deployment serves the new interface.

Control reliability: scene buttons fill equal grid columns, selected marks do not shift labels, and dropdown options use consistent text insets with a separate selection indicator. Menus stay within the viewport above the bottom dock. Feeding produces a visible surface pellet; koi approach smoothly, consume food they reach before its expiry, and remove eaten pellets. Cover feeding arrival and render visibility with regression tests and check the actual browser layouts.
