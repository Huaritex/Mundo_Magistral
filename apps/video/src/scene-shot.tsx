import type { CSSProperties } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useVideoConfig } from 'remotion';
import { MMScene } from '@mm/scene/MMScene';
import { canvasProps } from '@mm/scene/quality';
import type { SceneBlend } from '@mm/scene/blend';

const TAU = Math.PI * 2;
const TIER = 3 as const;

/**
 * Reloj periódico para loops. MMScene es lineal en `t` (giros a t*.12, t*.17..., ruido a uTime*.035): ninguna duración
 * lo cierra. Un vaivén senoidal de `t` sí: valor Y velocidad coinciden en el corte (último frame -> primero).
 */
export const loopT = (frame: number, duration: number, { center = 6, amp = 2.5 } = {}) =>
  center + amp * Math.sin((frame / duration) * TAU);

/** Progreso de fondo periódico (mueve el ruido del shader en sentido de ida y vuelta, sin corte). */
export const loopBg = (frame: number, duration: number, { center = 0.5, amp = 0.25, phase = 0 } = {}) =>
  center + amp * Math.sin((frame / duration) * TAU + phase);

export interface SceneShotProps {
  chapter: string;
  progress?: number;
  t: number;
  velocity?: number;
  blend?: SceneBlend;
  bgProgress?: number;
  backdrop?: boolean;
  /** Centro del logo/objeto en el cuadro, fracción 0..1 (por defecto centrado). */
  cx?: number;
  cy?: number;
  /** 'top': el canvas se pega al borde superior (ignora cy). Útil en vertical, donde el canvas no cubre el alto y solo se desvanece abajo. */
  anchor?: 'center' | 'top';
  /** Alto (px) del canvas: fija la escala del objeto (el logo hero mide ~94% de este alto y su aro ~77%), porque la cámara de MMScene tiene fov vertical fijo. Por defecto el alto del cuadro. */
  canvasHeight?: number;
}

/**
 * <ThreeCanvas><MMScene/></ThreeCanvas> posicionado en el cuadro. MMScene siempre centra el objeto y el fondo shader
 * llena SU canvas, así que para descentrar/escalar se dimensiona el canvas (ancho = lo que cubre el cuadro desde el
 * centro elegido) y el cuadro lo recorta. Si el canvas no llega a cubrir el alto, se desvanece contra el fondo night.
 */
export function SceneShot({ chapter, progress = 0, t, velocity = 0, blend, bgProgress, backdrop = true, cx = 0.5, cy = 0.5, anchor = 'center', canvasHeight }: SceneShotProps) {
  const { width: W, height: H } = useVideoConfig();
  const hPx = Math.round(canvasHeight ?? H);
  const centerX = cx * W;
  const centerY = cy * H;
  const wPx = Math.max(W, Math.round(2 * Math.max(centerX, W - centerX)));
  const left = Math.round(centerX - wPx / 2);
  const top = anchor === 'top' ? 0 : Math.round(centerY - hPx / 2);
  // Desvanecido contra el night del cuadro: sin él se ve la costura entre el fondo shader (con brillo teal) y el color plano.
  const fade = Math.round(hPx * 0.09);
  const fadeTop = top > 0 ? fade : 0;
  const fadeBottom = top + hPx < H ? fade : 0;
  const mask = fadeTop || fadeBottom
    ? `linear-gradient(to bottom, transparent 0, #000 ${fadeTop}px, #000 calc(100% - ${fadeBottom}px), transparent 100%)`
    : undefined;
  const style: CSSProperties = { position: 'absolute', left, top, width: wPx, height: hPx, WebkitMaskImage: mask, maskImage: mask };
  const props = canvasProps(TIER);
  return (
    <div style={style}>
      <ThreeCanvas
        width={wPx}
        height={hPx}
        {...props}
        dpr={1}
        gl={{ ...props.gl, preserveDrawingBuffer: true }}
        style={{ width: wPx, height: hPx }}
      >
        <MMScene tier={TIER} chapter={chapter} progress={progress} velocity={velocity} t={t} blend={blend} bgProgress={bgProgress} backdrop={backdrop} />
      </ThreeCanvas>
    </div>
  );
}
