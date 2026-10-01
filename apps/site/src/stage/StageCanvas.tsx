/**
 * Canvas R3F del Stage. DEFAULT export para React.lazy; solo cliente. Vive en el layout (no se remonta al navegar).
 * Montar dentro de `.stage-backdrop`, después del póster:
 *   <div class="stage-backdrop"><img id="stage-poster" .../><Suspense fallback={null}><StageCanvas /></Suspense></div>
 * (o directamente <StageHost />, que detecta el tier y hace el lazy).
 */
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MMScene, type MMSceneHandle } from '@mm/scene/MMScene';
import { canvasProps } from '@mm/scene/quality';
import type { Tier } from '@mm/scene/types';
import { store } from './store';

const STATIC_CHAPTERS = new Set(['cotizar', 'faq', 'footer']);
const poster = () => document.getElementById('stage-poster');

const subscribeHidden = (cb: () => void) => { document.addEventListener('visibilitychange', cb); return () => document.removeEventListener('visibilitychange', cb); };

function Bridge({ tier }: { tier: 2 | 3 }) {
  const scene = useRef<MMSceneHandle>(null);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const rt = useRef({ velocity: 0, lastRender: -1, shown: false, lost: false, timer: undefined as ReturnType<typeof setTimeout> | undefined });
  const demand = tier === 2;

  // demand: cualquier cambio del store pide un frame.
  useEffect(() => store.subscribe(() => invalidate()), [invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (event: PointerEvent) => store.setPointer(event.clientX / innerWidth, 1 - event.clientY / innerHeight);
    const onLost = (event: Event) => {
      event.preventDefault();
      if (rt.current.lost || !canvas.isConnected) return;
      rt.current.lost = true;
      canvas.style.opacity = '0';
      poster()?.style.setProperty('opacity', '1');
      document.documentElement.dataset.stageTier = '1';
      document.dispatchEvent(new Event('mm:stage-lost'));
    };
    addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('webglcontextlost', onLost);
    const state = rt.current;
    return () => {
      removeEventListener('pointermove', onMove);
      canvas.removeEventListener('webglcontextlost', onLost);
      clearTimeout(state.timer);
    };
  }, [gl]);

  // Prioridad 1: R3F deja de renderizar solo y renderizamos aquí (pausas y throttles del Stage original).
  useFrame((state, delta) => {
    const s = store.getSnapshot();
    const r = rt.current;
    const time = state.clock.elapsedTime;
    const target = s.preview ?? s.chapter;
    const typing = document.body.dataset.page === 'cotizar' && !!document.activeElement?.closest('form');
    const throttled = STATIC_CHAPTERS.has(target) && time - r.lastRender < .1;
    let wait = demand ? 1000 / 30 : 0;
    if (!s.active || typing || r.lost) wait = 250;
    else if (throttled) wait = 100;
    else {
      // velocity llega ya suavizada por el scroll; aquí solo se filtra para el fondo (0.1/frame a 60 fps).
      r.velocity += (s.velocity - r.velocity) * (1 - Math.exp(-Math.min(delta, .05) * 6.3));
      scene.current?.apply({
        chapter: s.chapter, progress: s.progress, bgProgress: s.pageProgress ?? undefined, velocity: r.velocity,
        t: time, preview: s.preview, form: s.form, formBlend: s.formBlend, blend: s.blend, pointer: s.pointer,
      });
      state.gl.render(state.scene, state.camera);
      r.lastRender = time;
      // Contador de frames realmente dibujados (lo lee el e2e "Stage sigue dibujando durante la navegación").
      const w = window as unknown as { __mmFrames?: number };
      w.__mmFrames = (w.__mmFrames ?? 0) + 1;
      if (!r.shown) {
        r.shown = true;
        const canvas = state.gl.domElement;
        void canvas.offsetWidth; // fija opacity:0 antes de animar: crossfade sobre el póster
        canvas.style.opacity = '1';
        poster()?.style.setProperty('opacity', '0');
        document.documentElement.dataset.stageTier = String(tier);
      }
    }
    if (demand || wait) { clearTimeout(r.timer); r.timer = setTimeout(invalidate, wait || 1000 / 30); }
  }, 1);

  return <MMScene ref={scene} tier={tier} chapter="hero" progress={0} velocity={0} t={0} />;
}

export default function StageCanvas() {
  const tier = useSyncExternalStore(store.subscribe, () => store.getSnapshot().tier, () => 1 as Tier);
  const hidden = useSyncExternalStore(subscribeHidden, () => document.hidden, () => false);
  const props = useMemo(() => (tier === 1 ? null : canvasProps(tier)), [tier]);
  if (tier === 1 || !props) return null;
  return (
    <Canvas
      key={tier}
      {...props}
      frameloop={hidden ? 'never' : tier === 3 ? 'always' : 'demand'}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
      onCreated={({ gl }) => { gl.domElement.id = 'stage'; gl.domElement.setAttribute('aria-hidden', 'true'); gl.domElement.style.opacity = '0'; }}
    >
      <Bridge tier={tier} />
    </Canvas>
  );
}
