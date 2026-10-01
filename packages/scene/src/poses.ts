import { MathUtils } from 'three';
import type { SceneKey } from './types';

const { clamp, smoothstep } = MathUtils;
export type Pose = Record<string, number>;

/**
 * Pose animada de una escena en función de (capítulo, progreso). Solo números: así se puede
 * interpolar (lerpPose) entre capítulos que comparten escena sin saltos y sin estado persistente.
 * En p = 0 coincide con el estado inicial de las geometrías.
 */
export function scenePose(scene: SceneKey, chapter: string, p: number): Pose {
  switch (scene) {
    case 'globe':
      return { rotY: -.25 + p * .8, pins: chapter === 'sedes' ? 1 : chapter === 'mundo' ? p : 0 };
    case 'mortar':
      return {
        globeY: .95 - p * 1.25, globeS: 1 - p * .8,
        pestleZ: -.53 + Math.sin(p * Math.PI * 4) * .2,
        morph: p, alpha: smoothstep(p, .28, .6),
      };
    case 'puzzle':
      return { l0: clamp(p * 4, 0, 1), l1: clamp(p * 4 - 1, 0, 1), l2: clamp(p * 4 - 2, 0, 1), l3: clamp(p * 4 - 3, 0, 1) };
    case 'mission':
      return { flagY: .98 + (1 - p) * .6 };
    case 'vision':
      return { light: .15 + p * 1.1, glass: .15 + p * .65 };
    case 'capsule':
      return {
        rotZ: p * Math.PI * .5, y0: .18 + p * .45, y1: .36 + p * .45, y2: -.18 - p * .45, y3: -.36 - p * .45,
        dustS: .3 + p * 2.5, dustO: smoothstep(p, .23, .7) * .75,
      };
    default:
      return {};
  }
}

export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  const out: Pose = {};
  for (const key in b) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}
