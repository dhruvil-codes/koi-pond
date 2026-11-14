# Midnight Koi native backdrop

Local, reversible patch for the inspected **T3 Code (Beta) 0.1.9** installation. Nothing is installed by building or dry-running. Requires Node.js and PowerShell. No packages, network calls, credential access, or process termination.

1. Verify/build while T3 remains open: `powershell -NoProfile -File .\install.ps1 -Mode DryRun`
2. Close **all** T3 Code (Beta) windows, including background instances.
3. Install and reopen: `powershell -NoProfile -File .\install.ps1 -Mode Apply -Relaunch`
4. To undo, close T3 again: `powershell -NoProfile -File .\install.ps1 -Mode Restore -Relaunch`

Run commands from this directory. Apply and restore refuse to run while T3 is running. The original archive and SHA-256 receipt are stored in `backup/`; keep this folder until restoration. An unrecognized app archive or changed installed patch is refused so an app update cannot be overwritten. Dry-run writes `server.patched.asar` here and leaves the installed archive alone.

The build embeds the shared `../../src/core.js` and environment definitions. The adapter registers **Midnight Koi (animated)** alongside existing custom themes and selects dark mode once on its first successful run. Selecting any other theme removes and pauses the backdrop. Reduced motion and hidden windows pause animation. Empty-area pointer drops feed koi without intercepting controls. App content, sidebars, code blocks and popup panels retain readable surfaces. No new settings controls are inserted.

The artwork includes four adult koi and three young koi, swimming 35% faster with faint wakes, articulated bodies, layered scales, gills, barbels and fin rays. A pink and ivory lotus has overlapping petals and a golden seed head. Seven notched lily pads have raised rims, radial veins and small water droplets; passing ripples gently move the leaves. Character resolution increases with window size and stops at 480 columns to bound rendering work on large screens.

Restoring the archive removes the animation code. It preserves user theme preferences and the custom color entry; choose another theme in Appearance if desired. Reapplying is supported only while the original inspected archive is installed.

A T3 update can replace this local backdrop modification. This installer refuses other builds; it must be updated for a new app archive.

Checks: `node --test patch.test.mjs`. The fixture tests verify original entry bytes and offsets survive repacking, appended entries have correct block integrity, theme injection is scoped, and process/hash guards refuse unsafe restoration. Native visual review is still needed before applying; CSS is intentionally restricted to `html[data-theme-id="midnight-koi-animated"]`.
