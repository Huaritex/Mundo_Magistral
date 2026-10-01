/**
 * Store del Stage 3D: sin React, sin dependencias salvo gsap y @mm/scene/blend (sin three).
 * Compatible con useSyncExternalStore: `getSnapshot()` devuelve una referencia NUEVA en cada cambio y la misma si nada cambió.
 *
 *   const tier = useSyncExternalStore(store.subscribe, () => store.getSnapshot().tier, () => 1);
 *
 * Campos de alta frecuencia (velocity, pointer, blend.k): leerlos con `store.getSnapshot()` dentro de useFrame,
 * no suscribir componentes React a ellos.
 *
 * Modelo:
 *  - `chapter`  capítulo activo por scroll/ruta. `preview` capítulo previsualizado por el menú (tiene prioridad visual).
 *  - `progress` 0..1 del capítulo; `pageProgress` 0..1 de la página (el fondo shader usa este si se informa, como Stage.ts).
 *  - `blend`    transición hacia `preview ?? chapter`; k (0..1, con easing) lo tweenea gsap; `from` es un snapshot,
 *               así que interrumpir a mitad no produce saltos.
 *  - `formBlend` tween de la selección de forma (k puede sobrepasar 1 por el ease `settle`).
 */
import { gsap } from 'gsap';
import { dur, ease } from '@mm/brand/motion';
import { chapterState, resolveChapterBlend, type SceneBlend } from '@mm/scene/blend';
import type { FormBlend } from '@mm/scene/rig';
import type { ProductKind, Tier } from '@mm/scene/types';

export interface StageState {
  chapter: string;
  progress: number;
  pageProgress: number | null;
  velocity: number;
  preview: string | null;
  form: ProductKind | null;
  tier: Tier;
  pointer: { x: number; y: number };
  /** false = fuera de viewport / oculto: el canvas no renderiza (equivale a setViewportActive de Stage.ts). */
  active: boolean;
  blend: SceneBlend;
  formBlend: FormBlend;
}

const FORMS = /^(capsula|crema|ovulo|gotero|jabon)$/;

let state: StageState = {
  chapter: 'hero', progress: 0, pageProgress: null, velocity: 0, preview: null, form: null, tier: 1,
  pointer: { x: .5, y: .5 }, active: true,
  blend: { from: 'hero', k: 1, fromChapter: 'hero', fromProgress: 0 },
  formBlend: { from: null, k: 1 },
};
const listeners = new Set<() => void>();
const set = (patch: Partial<StageState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

const driver = { blend: { k: 1 }, form: { k: 1 } };
const target = () => state.preview ?? state.chapter;
let blendTween: gsap.core.Tween | undefined;
let formTween: gsap.core.Tween | undefined;

/** Lleva la escena a `target` (preview ?? chapter) desde el estado visual actual. */
function retarget(prevTarget: string, target: string, immediate: boolean) {
  blendTween?.kill();
  if (prevTarget === target && state.blend.k >= 1) return;
  const { blend } = state;
  const running = blend.k < 1;
  // Snapshot de lo que se ve ahora: la transición nueva parte de ahí (sin saltos al interrumpir).
  const from = running ? resolveChapterBlend(blend.from, prevTarget, blend.k) : chapterState(prevTarget);
  const progress = state.preview && state.preview !== state.chapter ? 1 : state.progress;
  if (immediate || state.tier === 1) {
    set({ blend: { from: target, k: 1, fromChapter: target, fromProgress: 0 } });
    return;
  }
  driver.blend.k = 0;
  set({ blend: { from, k: 0, fromChapter: prevTarget, fromProgress: progress } });
  blendTween = gsap.to(driver.blend, {
    k: 1, duration: dur.chapter, ease: ease.enter,
    onUpdate: () => set({ blend: { ...state.blend, k: driver.blend.k } }),
  });
}

export const store = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: (): StageState => state,

  /** Capítulo activo por scroll/ruta. Si hay preview abierta solo se registra; la escena sigue en la preview. */
  goTo(chapter: string, immediate = false) {
    if (chapter === state.chapter && !immediate) return;
    if (state.preview) { set({ chapter }); return; }
    // fromProgress se congela con el progreso del capítulo que sale, antes de tocar `chapter`.
    retarget(state.chapter, chapter, immediate);
    set({ chapter });
  },
  setProgress(progress: number, pageProgress?: number) {
    set({ progress: Math.min(1, Math.max(0, progress)), pageProgress: pageProgress ?? state.pageProgress });
  },
  /** Velocidad de scroll ya suavizada (p. ej. lenis.velocity filtrada). */
  setVelocity(velocity: number) { if (velocity !== state.velocity) set({ velocity }); },
  previewChapter(chapter: string) {
    if (state.preview === chapter) return;
    retarget(target(), chapter, false);
    set({ preview: chapter });
  },
  endPreview() {
    if (state.preview === null) return;
    // El progreso que sale es el de la preview (se muestra completa); `retarget` lo calcula con preview aún activa.
    retarget(target(), state.chapter, false);
    set({ preview: null });
  },
  selectForm(kind: ProductKind | null) {
    if (kind === state.form || (kind !== null && !FORMS.test(kind))) return;
    formTween?.kill();
    driver.form.k = 0;
    set({ form: kind, formBlend: { from: state.form, k: 0 } });
    formTween = gsap.to(driver.form, {
      k: 1, duration: dur.ui, ease: ease.settle,
      onUpdate: () => set({ formBlend: { ...state.formBlend, k: driver.form.k } }),
    });
  },
  setTier(tier: Tier) { if (tier !== state.tier) set({ tier }); },
  setPointer(x: number, y: number) { set({ pointer: { x, y } }); },
  setActive(active: boolean) { if (active !== state.active) set({ active }); },
};
