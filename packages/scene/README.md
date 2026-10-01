# @mm/scene

Escena 3D de marca compartida por web (R3F) y video (Remotion). `<MMScene>` es función pura de props:
sin `useFrame`, reloj, `window`, scroll, gsap ni `Date`/`performance.now`/`Math.random` (`pnpm --filter @mm/scene check:pure` lo verifica).

## Subrutas
- `@mm/scene/MMScene`: `<MMScene tier chapter progress velocity t preview? form? pointer? blend? formBlend? bgProgress? backdrop? />`, `MMSceneHandle` (`apply()` imperativo, solo wrapper web).
- `@mm/scene/blend`: `resolveChapterBlend(from, to, k)`, `chapterState`, tipos `SceneBlend`/`BlendState` (sin three).
- `@mm/scene/chapters`: `CHAPTERS`, `PAGE_CHAPTER`, `getPreset` (sin three).
- `@mm/scene/quality`: `QUALITY`, `canvasProps(tier)` (cámara fov 37, `flat`, dpr cap, gl por tier).
- `@mm/scene/rig`: `createSceneRig`, `applyScene`, `disposeRig`.

## Props
`t` en segundos; `progress` 0..1 del capítulo; `velocity` ya suavizada; `tier` 1 no renderiza (póster), 2/3 calidad.
`blend = { from, k, fromChapter, fromProgress }`: transición hacia `preview ?? chapter`; `k` ya con easing. `from` acepta id de capítulo o un `BlendState` (snapshot).
`formBlend = { from, k }` anima el selector de formas.

## Remotion
```tsx
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { MMScene } from '@mm/scene/MMScene';
import { canvasProps } from '@mm/scene/quality';

export const BrandShot = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const k = interpolate(frame, [0, 42], [0, 1], { easing: Easing.bezier(.16, 1, .3, 1), extrapolateRight: 'clamp' });
  return (
    <ThreeCanvas width={width} height={height} {...canvasProps(3)}>
      <MMScene tier={3} chapter="mundo" progress={frame / 300} velocity={0} t={frame / fps}
        blend={{ from: 'hero', k, fromChapter: 'hero', fromProgress: 0 }} />
    </ThreeCanvas>
  );
};
```
`backdrop={false}` oculta el fondo shader (logo sobre transparente).
