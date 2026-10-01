import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, type Ref } from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { applyScene, createSceneRig, disposeRig, type SceneInput } from './rig';
import type { Tier } from './types';

export type { SceneInput, FormBlend, Pointer } from './rig';
export type { SceneBlend } from './blend';

export interface MMSceneProps extends SceneInput {
  /** 1 = sin WebGL: no renderiza nada (el póster estático cubre). */
  tier: Tier;
}

/** Ruta imperativa opcional (solo wrapper web): aplica un frame sin re-render de React. */
export interface MMSceneHandle { apply: (input: SceneInput) => void }

/**
 * Escena de marca: función pura de props. Sin reloj propio, sin scroll, sin DOM: todo lo animado sale de
 * `t`, `progress`, `velocity`, `blend`... Mismo resultado en web (R3F) y en Remotion (<ThreeCanvas>).
 * Debe ir dentro de <Canvas>/<ThreeCanvas> con `canvasProps(tier)` (cámara fov 37, `flat`).
 */
export function MMScene({ tier, ref, ...input }: MMSceneProps & { ref?: Ref<MMSceneHandle> }) {
  const rig = useMemo(() => (tier === 1 ? null : createSceneRig(tier)), [tier]);
  useEffect(() => () => { if (rig) disposeRig(rig); }, [rig]);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  const apply = useCallback((next: SceneInput) => {
    if (rig) applyScene(rig, next, { camera: camera as PerspectiveCamera, aspect: size.width / Math.max(1, size.height) });
  }, [rig, camera, size]);
  useImperativeHandle(ref, () => ({ apply }), [apply]);

  // Cada commit aplica las props (Remotion: un commit por frame; web: solo al montar/redimensionar).
  useLayoutEffect(() => { apply(input); invalidate(); });
  return rig ? <primitive object={rig.root} /> : null;
}
