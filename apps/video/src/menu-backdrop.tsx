import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { chapterState } from '@mm/scene/blend';
import { SceneShot, loopBg, loopT } from './scene-shot';
import { linearRgbToCss } from './timeline';

// Fondo del menú: solo el fondo shader + partículas de @mm/scene. El capítulo `especialidades` no tiene objeto 3D
// (scene: 'none'), así que el menú comparte paleta (blanco principal con flujo lila/turquesa), ruido y partículas con el sitio.
// Marcas moradas: un velo violeta muy suave hacia las esquinas (el menú del sitio añade además sus degradados).
// Loop exacto: t y bgProgress oscilan con periodo = duración (ver loopT/loopBg).
export const MENU_CHAPTER = 'especialidades';

export function MenuBackdrop() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: linearRgbToCss(chapterState(MENU_CHAPTER).base), overflow: 'hidden' }}>
      <SceneShot chapter={MENU_CHAPTER} t={loopT(frame, durationInFrames, { center: 6, amp: 6 })} bgProgress={loopBg(frame, durationInFrames, { amp: 0.5 })} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(111,72,151,0) 40%, rgba(111,72,151,.14) 100%)' }} />
    </AbsoluteFill>
  );
}
