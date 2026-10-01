import { getPreset } from './chapters';
import type { SceneKey } from './types';

/** Sin three a propósito: el store web importa esto en el bundle inicial. Colores en RGB lineal (como THREE.Color). */
export type RGB = [number, number, number];

export const SCENE_KEYS: SceneKey[] = ['logo', 'globe', 'mortar', 'puzzle', 'mission', 'vision', 'products', 'capsule', 'none'];

/** Estado visual resuelto de un capítulo (o de una mezcla entre dos). */
export interface BlendState {
  camX: number;
  camZ: number;
  /** Desplazamiento vertical de cámara: solo se aplica en pantallas verticales (ver rig.ts). */
  camY: number;
  /** Semianchura (unidades de mundo) que el objeto necesita ver en vertical: la cámara se aleja hasta que quepa. 0 = sin ajuste. */
  fit: number;
  a: RGB;
  b: RGB;
  base: RGB;
  /** Opacidad de las partículas ambient. */
  particles: number;
  /** Opacidad 0..1 de cada escena. */
  scenes: Record<SceneKey, number>;
}

/** Extremo de una mezcla: id de capítulo o un BlendState ya resuelto (snapshot, para interrupciones a mitad de transición). */
export type BlendEnd = string | BlendState;

/** Transición en curso, tal como la recibe <MMScene>. El destino es siempre `preview ?? chapter`. */
export interface SceneBlend {
  from: BlendEnd;
  /** 0..1, ya con easing aplicado por quien lo calcula (gsap en web, interpolate en Remotion). */
  k: number;
  /** Capítulo saliente y su progreso congelado: definen la pose de las escenas que se desvanecen. */
  fromChapter: string;
  fromProgress: number;
}

const srgbToLinear = (c: number) => (c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4));
const hexToRgb = (hex: number): RGB => [
  srgbToLinear(((hex >> 16) & 255) / 255), srgbToLinear(((hex >> 8) & 255) / 255), srgbToLinear((hex & 255) / 255),
];

const cache = new Map<string, BlendState>();

/** Estado de reposo de un capítulo (k = 1). */
export function chapterState(chapter: string): BlendState {
  let state = cache.get(chapter);
  if (!state) {
    const preset = getPreset(chapter);
    const scenes = Object.fromEntries(SCENE_KEYS.map((key) => [key, key === preset.scene ? 1 : 0])) as Record<SceneKey, number>;
    state = {
      camX: preset.cameraX ?? 0, camZ: preset.cameraZ, camY: preset.cameraY ?? 0, fit: preset.fit ?? 0,
      a: hexToRgb(preset.a), b: hexToRgb(preset.b), base: hexToRgb(preset.base),
      particles: preset.particles ?? 0, scenes,
    };
    cache.set(chapter, state);
  }
  return state;
}

const mix = (x: number, y: number, k: number) => x + (y - x) * k;
const mixRgb = (x: RGB, y: RGB, k: number): RGB => [mix(x[0], y[0], k), mix(x[1], y[1], k), mix(x[2], y[2], k)];
const resolveEnd = (end: BlendEnd) => (typeof end === 'string' ? chapterState(end) : end);

/**
 * Interpolación pura entre dos capítulos (cámara, colores del fondo, partículas, opacidad de cada escena).
 * `k` se recorta a 0..1; el easing es responsabilidad del llamador.
 * Remotion: resolveChapterBlend('hero', 'mundo', interpolate(frame, [0, 42], [0, 1], { easing, extrapolateRight: 'clamp' })).
 */
export function resolveChapterBlend(from: BlendEnd, to: BlendEnd, k: number): BlendState {
  const kk = Math.min(1, Math.max(0, k));
  const f = resolveEnd(from);
  const t = resolveEnd(to);
  if (kk === 0) return f;
  if (kk === 1) return t;
  return {
    camX: mix(f.camX, t.camX, kk), camZ: mix(f.camZ, t.camZ, kk), camY: mix(f.camY, t.camY, kk), fit: mix(f.fit, t.fit, kk),
    a: mixRgb(f.a, t.a, kk), b: mixRgb(f.b, t.b, kk), base: mixRgb(f.base, t.base, kk),
    particles: mix(f.particles, t.particles, kk),
    scenes: Object.fromEntries(SCENE_KEYS.map((key) => [key, mix(f.scenes[key], t.scenes[key], kk)])) as Record<SceneKey, number>,
  };
}
