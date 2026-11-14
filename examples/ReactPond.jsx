'use client';

import { useEffect, useRef } from 'react';
import { createKoiPond } from '@dhruvil-codes/koi-pond';

/**
 * A client-side canvas pond. The controller is mounted once per effect lifecycle;
 * settings changes update that controller without replacing the simulation.
 */
export function ReactPond({
  environment = 'zen',
  fishCount = 12,
  speed = 1.35,
  fishSize = 1,
  behavior = 'wander',
}) {
  const canvasRef = useRef(null);
  const pondRef = useRef(null);

  useEffect(() => {
    const pond = createKoiPond(canvasRef.current);
    pondRef.current = pond;
    return () => {
      pond.destroy();
      pondRef.current = null;
    };
  }, []);

  useEffect(() => {
    pondRef.current?.setOptions({ environment, fishCount, speed, fishSize, behavior });
  }, [environment, fishCount, speed, fishSize, behavior]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive koi pond"
      style={{ display: 'block', width: '100%', height: 480 }}
    />
  );
}
