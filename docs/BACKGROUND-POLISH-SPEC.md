# Cleaner pond background

Refine the existing ASCII pond into a quiet, cohesive scene. Keep the koi, all five environments, minimal Inter/Kumo/ReUI controls, shareable configuration and dependency-free embeds. No new controls, external images, audio or rendering dependencies.

Design: deep jade #052f2a, teal #145b50, ink blue #061d31, soft celadon #a3bc86, ivory #fffbed and lotus pink #edb3c2. The middle of the pond remains open. Put fine texture into koi, flowers and shoreline; keep open water smooth. Water light should drift in sparse, irregular patches rather than repeating all over the frame. Daylight uses soft sun reflections, Moonlight a restrained moon path, with matching amber and pink treatments for Autumn and Sakura.

Implementation: expose the cached submerged environment as the frame background. Cache its raster in the browser renderer, restore changed cells from that raster and composite translucent fish, light and ripples over it. Rebuild the raster on palette, geometry or viewport changes; release it when destroyed. Replace block noise and high-contrast bands with a smooth seeded depth field; soften pad/bank shadows, reduce leaf grain and refine leaf palettes. Rework light reflections into connected, fading bands, and reduce caustic coverage of open water.

Done: the background visibly reads smoother and calmer at desktop and mobile sizes; all scenes retain their identity, koi remain crisp and food visible; no fish state or configuration is reset. Repeated renders stay deterministic and unchanged frames cause no canvas work. Verify cache restoration and invalidation, existing motion/feeding/render checks, offline browser controls and all scene screenshots. Publish a matching 0.4.1 source tag, then verify the public HTTPS build.
