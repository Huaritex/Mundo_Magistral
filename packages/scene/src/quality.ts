import type { Tier } from './types';

/** Niveles de calidad (idénticos a Stage.ts). Tier 1 = sin WebGL (póster). */
export const QUALITY = {
  2: { ambient: 160, morph: 1500, dprCap: 1.25, physical: false, antialias: false, power: 'low-power' as const },
  3: { ambient: 400, morph: 4000, dprCap: 1.75, physical: true, antialias: true, power: 'high-performance' as const },
} as const;

/** Props para <Canvas>/<ThreeCanvas>: cámara idéntica a Stage.ts y sin tone mapping (`flat`). */
export function canvasProps(tier: 2 | 3) {
  const q = QUALITY[tier];
  return {
    flat: true as const,
    dpr: [1, q.dprCap] as [number, number],
    camera: { fov: 37, near: 0.1, far: 100, position: [0, 0, 5.5] as [number, number, number] },
    gl: { alpha: true, antialias: q.antialias, powerPreference: q.power },
  };
}

export type { Tier };
