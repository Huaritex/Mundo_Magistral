import { detectStageTier, reducedMotion } from '../stage/tier';
import type { Stage } from '../stage/Stage';
import type { MotionController } from './scroll';

type FormSelectEvent = CustomEvent<{ forma?: string }>;
type MotionPreferenceEvent = CustomEvent<{ reduce?: boolean }>;

type LightReveals = typeof import('./motion-reveal');
let lightReveals: LightReveals | undefined;

type Runtime = {
  stage?: Stage;
  motion?: MotionController;
  pending?: Promise<void>;
  canceled: boolean;
};

declare global {
  interface Window { __mmStageRuntime?: Runtime }
}

if (!window.__mmStageRuntime) {
  const runtime: Runtime = { canceled: false };
  window.__mmStageRuntime = runtime;
  // Marca de montaje de página (la usa motion-reveal para el intro del eyebrow). Debe registrarse antes que el bind.
  document.addEventListener('astro:page-load', () => { window.__mmPageAt = performance.now(); });
  document.documentElement.classList.toggle('reduce-motion', reducedMotion());

  const staticRoute = () => {
    document.documentElement.dataset.stageTier = '1';
    document.getElementById('stage-poster')?.style.setProperty('opacity', '1');
    const canvas = document.getElementById('stage');
    if (canvas) canvas.style.opacity = '0';
    const video = document.querySelector<HTMLVideoElement>('[data-hero-loop]');
    if (video && !reducedMotion() && !document.hidden) {
      if (!video.src) {
        const portrait = window.matchMedia('(max-width: 700px)').matches;
        const av1 = video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== '';
        video.src = `/media/hero-backdrop${portrait ? '-vertical' : ''}${av1 ? '-av1' : ''}.mp4`;
      }
      void video.play().catch(() => {});
    }
    void bindLightReveals();
  };

  /** Tier 1 sin reduced motion: reveals ligeros (sin SplitText/scrub), cargados bajo demanda. */
  const bindLightReveals = async () => {
    if (reducedMotion() || runtime.motion) return;
    const body = document.body;
    const mod = await import('./motion-reveal');
    // Si mientras tanto cambió la página, el Stage tomó el control o se pidió menos movimiento, no se enlaza.
    if (document.body !== body || runtime.motion || reducedMotion()) return;
    lightReveals = mod;
    mod.bindLight();
  };

  const chapterForUrl = (url: URL): string => {
    const path = url.pathname;
    if (path === '/') return 'hero';
    if (path.startsWith('/nosotros')) return 'filosofia';
    if (path.startsWith('/especialidades')) return 'especialidades';
    if (path.startsWith('/formas')) return 'formas';
    if (path.startsWith('/sucursales')) return 'sedes';
    if (path.startsWith('/medicos')) return 'medicos';
    if (path.startsWith('/cotizar')) return 'cotizar';
    if (path.startsWith('/preguntas')) return 'faq';
    return '404';
  };

  const init = async () => {
    if (runtime.stage || runtime.pending || runtime.canceled || reducedMotion()) {
      if (reducedMotion()) staticRoute();
      return runtime.pending;
    }
    runtime.pending = (async () => {
      const tier = await detectStageTier();
      if (runtime.canceled || tier === 1) { staticRoute(); return; }
      const canvas = document.getElementById('stage');
      if (!(canvas instanceof HTMLCanvasElement)) { staticRoute(); return; }
      try {
        const [{ Stage }, { createMotionController }] = await Promise.all([
          import('../stage/Stage'), import('./scroll'),
        ]);
        if (runtime.canceled) return;
        runtime.stage = new Stage(canvas, tier);
        document.documentElement.dataset.stageTier = String(tier);
        runtime.motion = createMotionController(runtime.stage);
        lightReveals?.releaseLight();
        runtime.motion.bindPage();
      } catch (error) {
        console.warn('Stage unavailable; using static artwork.', error);
        runtime.motion?.dispose();
        runtime.stage?.dispose();
        runtime.motion = undefined;
        runtime.stage = undefined;
        staticRoute();
      }
    })().finally(() => { runtime.pending = undefined; });
    return runtime.pending;
  };

  // Keep the first paint and poster LCP free of the WebGL compile cost.
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => { void init(); }, { timeout: 1500 });
    } else {
      setTimeout(() => { void init(); }, 450);
    }
  };

  document.addEventListener('astro:before-preparation', (event) => {
    if (!runtime.stage) return;
    const destination = (event as Event & { to?: URL }).to;
    if (destination) runtime.stage.goTo(chapterForUrl(destination));
  });
  document.addEventListener('astro:before-swap', () => { runtime.motion?.releasePage(); lightReveals?.releaseLight(); });
  document.addEventListener('astro:after-swap', () => runtime.motion?.scrollTop());
  document.addEventListener('astro:page-load', () => {
    const currentCanvas = document.getElementById('stage');
    if (runtime.stage && runtime.stage.canvas !== currentCanvas) {
      runtime.motion?.dispose();
      runtime.stage.dispose();
      runtime.motion = undefined;
      runtime.stage = undefined;
      schedule();
    } else if (runtime.motion) {
      lightReveals?.releaseLight();
      runtime.motion.bindPage();
    } else {
      schedule();
    }
  });

  document.addEventListener('mm:form-select', (event) => {
    const kind = (event as FormSelectEvent).detail?.forma;
    if (kind && /^(capsula|crema|ovulo|gotero|jabon)$/.test(kind)) {
      runtime.stage?.selectForm(kind as Parameters<Stage['selectForm']>[0]);
    }
  });

  document.addEventListener('mm:motion-preference', (event) => {
    const reduce = (event as MotionPreferenceEvent).detail?.reduce;
    if (reduce === undefined) return;
    document.documentElement.classList.toggle('reduce-motion', reduce);
    if (reduce) {
      lightReveals?.releaseLight();
      document.querySelector<HTMLVideoElement>('[data-hero-loop]')?.pause();
      runtime.canceled = true;
      runtime.motion?.dispose();
      runtime.stage?.dispose();
      runtime.motion = undefined;
      runtime.stage = undefined;
      staticRoute();
    } else {
      runtime.canceled = false;
      schedule();
    }
  });

  // Hover/focus en un link del menú overlay: el Stage previsualiza el capítulo de esa página.
  document.addEventListener('mm:nav-preview', (event) => {
    const { chapter, active } = (event as CustomEvent<{ chapter?: string; active?: boolean }>).detail ?? {};
    if (active && chapter) runtime.motion?.previewChapter(chapter);
    else runtime.motion?.endPreview();
  });

  document.addEventListener('mm:stage-lost', () => {
    runtime.canceled = true;
    runtime.motion?.dispose();
    runtime.stage?.dispose();
    runtime.motion = undefined;
    runtime.stage = undefined;
    staticRoute();
  });

  document.addEventListener('visibilitychange', () => {
    const video = document.querySelector<HTMLVideoElement>('[data-hero-loop]');
    if (document.hidden) video?.pause();
    else {
      if (document.documentElement.dataset.stageTier === '1' && !reducedMotion()) void video?.play().catch(() => {});
      runtime.stage?.render(performance.now() / 1000, 0);
    }
  });
  schedule();
}
