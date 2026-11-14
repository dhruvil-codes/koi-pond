# Roadmap

This document separates the initial 0.1 release scope from ideas that still need implementation and review. Dates and ordering may change as the project develops.

## v0.1 — shipped in this repository

- [x] Dependency-free standalone `index.html` that runs offline when opened directly.
- [x] Classic script build (`dist/koi-pond.iife.js`) with global `KoiPond` and automatic `<koi-pond>` registration.
- [x] ESM build (`dist/koi-pond.js`) and TypeScript declarations (`types/index.d.ts`).
- [x] Interactive midnight, rain and dusk environments; feeding, ripples, pause/reset and PNG export.
- [x] Responsive demo controls and copyable embed snippet.
- [x] MIT license and source, API, integration and contribution documentation.
- [x] Experimental Windows T3 adapter isolated under `integrations/t3/`.

The npm package is not published, and hosted demo deployment or release assets are not part of this repository's current state.

## Planned, prioritized

### 1. More environments and weather

Add a small number of distinct, coherent presets and weather effects without obscuring the koi or making the scene noisy.

**Acceptance:** presets are selectable through the public API and demo; switching does not reset fish or food; defaults remain visually legible; tests cover option validation and state continuity.

### 2. Fish species and behaviors

Explore configurable markings, sizes and movement patterns while retaining the recognizable ASCII pond style.

**Acceptance:** new behavior is opt-in or backward-compatible with existing defaults; deterministic simulation checks cover new rules; interaction remains usable by pointer and keyboard.

### 3. Custom palette and editor

Consider a documented palette API and a compact way to preview color choices.

**Acceptance:** palette inputs are validated, accessible controls have text labels, and custom values do not require external assets or network access.

### 4. Rendering performance options

Investigate worker or WebGL rendering only if profiling shows the current canvas renderer cannot meet practical needs.

**Acceptance:** a measured workload demonstrates a meaningful improvement; the existing canvas path remains supported; the added path handles resize, reduced motion and cleanup correctly.

### 5. Framework wrappers

Consider thin wrappers for frameworks where lifecycle or typing friction is demonstrated by real use.

**Acceptance:** wrappers stay optional, reuse the core implementation, document cleanup, and do not add framework dependencies to the standalone build.

### 6. npm and release automation

Publish `@dhruvil-codes/koi-pond` and automate reproducible package and release artifacts when release setup is ready.

**Acceptance:** a clean checkout builds and packages the same committed distributables; package contents are reviewed; version and install instructions are verified before publication.

### 7. App integrations

Evaluate additional host-app integrations based on concrete demand and available verification environments. T3 support remains experimental meanwhile.

**Acceptance:** each integration has an isolated implementation, clear tested version/platform scope, safe install and removal instructions, and no proprietary archives or machine-specific data in Git.
