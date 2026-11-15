# Public library readiness

Make installation and compatibility verifiable, and give new contributors a README they can use without this conversation. Preserve the pond design, existing settings, framework-independent engine and dependency-free embed. Version this work as 0.4.2 if runtime or distribution behavior changes.

## Work

- Install the current public Git tag in an empty consumer project. Verify package exports, SSR import, public declarations, classic HTML and the decorative portfolio example. Verify React lifecycle and a Next.js production/static build using the actual packaged library. Fix problems exposed by those checks and retain useful regression checks.
- Run the playground browser suite in Chromium, Firefox and WebKit. Make browser selection explicit and store separate evidence per engine. Add browser and TypeScript checks to CI. Cover offline operation, keyboard access, reduced motion, resize, small/landscape viewports, feeding and exact copy/share/import behavior. Do not treat engine emulation as physical iOS or Android testing.
- Rewrite README.md with a real project preview, live demo, copyable static HTML and npm setup, framework and portfolio guidance, current configuration/controls, reproducibility, performance/accessibility behavior, troubleshooting and contributor/license links. Clearly state the npm registry publication status. Link complete API docs rather than duplicating the whole API. Keep claims tied to actual evidence.
- Update contributor and testing instructions to match runnable commands. Keep proprietary archives, credentials and test scratch files out of the release package.

## Acceptance

Fresh consumers can follow documented commands. All browser engines and unit/type/build checks pass, or any concrete platform restriction is documented rather than hidden. Configuration and lifecycle remain compatible. The README examples agree with the public types and current release tag. Source, committed builds and the deployed playground match.
