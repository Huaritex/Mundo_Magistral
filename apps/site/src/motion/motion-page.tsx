import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, useGSAP } from './motion-gsap';
import { bridge, chapterForPath, resetScroll } from './bridge';
import { bindPage } from './motion-scroll';
import { store } from '../stage/store';
import { normalizePath } from '../lib/site';
import { reducedMotion } from '../lib/motion-pref';

/**
 * Runtime de movimiento (chunk `motion-*`, se carga en idle desde MotionProvider; nunca en el JS inicial).
 *
 *   off   sin animaciones: reduced motion, o el tier aún no se detectó (StageHost lo publica en el store; el 1 inicial
 *         del store NO es un "tier 1 detectado", así que se espera a que llegue un tier >= 2 o venza un plazo).
 *   light tier 1 confirmado: reveals ligeros (fade/translate/clip), sin Lenis ni scrub ni puente al Stage.
 *   full  tier 2/3: Lenis + ScrollTrigger en UN solo gsap.ticker, pins/scrub/SplitText y puente al Stage.
 *
 * `mm:nav-preview` (previsualización 3D del menú) y `mm:motion-preference` (tier) ya los enlaza stage/events.ts
 * (StageHost): aquí NO se duplican.
 */
type Mode = 'off' | 'light' | 'full';

/** Plazo tras el que un tier que sigue en 1 se da por detectado (StageHost detecta en idle, timeout 1500 ms). */
const TIER_SETTLE_MS = 1800;

const subscribeTier = store.subscribe;
const tierSnapshot = () => store.getSnapshot().tier;
const serverTier = () => 1;

function useMode(): Mode {
  const tier = useSyncExternalStore(subscribeTier, tierSnapshot, serverTier);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (tier > 1) return;
    const id = window.setTimeout(() => setSettled(true), TIER_SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [tier]);
  if (reducedMotion()) return 'off';
  return tier > 1 ? 'full' : settled ? 'light' : 'off';
}

/** Lenis + ScrollTrigger + velocidad del Stage en UN solo gsap.ticker (solo modo full). */
function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ duration: 1.08, smoothWheel: true, touchMultiplier: 1.2 });
    bridge.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
    let velocity = 0;
    const tick = (time: number) => {
      lenis.raf(time * 1000);
      // Suavizado ligero + zona muerta: en reposo llega a 0 y setVelocity deja de notificar (el Stage en `demand` no se despierta).
      velocity += (lenis.velocity - velocity) * .25;
      store.setVelocity(Math.abs(velocity) < .02 ? 0 : velocity);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // valores por defecto de GSAP
      lenis.destroy();
      bridge.lenis = null;
      store.setVelocity(0);
      // Lenis 1.3.26: su timer interno de velocidad puede volver a poner la clase `lenis` tras destroy(): barrido final.
      const sweep = () => {
        if (bridge.lenis) return; // ya hay otra instancia (cambio rápido de modo)
        const root = document.documentElement;
        [...root.classList].forEach((c) => { if (c === 'lenis' || c.startsWith('lenis-')) root.classList.remove(c); });
      };
      sweep();
      window.setTimeout(sweep, 500);
    };
  }, [enabled]);
}

/** Antes de que llegue el DOM nuevo el Stage ya viaja al capítulo destino (equivale a astro:before-preparation). */
function useNavBridge(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onNav = (event: Event) => {
      const chapter = (event as CustomEvent<{ chapter?: string }>).detail?.chapter;
      if (chapter) store.goTo(chapter);
    };
    document.addEventListener('mm:nav-start', onNav);
    return () => document.removeEventListener('mm:nav-start', onNav);
  }, [enabled]);
}

/** Tier 1 sin reduced motion: bucle de vídeo de respaldo detrás de las secciones, pausado con la pestaña oculta. */
function useHeroLoop(enabled: boolean, pathname: string) {
  useEffect(() => {
    if (!enabled) return;
    const video = document.querySelector<HTMLVideoElement>('[data-hero-loop]');
    if (!video) return;
    const play = () => {
      if (document.hidden) { video.pause(); return; }
      if (!video.getAttribute('src')) {
        const portrait = matchMedia('(max-width: 700px)').matches;
        const av1 = video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== '';
        video.src = `/media/hero-backdrop${portrait ? '-vertical' : ''}${av1 ? '-av1' : ''}.mp4`;
      }
      void video.play().catch(() => {});
    };
    play();
    document.addEventListener('visibilitychange', play);
    return () => { document.removeEventListener('visibilitychange', play); video.pause(); };
  }, [enabled, pathname]);
}

export default function MotionPage({ scope }: { scope: RefObject<HTMLElement | null> }) {
  const { pathname, key, hash } = useLocation();
  const mode = useMode();
  const path = normalizePath(pathname);
  const lastPath = useRef(path);
  const pageAt = useRef(-Infinity); // La carga inicial no anima el hero después del idle.
  const readyBeforeNavigation = useRef(false);
  // Registrar la navegación incluso si el tier todavía está pendiente: evita una entrada tardía al pasar a light.
  useLayoutEffect(() => {
    if (lastPath.current === path) return;
    lastPath.current = path;
    readyBeforeNavigation.current = document.documentElement.dataset.gsapNavReady === '1';
    pageAt.current = performance.now();
  }, [path]);

  // Declarado antes que useGSAP (mismo commit): el scroll ya está arriba cuando se miden los ScrollTrigger.
  useLayoutEffect(() => resetScroll(key, hash), [key, hash]);

  useSmoothScroll(mode === 'full');
  useNavBridge(mode === 'full');
  useHeroLoop(mode === 'light', path);

  // La navegación puede omitir el snapshot nativo del contenido cuando GSAP ya está listo para animar el nuevo DOM.
  useEffect(() => {
    const root = document.documentElement;
    if (mode !== 'off') root.dataset.gsapNavReady = '1';
    else delete root.dataset.gsapNavReady;
    return () => { delete root.dataset.gsapNavReady; };
  }, [mode]);

  const { context } = useGSAP(() => {
    if (mode === 'off') return;
    return bindPage({ mode, path, fallbackChapter: chapterForPath(path), fresh: readyBeforeNavigation.current && performance.now() - pageAt.current < 700 });
  }, { scope, dependencies: [path, mode], revertOnUpdate: true });

  // PageScope (Layout) revierte el contexto en su cleanup: los pins deben deshacerse ANTES de que React quite los nodos.
  useEffect(() => {
    bridge.release = () => context.revert();
    return () => { bridge.release = undefined; };
  }, [context]);

  // Solo lectura, para el test de fugas (ScrollTrigger.getAll().length estable tras N navegaciones).
  useEffect(() => {
    (window as unknown as { __mmMotion?: { triggers: () => number } }).__mmMotion = { triggers: () => ScrollTrigger.getAll().length };
  }, []);

  return null;
}
