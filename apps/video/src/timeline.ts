import { Easing, interpolate } from 'remotion';
import { chapterState, resolveChapterBlend, type BlendState, type SceneBlend } from '@mm/scene/blend';

/** Tramo de una secuencia de capítulos: el capítulo rige de `start` a `end` (frames) y su progreso va de 0 a 1. */
export interface Segment {
  chapter: string;
  start: number;
  end: number;
}

/** Misma curva que la web usa al cambiar de capítulo (ease-out expo suave). */
export const blendEase = Easing.bezier(0.16, 1, 0.3, 1);

export interface SceneAt {
  chapter: string;
  progress: number;
  blend?: SceneBlend;
  /** Estado de fondo/cámara ya mezclado (resolveChapterBlend): sirve para adaptar textos a la luminosidad del fondo. */
  state: BlendState;
  /** Índice del tramo activo y frame local dentro de él. */
  index: number;
  local: number;
}

/**
 * Función pura de `frame`: capítulo activo, progreso 0..1 y transición desde el tramo anterior.
 * El progreso saliente se congela en el valor que tenía al empezar la transición (fromProgress), como hace la web.
 */
export function sceneAt(frame: number, segments: Segment[], blendFrames = 36): SceneAt {
  let index = 0;
  segments.forEach((segment, i) => { if (frame >= segment.start) index = i; });
  const seg = segments[index];
  const progress = interpolate(frame, [seg.start, seg.end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const local = frame - seg.start;
  if (index === 0) return { chapter: seg.chapter, progress, state: chapterState(seg.chapter), index, local };
  const prev = segments[index - 1];
  const k = interpolate(frame, [seg.start, seg.start + blendFrames], [0, 1], {
    easing: blendEase, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const fromProgress = interpolate(seg.start, [prev.start, prev.end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const state = resolveChapterBlend(prev.chapter, seg.chapter, k);
  const blend: SceneBlend | undefined = k < 1 ? { from: prev.chapter, k, fromChapter: prev.chapter, fromProgress } : undefined;
  return { chapter: seg.chapter, progress, blend, state, index, local };
}

/** Luminancia (0..1, lineal) del fondo resuelto: los canales de BlendState ya vienen en RGB lineal. */
export const baseLuma = (state: BlendState) => 0.2126 * state.base[0] + 0.7152 * state.base[1] + 0.0722 * state.base[2];

const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
/** RGB lineal (como BlendState.base) -> color CSS sRGB: el relleno bajo el canvas coincide con el uBase del shader. */
export const linearRgbToCss = ([r, g, b]: [number, number, number]) =>
  `rgb(${[r, g, b].map((c) => Math.round(255 * Math.min(1, Math.max(0, linearToSrgb(c))))).join(',')})`;
